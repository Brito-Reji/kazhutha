import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { HowToPlayModal } from '../components/HowToPlayModal';

interface LandingPageProps {
  initialRoomCode?: string;
  onJoined: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ initialRoomCode = '', onJoined }) => {
  const { createRoom, joinRoom, playerName, setPlayerName, error, setError, isConnected } = useSocket();
  const [mode, setMode] = useState<'INITIAL' | 'CREATE' | 'JOIN'>(initialRoomCode ? 'JOIN' : 'INITIAL');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [loading, setLoading] = useState(false);
  const [connectTimeout, setConnectTimeout] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // show error if server takes too long
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isConnected) setConnectTimeout(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) setConnectTimeout(false);
  }, [isConnected]);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
      setMode('JOIN');
    }
  }, [initialRoomCode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return setError('Still connecting to server, please wait...');
    if (!playerName.trim()) return setError('Please enter your name');

    setLoading(true);
    try {
      await createRoom(playerName.trim());
      onJoined();
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return setError('Still connecting to server, please wait...');
    if (!playerName.trim()) return setError('Please enter your name');
    if (!roomCode.trim()) return setError('Please enter game code');

    setLoading(true);
    try {
      await joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
      onJoined();
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-wider text-amber-400 flex items-center justify-center gap-2">
            KAZHUTHA 🃏
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Kerala Real-Time Multiplayer Card Game
          </p>
        </div>

        {/* server connection status */}
        {!isConnected && !connectTimeout && (
          <div className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg mb-4 text-center flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full" />
            Connecting to server...
          </div>
        )}

        {connectTimeout && !isConnected && (
          <div className="w-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs px-3 py-2 rounded-lg mb-4 text-center">
            ⚠️ Server is waking up (free tier). Please wait a moment and try again.
          </div>
        )}

        {error && (
          <div className="w-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs px-3 py-2 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {mode === 'INITIAL' && (
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => setMode('CREATE')}
              className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              CREATE GAME
            </button>
            <button
              onClick={() => setMode('JOIN')}
              className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-slate-200 font-bold py-3.5 rounded-xl border border-slate-700 transition-all"
            >
              JOIN GAME
            </button>
            <button
              onClick={() => setShowHowToPlay(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-3 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <span>📖 How to Play</span>
            </button>
          </div>
        )}

        {mode === 'CREATE' && (
          <form onSubmit={handleCreate} className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={15}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-2 shadow-lg shadow-amber-500/20"
            >
              {loading ? 'Creating...' : 'CREATE ROOM'}
            </button>
            <button
              type="button"
              onClick={() => setMode('INITIAL')}
              className="text-xs text-slate-400 hover:text-slate-200 mt-2 text-center"
            >
              ← Back
            </button>
          </form>
        )}

        {mode === 'JOIN' && (
          <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={15}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Game Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={6}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono tracking-wider text-center uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-2 shadow-lg shadow-amber-500/20"
            >
              {loading ? 'Joining...' : 'JOIN ROOM'}
            </button>
            <button
              type="button"
              onClick={() => setMode('INITIAL')}
              className="text-xs text-slate-400 hover:text-slate-200 mt-2 text-center"
            >
              ← Back
            </button>
          </form>
        )}
      </div>

      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  );
};
