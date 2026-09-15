export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export interface Card {
    suit: Suit;
    rank: Rank;
}
export interface Player {
    id: string;
    sessionToken: string;
    name: string;
    hand: Card[];
    isConnected: boolean;
    isHost: boolean;
    isSpectator?: boolean;
    ping?: number;
}
export type GameState = 'LOBBY' | 'PLAYING' | 'FINISHED';
export interface PlayedCard {
    playerId: string;
    card: Card;
}
export interface Room {
    id: string;
    players: Player[];
    state: GameState;
    currentTurnId: string | null;
    centerCards: PlayedCard[];
    ledSuit: Suit | null;
    kazhuthaId: string | null;
    lastTrickMessage?: string | null;
    finishedOrder?: string[];
    isFirstLead?: boolean;
}
export declare class GameEngine {
    private rooms;
    createRoom(roomId: string): Room;
    getRoom(roomId: string): Room | undefined;
    addPlayer(roomId: string, playerId: string, sessionToken: string, name: string): Room;
    reconnectPlayer(roomId: string, sessionToken: string, newSocketId: string): {
        room: Room;
        player: Player;
    } | null;
    updatePlayerPing(roomId: string, playerId: string, ping: number): void;
    removePlayer(roomId: string, playerId: string): Room | null;
    kickPlayer(roomId: string, hostSocketId: string, targetPlayerId: string): Room;
    resetToLobby(roomId: string): Room;
    startGame(roomId: string): Room;
    playCard(roomId: string, playerId: string, card: Card): {
        room: Room;
        trickFinished: boolean;
        isVettu: boolean;
        nextPlayerId: string | null;
    };
    clearCenterCards(roomId: string): Room | null;
    declareMalathi(roomId: string, playerId: string): Room;
    private checkWinner;
    private getActivePlayers;
    private getCardHoldingPlayers;
    private getHighestLedCardPlay;
    private getNextPlayerId;
    private createDeck;
    private shuffle;
    private dealCards;
    private getRankValue;
}
//# sourceMappingURL=GameEngine.d.ts.map