import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Copy, Share2, Check, UserX, LogOut, HelpCircle } from 'lucide-react';
import { HowToPlayModal } from '../components/HowToPlayModal';

export const LobbyPage: React.FC = () => {
  const { room, playerId, startGame, leaveRoom, kickPlayer, error } = useSocket();
  const [copied, setCopied] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  if (!room) return null;

  const currentPlayer = room.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;
  const joinUrl = `${window.location.origin}?join=${room.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kazhutha Game Lobby',
          text: `Join my Kazhutha game room ${room.id}!`,
          url: joinUrl,
        });
      } catch (err) {
        // Fallback
      }
    } else {
      handleCopyLink();
    }
  };

  const canStart = room.players.length >= 2 && room.players.length <= 7;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-amber-400">Game Lobby</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowToPlay(true)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="How to Play"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Rules</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to leave the lobby?')) {
                  leaveRoom();
                }
              }}
              className="flex items-center gap-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Quit Lobby"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Quit</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="w-full bg-red-900 border border-red-500 text-red-200 text-xs px-3 py-2 rounded-lg mb-4 text-center font-bold">
            {error}
          </div>
        )}

        {/* Room Code & Share */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col items-center gap-3">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Game Code
          </span>
          <span className="text-3xl font-mono font-black text-amber-400 tracking-widest">
            {room.id}
          </span>

          <div className="flex gap-2 w-full mt-1">
            <button
              onClick={handleCopyLink}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              {copied ? 'COPIED!' : 'COPY LINK'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <Share2 className="w-4 h-4 text-slate-300" />
              SHARE
            </button>
          </div>
        </div>

        {/* Player Count */}
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Players
          </span>
          <span className="text-xs font-bold text-amber-400">
            {room.players.length} / 7 Players Joined
          </span>
        </div>

        {/* Player List */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 mb-6 space-y-2 max-h-60 overflow-y-auto">
          {room.players.map((p) => {
            const isMe = p.id === playerId;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isMe
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {p.isHost && <span>👑</span>}
                  <span>{p.name}</span>
                  {isMe && <span className="text-xs text-amber-400 font-bold">(You)</span>}
                </div>

                <div className="flex items-center gap-2">
                  {p.isHost ? (
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      Host
                    </span>
                  ) : isHost ? (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 bg-red-950/80 border border-red-800 px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                      title="Kick Player"
                    >
                      <UserX className="w-3 h-3" />
                      Kick
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {isHost ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-lg ${
                canStart
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              START GAME
            </button>
            {!canStart && (
              <p className="text-[11px] text-slate-400 text-center">
                Need at least 2 players to start
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-3 bg-slate-950 border border-slate-800 rounded-xl">
            <p className="text-xs text-amber-400 font-semibold animate-pulse">
              Waiting for host to start...
            </p>
          </div>
        )}
      </div>

      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  );
};
