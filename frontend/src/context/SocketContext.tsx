import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Room, Card } from '../types';

interface SocketContextType {
  socket: Socket | null;
  room: Room | null;
  playerId: string | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  error: string | null;
  setError: (msg: string | null) => void;
  createRoom: (name: string) => Promise<string>;
  joinRoom: (roomId: string, name: string) => Promise<boolean>;
  startGame: () => void;
  playCard: (card: Card) => void;
  leaveRoom: () => void;
  kickPlayer: (targetPlayerId: string) => void;
  playAgain: () => void;
  declareMalathi: () => void;
  ping: number;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

// backend url — set VITE_BACKEND_URL in Vercel env vars for prod
const SOCKET_SERVER_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://kazhutha-5p5r.onrender.com';

// get url room id
function getRoomIdFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const joinCode = urlParams.get('join');
  if (joinCode) return joinCode.trim().toUpperCase();

  const pathParts = window.location.pathname.split('/');
  if (pathParts[1] === 'join' && pathParts[2]) {
    return pathParts[2].trim().toUpperCase();
  }
  return null;
}

// update url room id
function updateUrlRoomId(roomId: string | null) {
  const currentUrl = new URL(window.location.href);
  if (roomId) {
    if (currentUrl.searchParams.get('join') !== roomId) {
      currentUrl.searchParams.set('join', roomId);
      window.history.pushState(null, '', currentUrl.toString());
    }
  } else {
    if (currentUrl.searchParams.has('join')) {
      currentUrl.searchParams.delete('join');
      let pathname = currentUrl.pathname;
      if (pathname.startsWith('/join/')) {
        pathname = '/';
      }
      const query = currentUrl.searchParams.toString();
      const newUrl = pathname + (query ? `?${query}` : '');
      window.history.pushState(null, '', newUrl);
    }
  }
}

// get session token
function getOrCreateSessionToken(): string {
  let token = localStorage.getItem('kazhutha_session_token');
  if (!token) {
    token = 'session_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('kazhutha_session_token', token);
  }
  return token;
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('kazhutha_username') || '');
  const [error, setError] = useState<string | null>(null);
  const [ping, setPing] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const sessionToken = getOrCreateSessionToken();
    const newSocket = io(SOCKET_SERVER_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    setSocket(newSocket);

    // socket connection
    newSocket.on('connect', () => {
      setIsConnected(true);
      setPlayerId(newSocket.id || null);

      const urlRoomId = getRoomIdFromUrl();
      if (urlRoomId) {
        newSocket.emit('reconnect_session', { roomId: urlRoomId, sessionToken }, (res: any) => {
          if (res.success) {
            setRoom(res.room);
            setPlayerId(res.playerId);
            localStorage.setItem('kazhutha_room_id', urlRoomId);
          } else {
            setRoom(null);
          }
        });
      } else {
        setRoom(null);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', () => {
      setIsConnected(false);
    });

    // handle url change
    const handleUrlChange = () => {
      const urlRoomId = getRoomIdFromUrl();
      if (!urlRoomId) {
        setRoom(null);
      } else if (newSocket && newSocket.connected) {
        newSocket.emit('reconnect_session', { roomId: urlRoomId, sessionToken }, (res: any) => {
          if (res.success) {
            setRoom(res.room);
            setPlayerId(res.playerId);
            localStorage.setItem('kazhutha_room_id', urlRoomId);
          } else {
            setRoom(null);
          }
        });
      }
    };

    window.addEventListener('popstate', handleUrlChange);

    // room updated
    newSocket.on('room_updated', (updatedRoom: Room) => {
      const urlRoomId = getRoomIdFromUrl();
      if (urlRoomId === updatedRoom.id) {
        setRoom(updatedRoom);
      }
      if (updatedRoom && updatedRoom.id) {
        localStorage.setItem('kazhutha_room_id', updatedRoom.id);
      }
    });

    // kicked from room
    newSocket.on('kicked_from_room', () => {
      setRoom(null);
      localStorage.removeItem('kazhutha_room_id');
      updateUrlRoomId(null);
      setError('You were kicked from the room by the host');
      setTimeout(() => setError(null), 5000);
    });

    // error message
    newSocket.on('error_message', (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    });

    // ping check
    const pingInterval = setInterval(() => {
      if (newSocket && newSocket.connected) {
        const start = Date.now();
        newSocket.emit('ping_check', start, (sentTime: number) => {
          const latency = Date.now() - sentTime;
          setPing(latency);

          const currentRoom = localStorage.getItem('kazhutha_room_id');
          if (currentRoom) {
            newSocket.emit('update_ping', { roomId: currentRoom, ping: latency });
          }
        });
      }
    }, 3000);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      clearInterval(pingInterval);
      newSocket.disconnect();
    };
  }, []);

  // create room
  const createRoom = (name: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject('Socket not connected');
      const sessionToken = getOrCreateSessionToken();
      localStorage.setItem('kazhutha_username', name);
      setPlayerName(name);

      socket.emit('create_room', { name, sessionToken }, (res: any) => {
        if (res.success) {
          setRoom(res.room);
          setPlayerId(res.playerId);
          localStorage.setItem('kazhutha_room_id', res.roomId);
          updateUrlRoomId(res.roomId);
          resolve(res.roomId);
        } else {
          setError(res.error);
          reject(res.error);
        }
      });
    });
  };

  // join room
  const joinRoom = (roomId: string, name: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject('Socket not connected');
      const sessionToken = getOrCreateSessionToken();
      localStorage.setItem('kazhutha_username', name);
      setPlayerName(name);

      socket.emit('join_room', { roomId, name, sessionToken }, (res: any) => {
        if (res.success) {
          setRoom(res.room);
          setPlayerId(res.playerId);
          localStorage.setItem('kazhutha_room_id', res.roomId);
          updateUrlRoomId(res.roomId);
          resolve(true);
        } else {
          setError(res.error);
          reject(res.error);
        }
      });
    });
  };

  // start game
  const startGame = () => {
    if (!socket || !room) return;
    socket.emit('start_game', { roomId: room.id });
  };

  // play card
  const playCard = (card: Card) => {
    if (!socket || !room) return;
    socket.emit('play_card', { roomId: room.id, card });
  };

  // kick player
  const kickPlayer = (targetPlayerId: string) => {
    if (!socket || !room) return;
    socket.emit('kick_player', { roomId: room.id, targetPlayerId });
  };

  // play again
  const playAgain = () => {
    if (!socket || !room) return;
    socket.emit('play_again', { roomId: room.id });
  };

  // leave room
  const leaveRoom = () => {
    if (socket && room) {
      socket.emit('leave_room', { roomId: room.id });
    }
    setRoom(null);
    localStorage.removeItem('kazhutha_room_id');
    updateUrlRoomId(null);
  };

  // declare malathi
  const declareMalathi = () => {
    if (!socket || !room) return;
    socket.emit('declare_malathi', { roomId: room.id });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        room,
        playerId,
        playerName,
        setPlayerName,
        error,
        setError,
        createRoom,
        joinRoom,
        startGame,
        playCard,
        leaveRoom,
        kickPlayer,
        playAgain,
        declareMalathi,
        ping,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

