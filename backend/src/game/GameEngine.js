const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export class GameEngine {
    rooms = new Map();
    createRoom(roomId) {
        const room = {
            id: roomId,
            players: [],
            state: 'LOBBY',
            currentTurnId: null,
            centerCards: [],
            ledSuit: null,
            kazhuthaId: null,
            lastTrickMessage: null,
            finishedOrder: [],
            isFirstLead: true,
        };
        this.rooms.set(roomId, room);
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    addPlayer(roomId, playerId, sessionToken, name) {
        let room = this.getRoom(roomId);
        if (!room) {
            room = this.createRoom(roomId);
        }
        const existingPlayer = room.players.find(p => p.sessionToken === sessionToken);
        if (existingPlayer) {
            existingPlayer.id = playerId;
            existingPlayer.isConnected = true;
            existingPlayer.name = name;
            return room;
        }
        // check room limit
        if (room.players.length >= 7) {
            throw new Error('Room is full (max 7 players)');
        }
        // If joining during an active game, join as spectator!
        const isSpectator = room.state === 'PLAYING';
        const isHost = room.players.length === 0;
        room.players.push({
            id: playerId,
            sessionToken,
            name,
            hand: [],
            isConnected: true,
            isHost,
            isSpectator,
            ping: 0
        });
        return room;
    }
    reconnectPlayer(roomId, sessionToken, newSocketId) {
        const room = this.getRoom(roomId);
        if (!room)
            return null;
        const player = room.players.find(p => p.sessionToken === sessionToken);
        if (!player)
            return null;
        const oldSocketId = player.id;
        player.id = newSocketId;
        player.isConnected = true;
        if (room.currentTurnId === oldSocketId) {
            room.currentTurnId = newSocketId;
        }
        room.centerCards.forEach(c => {
            if (c.playerId === oldSocketId) {
                c.playerId = newSocketId;
            }
        });
        return { room, player };
    }
    updatePlayerPing(roomId, playerId, ping) {
        const room = this.getRoom(roomId);
        if (!room)
            return;
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.ping = ping;
        }
    }
    removePlayer(roomId, playerId) {
        const room = this.getRoom(roomId);
        if (!room)
            return null;
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.isConnected = false;
        }
        if (room.state === 'LOBBY') {
            room.players = room.players.filter(p => p.id !== playerId);
            if (room.players.length > 0 && !room.players.some(p => p.isHost)) {
                const first = room.players[0];
                if (first)
                    first.isHost = true;
            }
        }
        if (room.players.length === 0 || room.players.every(p => !p.isConnected)) {
            setTimeout(() => {
                const r = this.getRoom(roomId);
                if (r && r.players.every(p => !p.isConnected)) {
                    this.rooms.delete(roomId);
                }
            }, 300000);
        }
        return room;
    }
    kickPlayer(roomId, hostSocketId, targetPlayerId) {
        const room = this.getRoom(roomId);
        if (!room)
            throw new Error('Room not found');
        const host = room.players.find(p => p.id === hostSocketId);
        if (!host || !host.isHost)
            throw new Error('Only host can kick players');
        if (hostSocketId === targetPlayerId)
            throw new Error('Host cannot kick themselves');
        room.players = room.players.filter(p => p.id !== targetPlayerId);
        if (room.currentTurnId === targetPlayerId) {
            const active = this.getActivePlayers(room);
            room.currentTurnId = active[0] ? active[0].id : null;
        }
        this.checkWinner(room);
        return room;
    }
    resetToLobby(roomId) {
        const room = this.getRoom(roomId);
        if (!room)
            throw new Error('Room not found');
        room.state = 'LOBBY';
        room.centerCards = [];
        room.ledSuit = null;
        room.kazhuthaId = null;
        room.lastTrickMessage = null;
        room.currentTurnId = null;
        room.finishedOrder = [];
        room.players.forEach(p => {
            p.hand = [];
            p.isSpectator = false;
        });
        return room;
    }
    startGame(roomId) {
        const room = this.getRoom(roomId);
        if (!room)
            throw new Error('Room not found');
        // Include all connected players including former spectators
        room.players.forEach(p => {
            p.hand = [];
            p.isSpectator = false;
        });
        const activePlayers = room.players.filter(p => p.isConnected);
        if (activePlayers.length < 2)
            throw new Error('Not enough active players to start');
        if (activePlayers.length > 7)
            throw new Error('Maximum 7 players allowed');
        room.state = 'PLAYING';
        room.centerCards = [];
        room.ledSuit = null;
        room.kazhuthaId = null;
        room.lastTrickMessage = null;
        room.finishedOrder = [];
        room.isFirstLead = true;
        const deck = this.createDeck();
        this.shuffle(deck);
        this.dealCards(room, deck);
        const starter = room.players.find(p => p.hand.some(c => c.suit === 'Spades' && c.rank === 'A'));
        const firstPlayer = room.players[0];
        room.currentTurnId = starter ? starter.id : (firstPlayer ? firstPlayer.id : null);
        return room;
    }
    playCard(roomId, playerId, card) {
        const room = this.getRoom(roomId);
        if (!room)
            throw new Error('Room not found');
        if (room.state !== 'PLAYING')
            throw new Error('Game not running');
        if (room.currentTurnId !== playerId)
            throw new Error('Not your turn');
        const player = room.players.find(p => p.id === playerId);
        if (!player)
            throw new Error('Player not found');
        if (player.isSpectator)
            throw new Error('Spectators cannot play cards');
        // Prevent playing multiple cards in the same trick
        if (room.centerCards.some(c => c.playerId === playerId)) {
            throw new Error('You have already played a card in this trick');
        }
        // Prevent playing while trick is full or Vettu cut is waiting to clear
        const activePlayers = this.getActivePlayers(room);
        if (room.centerCards.length >= activePlayers.length) {
            throw new Error('Waiting for trick to clear');
        }
        if (room.ledSuit && room.centerCards.some(c => c.card.suit !== room.ledSuit)) {
            throw new Error('Waiting for trick to clear');
        }
        const cardIndex = player.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
        if (cardIndex === -1)
            throw new Error('Card not in hand');
        if (room.centerCards.length === 0) {
            room.ledSuit = card.suit;
            room.lastTrickMessage = null;
        }
        else {
            if (card.suit !== room.ledSuit) {
                const hasSuit = player.hand.some(c => c.suit === room.ledSuit);
                if (hasSuit)
                    throw new Error('Must follow suit');
            }
        }
        player.hand.splice(cardIndex, 1);
        room.centerCards.push({ playerId, card });
        room.isFirstLead = false;
        let trickFinished = false;
        let isVettu = false;
        // Cut / Vettu
        if (room.ledSuit && card.suit !== room.ledSuit) {
            trickFinished = true;
            isVettu = true;
            const highestLedCardPlay = this.getHighestLedCardPlay(room.centerCards, room.ledSuit);
            if (highestLedCardPlay) {
                const penaltyPlayer = room.players.find(p => p.id === highestLedCardPlay.playerId);
                if (penaltyPlayer) {
                    penaltyPlayer.hand.push(...room.centerCards.map(tc => tc.card));
                    room.currentTurnId = penaltyPlayer.id;
                    room.lastTrickMessage = `💥 VETTU! ${player.name} cut the suit. ${penaltyPlayer.name} picks up the cards!`;
                }
            }
        }
        else {
            const activePlayers = this.getActivePlayers(room);
            if (room.centerCards.length === activePlayers.length) {
                trickFinished = true;
                const highestLedCardPlay = this.getHighestLedCardPlay(room.centerCards, room.ledSuit);
                if (highestLedCardPlay) {
                    const winnerPlayer = room.players.find(p => p.id === highestLedCardPlay.playerId);
                    room.currentTurnId = highestLedCardPlay.playerId;
                    // next player turn
                    room.lastTrickMessage = `✨ ${winnerPlayer?.name ?? 'Player'}'s turn!`;
                }
            }
            else {
                room.currentTurnId = this.getNextPlayerId(room, playerId);
            }
        }
        this.checkWinner(room);
        return { room, trickFinished, isVettu, nextPlayerId: room.currentTurnId };
    }
    clearCenterCards(roomId) {
        const room = this.getRoom(roomId);
        if (!room)
            return null;
        room.centerCards = [];
        room.ledSuit = null;
        this.checkWinner(room);
        return room;
    }
    // malathi action
    declareMalathi(roomId, playerId) {
        const room = this.getRoom(roomId);
        if (!room)
            throw new Error('Room not found');
        if (room.state !== 'PLAYING')
            throw new Error('Game is not active');
        const player = room.players.find(p => p.id === playerId);
        if (!player)
            throw new Error('Player not found');
        if (player.isSpectator)
            throw new Error('Spectators cannot declare Malathi');
        room.state = 'FINISHED';
        room.kazhuthaId = player.id;
        room.currentTurnId = null;
        room.lastTrickMessage = `🏳️ ${player.name} declared Malathi and accepted defeat!`;
        return room;
    }
    checkWinner(room) {
        if (!room.finishedOrder)
            room.finishedOrder = [];
        for (const p of room.players) {
            if (!p.isSpectator) {
                const hasNoCardsInHand = p.hand.length === 0;
                const hasNoCardsInCenter = !room.centerCards.some(c => c.playerId === p.id);
                const isFinished = hasNoCardsInHand && hasNoCardsInCenter;
                if (isFinished && !room.finishedOrder.includes(p.id)) {
                    room.finishedOrder.push(p.id);
                }
                else if (!isFinished && room.finishedOrder.includes(p.id)) {
                    room.finishedOrder = room.finishedOrder.filter(id => id !== p.id);
                }
            }
        }
        const activePlayers = this.getActivePlayers(room);
        if (activePlayers.length === 1 && activePlayers[0]) {
            room.state = 'FINISHED';
            room.kazhuthaId = activePlayers[0].id;
            room.currentTurnId = null;
        }
        else if (activePlayers.length === 0) {
            room.state = 'FINISHED';
            room.currentTurnId = null;
        }
        else {
            let nextPlayerId = room.currentTurnId;
            let iterations = 0;
            while (nextPlayerId) {
                iterations++;
                if (iterations > room.players.length)
                    break;
                const p = room.players.find(player => player.id === nextPlayerId);
                if (p && !p.isSpectator && p.hand.length > 0) {
                    room.currentTurnId = nextPlayerId;
                    break;
                }
                nextPlayerId = this.getNextPlayerId(room, nextPlayerId);
            }
        }
    }
    getActivePlayers(room) {
        return room.players.filter(p => !p.isSpectator && (p.hand.length > 0 || room.centerCards.some(c => c.playerId === p.id)));
    }
    getCardHoldingPlayers(room) {
        return room.players.filter(p => !p.isSpectator && (p.hand.length > 0 || room.centerCards.some(c => c.playerId === p.id)));
    }
    getHighestLedCardPlay(centerCards, ledSuit) {
        const ledPlays = centerCards.filter(p => p.card.suit === ledSuit);
        const firstPlay = ledPlays[0];
        if (!firstPlay)
            return undefined;
        return ledPlays.reduce((highest, current) => {
            return this.getRankValue(current.card.rank) > this.getRankValue(highest.card.rank) ? current : highest;
        }, firstPlay);
    }
    getNextPlayerId(room, currentPlayerId) {
        const index = room.players.findIndex(p => p.id === currentPlayerId);
        if (index === -1)
            return currentPlayerId;
        let nextIndex = (index + 1) % room.players.length;
        while (room.players[nextIndex] && (room.players[nextIndex].isSpectator || (room.players[nextIndex].hand.length === 0 && nextIndex !== index))) {
            nextIndex = (nextIndex + 1) % room.players.length;
        }
        return room.players[nextIndex]?.id || currentPlayerId;
    }
    createDeck() {
        const deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({ suit, rank });
            }
        }
        return deck;
    }
    shuffle(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const cardI = deck[i];
            const cardJ = deck[j];
            if (cardI && cardJ) {
                deck[i] = cardJ;
                deck[j] = cardI;
            }
        }
    }
    dealCards(room, deck) {
        const activePlayers = room.players.filter(p => !p.isSpectator && p.isConnected);
        if (activePlayers.length === 0)
            return;
        let p = 0;
        for (const card of deck) {
            const targetPlayer = activePlayers[p];
            if (targetPlayer) {
                targetPlayer.hand.push(card);
            }
            p = (p + 1) % activePlayers.length;
        }
    }
    getRankValue(rank) {
        const rankValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return rankValues[rank];
    }
}
//# sourceMappingURL=GameEngine.js.map