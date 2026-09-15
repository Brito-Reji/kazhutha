import React, { useEffect, useState } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { LandingPage } from './pages/LandingPage';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';
import { ResultPage } from './pages/ResultPage';

const MainContent: React.FC = () => {
  const { room } = useSocket();
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');

  useEffect(() => {
    // parse room code from url
    const parseUrlCode = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const joinCode = urlParams.get('join');
      if (joinCode) {
        setInitialRoomCode(joinCode.toUpperCase());
      } else {
        const pathParts = window.location.pathname.split('/');
        if (pathParts[1] === 'join' && pathParts[2]) {
          setInitialRoomCode(pathParts[2].toUpperCase());
        }
      }
    };

    parseUrlCode();
    window.addEventListener('popstate', parseUrlCode);
    return () => window.removeEventListener('popstate', parseUrlCode);
  }, []);

  if (!room) {
    return (
      <LandingPage
        initialRoomCode={initialRoomCode}
        onJoined={() => {}}
      />
    );
  }

  if (room.state === 'LOBBY') {
    return <LobbyPage />;
  }

  if (room.state === 'PLAYING') {
    return <GamePage />;
  }

  if (room.state === 'FINISHED') {
    return <ResultPage />;
  }

  return null;
};

export function App() {
  return (
    <SocketProvider>
      <MainContent />
    </SocketProvider>
  );
}

export default App;
