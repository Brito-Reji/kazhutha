import { Server, Socket } from 'socket.io';
import { GameEngine } from '../game/GameEngine.js';
import type { Card } from '../game/GameEngine.js';

const gameEngine = new GameEngine();

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// broadcast updates to room and admins
function broadcastRoomUpdate(io: Server, roomId: string, room: any) {
  if (room) {
    io.to(roomId).emit('room_updated', room);
    io.to(`admin_spectate_${roomId}`).emit('admin_room_spectate_updated', room);
  }
  io.to('admin_room_listeners').emit('admin_rooms_updated', gameEngine.getAllRooms());
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let userSessionToken: string | null = null;

    // Ping / Pong handler for latency
    socket.on('ping_check', (timestamp: number, callback: Function) => {
      if (callback) callback(timestamp);
    });

    socket.on('update_ping', ({ roomId, ping }: { roomId: string; ping: number }) => {
      if (roomId) {
        gameEngine.updatePlayerPing(roomId, socket.id, ping);
        const room = gameEngine.getRoom(roomId);
        if (room) {
          broadcastRoomUpdate(io, roomId, room);
        }
      }
    });

    // Create Room
    socket.on('create_room', ({ name, sessionToken }: { name: string; sessionToken: string }, callback: Function) => {
      try {
        // leave old room
        if (currentRoomId) {
          socket.leave(currentRoomId);
          const oldRoomUpdated = gameEngine.removePlayer(currentRoomId, socket.id);
          if (oldRoomUpdated) {
            broadcastRoomUpdate(io, currentRoomId, oldRoomUpdated);
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
        if (callback) callback({ success: true, roomId, room: updatedRoom, playerId: socket.id });
        broadcastRoomUpdate(io, roomId, updatedRoom);
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Join Room
    socket.on('join_room', ({ roomId, name, sessionToken }: { roomId: string; name: string; sessionToken: string }, callback: Function) => {
      try {
        const cleanRoomId = roomId.trim().toUpperCase();
        const existingRoom = gameEngine.getRoom(cleanRoomId);

        if (!existingRoom) {
          if (callback) callback({ success: false, error: 'Room not found' });
          return;
        }

        // leave old room
        if (currentRoomId && currentRoomId !== cleanRoomId) {
          socket.leave(currentRoomId);
          const oldRoomUpdated = gameEngine.removePlayer(currentRoomId, socket.id);
          if (oldRoomUpdated) {
            broadcastRoomUpdate(io, currentRoomId, oldRoomUpdated);
          }
        }

        userSessionToken = sessionToken;

        const sameSessionPlayer = existingRoom.players.find((p: any) => p.sessionToken === sessionToken);
        if (!sameSessionPlayer && existingRoom.players.some((p: any) => p.name.toLowerCase() === name.toLowerCase())) {
          if (callback) callback({ success: false, error: 'Username already taken in this room' });
          return;
        }

        const room = gameEngine.addPlayer(cleanRoomId, socket.id, sessionToken, name);
        currentRoomId = cleanRoomId;
        socket.join(cleanRoomId);

        if (callback) callback({ success: true, roomId: cleanRoomId, room, playerId: socket.id });
        broadcastRoomUpdate(io, cleanRoomId, room);
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Reconnect Session
    socket.on('reconnect_session', ({ roomId, sessionToken }: { roomId: string; sessionToken: string }, callback: Function) => {
      try {
        const cleanRoomId = roomId.trim().toUpperCase();
        const reconnected = gameEngine.reconnectPlayer(cleanRoomId, sessionToken, socket.id);

        if (reconnected) {
          currentRoomId = cleanRoomId;
          userSessionToken = sessionToken;
          socket.join(cleanRoomId);

          if (callback) callback({ success: true, room: reconnected.room, playerId: socket.id });
          broadcastRoomUpdate(io, cleanRoomId, reconnected.room);
        } else {
          if (callback) callback({ success: false, error: 'Session expired or room not found' });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Kick Player (Host action)
    socket.on('kick_player', ({ roomId, targetPlayerId }: { roomId: string; targetPlayerId: string }, callback?: Function) => {
      try {
        const updatedRoom = gameEngine.kickPlayer(roomId, socket.id, targetPlayerId);
        
        // Notify target socket
        io.to(targetPlayerId).emit('kicked_from_room');
        const targetSocket = io.sockets.sockets.get(targetPlayerId);
        if (targetSocket) {
          targetSocket.leave(roomId);
        }

        broadcastRoomUpdate(io, roomId, updatedRoom);
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Play Again (Restart game directly in same room)
    socket.on('play_again', ({ roomId }: { roomId: string }, callback?: Function) => {
      try {
        const room = gameEngine.getRoom(roomId);
        if (!room) throw new Error('Room not found');

        // Directly deal & start game again in same room
        const updatedRoom = gameEngine.startGame(roomId);
        broadcastRoomUpdate(io, roomId, updatedRoom);
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Leave Room
    socket.on('leave_room', ({ roomId }: { roomId: string }, callback?: Function) => {
      try {
        if (roomId) {
          socket.leave(roomId);
          const updatedRoom = gameEngine.removePlayer(roomId, socket.id);
          if (updatedRoom) {
            broadcastRoomUpdate(io, roomId, updatedRoom);
          }
        }
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Start Game
    socket.on('start_game', ({ roomId }: { roomId: string }, callback?: Function) => {
      try {
        const room = gameEngine.getRoom(roomId);
        if (!room) throw new Error('Room not found');
        const player = room.players.find((p: any) => p.id === socket.id);
        if (!player || !player.isHost) throw new Error('Only the host can start the game');

        const updatedRoom = gameEngine.startGame(roomId);
        broadcastRoomUpdate(io, roomId, updatedRoom);
        if (callback) callback({ success: true });
      } catch (err: any) {
        socket.emit('error_message', err.message);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Play Card
    socket.on('play_card', ({ roomId, card }: { roomId: string; card: Card }, callback?: Function) => {
      try {
        const result = gameEngine.playCard(roomId, socket.id, card);
        
        if (callback) callback({ success: true });

        broadcastRoomUpdate(io, roomId, result.room);

        if (result.trickFinished) {
          setTimeout(() => {
            const clearedRoom = gameEngine.clearCenterCards(roomId);
            if (clearedRoom) {
              broadcastRoomUpdate(io, roomId, clearedRoom);
            }
          }, 2000);
        }
      } catch (err: any) {
        socket.emit('error_message', err.message);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // declare malathi
    socket.on('declare_malathi', ({ roomId }: { roomId: string }, callback?: Function) => {
      try {
        const updatedRoom = gameEngine.declareMalathi(roomId, socket.id);
        broadcastRoomUpdate(io, roomId, updatedRoom);
        if (callback) callback({ success: true });
      } catch (err: any) {
        socket.emit('error_message', err.message);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // admin login
    socket.on('admin_auth', ({ key }: { key: string }, callback: Function) => {
      const adminSecret = process.env.ADMIN_SECRET || 'kazhutha-admin-123';
      if (key === adminSecret) {
        socket.join('admin_room_listeners');
        if (callback) callback({ success: true, rooms: gameEngine.getAllRooms() });
      } else {
        if (callback) callback({ success: false, error: 'Invalid admin key' });
      }
    });

    // admin get rooms
    socket.on('admin_get_rooms', (callback: Function) => {
      if (callback) callback({ success: true, rooms: gameEngine.getAllRooms() });
    });

    // admin spectate room
    socket.on('admin_spectate_room', ({ roomId }: { roomId: string }, callback?: Function) => {
      const room = gameEngine.getRoom(roomId);
      if (room) {
        socket.join(`admin_spectate_${roomId}`);
        if (callback) callback({ success: true, room });
      } else {
        if (callback) callback({ success: false, error: 'Room not found' });
      }
    });

    // admin leave spectate
    socket.on('admin_leave_spectate', ({ roomId }: { roomId: string }) => {
      socket.leave(`admin_spectate_${roomId}`);
    });

    // admin close room
    socket.on('admin_close_room', ({ roomId }: { roomId: string }, callback?: Function) => {
      const room = gameEngine.getRoom(roomId);
      if (room) {
        io.to(roomId).emit('kicked_from_room');
        const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
        if (socketsInRoom) {
          for (const socketId of socketsInRoom) {
            const clientSocket = io.sockets.sockets.get(socketId);
            if (clientSocket) {
              clientSocket.leave(roomId);
            }
          }
        }
        gameEngine.deleteRoom(roomId);
        io.to(`admin_spectate_${roomId}`).emit('admin_room_closed', { roomId });
        io.to('admin_room_listeners').emit('admin_rooms_updated', gameEngine.getAllRooms());
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'Room not found' });
      }
    });

    // admin kick player
    socket.on('admin_kick_player', ({ roomId, targetPlayerId }: { roomId: string; targetPlayerId: string }, callback?: Function) => {
      try {
        const room = gameEngine.getRoom(roomId);
        if (!room) throw new Error('Room not found');

        io.to(targetPlayerId).emit('kicked_from_room');
        const targetSocket = io.sockets.sockets.get(targetPlayerId);
        if (targetSocket) {
          targetSocket.leave(roomId);
        }

        const updatedRoom = gameEngine.removePlayer(roomId, targetPlayerId);
        if (updatedRoom) {
          broadcastRoomUpdate(io, roomId, updatedRoom);
        } else {
          gameEngine.deleteRoom(roomId);
          io.to('admin_room_listeners').emit('admin_rooms_updated', gameEngine.getAllRooms());
        }
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (currentRoomId) {
        const updatedRoom = gameEngine.removePlayer(currentRoomId, socket.id);
        if (updatedRoom) {
          broadcastRoomUpdate(io, currentRoomId, updatedRoom);
        }
      }
    });
  });
}

