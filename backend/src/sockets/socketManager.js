import { Server, Socket } from 'socket.io';
import { GameEngine } from '../game/GameEngine.js';
const gameEngine = new GameEngine();
function generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        let currentRoomId = null;
        let userSessionToken = null;
        // Ping / Pong handler for latency
        socket.on('ping_check', (timestamp, callback) => {
            if (callback)
                callback(timestamp);
        });
        socket.on('update_ping', ({ roomId, ping }) => {
            if (roomId) {
                gameEngine.updatePlayerPing(roomId, socket.id, ping);
                const room = gameEngine.getRoom(roomId);
                if (room) {
                    io.to(roomId).emit('room_updated', room);
                }
            }
        });
        // Create Room
        socket.on('create_room', ({ name, sessionToken }, callback) => {
            try {
                // leave old room
                if (currentRoomId) {
                    socket.leave(currentRoomId);
                    const oldRoomUpdated = gameEngine.removePlayer(currentRoomId, socket.id);
                    if (oldRoomUpdated) {
                        io.to(currentRoomId).emit('room_updated', oldRoomUpdated);
                    }
                }
                let roomId = generateRoomId();
                while (gameEngine.getRoom(roomId)) {
                    roomId = generateRoomId();
                }
                userSessionToken = sessionToken;
                const room = gameEngine.createRoom(roomId);
                gameEngine.addPlayer(roomId, socket.id, sessionToken, name);
                currentRoomId = roomId;
                socket.join(roomId);
                const updatedRoom = gameEngine.getRoom(roomId);
                if (callback)
                    callback({ success: true, roomId, room: updatedRoom, playerId: socket.id });
                io.to(roomId).emit('room_updated', updatedRoom);
            }
            catch (err) {
                if (callback)
                    callback({ success: false, error: err.message });
            }
        });
        // Join Room
        socket.on('join_room', ({ roomId, name, sessionToken }, callback) => {
            try {
                const cleanRoomId = roomId.trim().toUpperCase();
                const existingRoom = gameEngine.getRoom(cleanRoomId);
                if (!existingRoom) {
                    if (callback)
                        callback({ success: false, error: 'Room not found' });
                    return;
                }
                // leave old room
                if (currentRoomId && currentRoomId !== cleanRoomId) {
                    socket.leave(currentRoomId);
                    const oldRoomUpdated = gameEngine.removePlayer(currentRoomId, socket.id);
                    if (oldRoomUpdated) {
                        io.to(currentRoomId).emit('room_updated', oldRoomUpdated);
                    }
                }
                userSessionToken = sessionToken;
                const sameSessionPlayer = existingRoom.players.find((p) => p.sessionToken === sessionToken);
                if (!sameSessionPlayer && existingRoom.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
                    if (callback)
                        callback({ success: false, error: 'Username already taken in this room' });
                    return;
                }
                const room = gameEngine.addPlayer(cleanRoomId, socket.id, sessionToken, name);
                currentRoomId = cleanRoomId;
                socket.join(cleanRoomId);
                if (callback)
                    callback({ success: true, roomId: cleanRoomId, room, playerId: socket.id });
                io.to(cleanRoomId).emit('room_updated', room);
            }
            catch (err) {
                if (callback)
                    callback({ success: false, error: err.message });
            }
        });
        // Reconnect Session
        socket.on('reconnect_session', ({ roomId, sessionToken }, callback) => {
            try {
                const cleanRoomId = roomId.trim().toUpperCase();
                const reconnected = gameEngine.reconnectPlayer(cleanRoomId, sessionToken, socket.id);
                if (reconnected) {
                    currentRoomId = cleanRoomId;
                    userSessionToken = sessionToken;
                    socket.join(cleanRoomId);
                    if (callback)
                        callback({ success: true, room: reconnected.room, playerId: socket.id });
                    io.to(cleanRoomId).emit('room_updated', reconnected.room);
                }
                else {
                    if (callback)
                        callback({ success: false, error: 'Session expired or room not found' });
                }
            }
            catch (err) {
                if (callback)
                    callback({ success: false, error: err.message });
            }
        });
        // Kick Player (Host action)
        socket.on('kick_player', ({ roomId, targetPlayerId }, callback) => {
            try {
                const updatedRoom = gameEngine.kickPlayer(roomId, socket.id, targetPlayerId);
                // Notify target socket
                io.to(targetPlayerId).emit('kicked_from_room');
                const targetSocket = io.sockets.sockets.get(targetPlayerId);
                if (targetSocket) {
                    targetSocket.leave(roomId);
                }
                io.to(roomId).emit('room_updated', updatedRoom);
                if (callback)
                    callback({ success: true });
            }
            catch (err) {
                if (callback)
                    callback({ success: false, error: err.message });
            }
        });
        // Play Again (Restart game directly in same room)
        socket.on('play_again', ({ roomId }, callback) => {
            try {
                const room = gameEngine.getRoom(roomId);
                if (!room)
                    throw new Error('Room not found');
                // Directly deal & start game again in same room
                const updatedRoom = gameEngine.startGame(roomId);
                io.to(roomId).emit('room_updated', updatedRoom);
                if (callback)
                    callback({ success: true });
            }
            catch (err) {
                if (callback)
                    callback({ success: false, error: err.message });
            }
        });
        // Leave Room
        socket.on('leave_room', ({ roomId }, callback) => {
            try {
                if (roomId) {
                    socket.leave(roomId);
                    const updatedRoom = gameEngine.removePlayer(roomId, socket.id);
                    if (updatedRoom) {
                        io.to(roomId).emit('room_updated', updatedRoom);
                    }
                }
                if (callback)
                    callback({ success: true });
            }
            catch (err) {
                if (callback)
                    callback({ success: false, error: err.message });
            }
        });
        // Start Game
        socket.on('start_game', ({ roomId }, callback) => {
            try {
                const room = gameEngine.getRoom(roomId);
                if (!room)
                    throw new Error('Room not found');
                const player = room.players.find((p) => p.id === socket.id);
                if (!player || !player.isHost)
                    throw new Error('Only the host can start the game');
                const updatedRoom = gameEngine.startGame(roomId);
                io.to(roomId).emit('room_updated', updatedRoom);
                if (callback)
                    callback({ success: true });
            }
            catch (err) {
                socket.emit('error_message', err.message);
                if (callback)
                    callback({ success: false, error: err.message });
            }
        });
        // Play Card
        socket.on('play_card', ({ roomId, card }, callback) => {
            try {
                const result = gameEngine.playCard(roomId, socket.id, card);
                if (callback)
                    callback({ success: true });
                io.to(roomId).emit('room_updated', result.room);
                if (result.trickFinished) {
                    setTimeout(() => {
                        const clearedRoom = gameEngine.clearCenterCards(roomId);
                        if (clearedRoom) {
                            io.to(roomId).emit('room_updated', clearedRoom);
                        }
                    }, 2000);
                }
            }
            catch (err) {
                socket.emit('error_message', err.message);
                if (callback)
                    callback({ success: false, error: err.message });
            }
        });
        // declare malathi
        socket.on('declare_malathi', ({ roomId }, callback) => {
            try {
                const updatedRoom = gameEngine.declareMalathi(roomId, socket.id);
                io.to(roomId).emit('room_updated', updatedRoom);
                if (callback)
                    callback({ success: true });
            }
            catch (err) {
                socket.emit('error_message', err.message);
                if (callback)
                    callback({ success: false, error: err.message });
            }
        });
        // Disconnect
        socket.on('disconnect', () => {
            if (currentRoomId) {
                const updatedRoom = gameEngine.removePlayer(currentRoomId, socket.id);
                if (updatedRoom) {
                    io.to(currentRoomId).emit('room_updated', updatedRoom);
                }
            }
        });
    });
}
//# sourceMappingURL=socketManager.js.map