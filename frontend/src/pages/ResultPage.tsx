import React from 'react';
import { UserX } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const ResultPage: React.FC = () => {
  const { room, playerId, playAgain, leaveRoom, kickPlayer, error } = useSocket();

  if (!room) return null;

  const currentPlayer = room.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;

  const kazhuthaPlayer = room.players.find((p) => p.id === room.kazhuthaId);
  const finishedOrder = room.finishedOrder || [];
  const otherPlayers = room.players.filter((p) => !p.isSpectator && p.id !== room.kazhuthaId);
  const spectators = room.players.filter((p) => p.isSpectator);

  // sort winners
  const sortedWinners = [...otherPlayers].sort((a, b) => {
    const idxA = finishedOrder.indexOf(a.id);
    const idxB = finishedOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Title */}
        <h1 className="text-3xl font-black text-amber-400 mb-1 flex items-center gap-2">
          🎉 GAME OVER
        </h1>
        <p className="text-xs text-slate-400 mb-6 font-medium">
          Room {room.id}
        </p>

        {error && (
          <div className="w-full bg-red-900 border border-red-500 text-red-200 text-xs px-3 py-2 rounded-lg mb-4 text-center font-bold">
            {error}
          </div>
        )}

        {/* Kazhutha Spotlight */}
        {kazhuthaPlayer && (
          <div className="w-full bg-amber-950 border-2 border-amber-500 rounded-xl p-4 mb-6 flex flex-col items-center text-center shadow-lg">
            <span className="text-4xl mb-1">🫏</span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
              The Kazhutha (Donkey)
            </span>
            <span className="text-xl font-bold text-slate-100 mt-1">
              {kazhuthaPlayer.name}
            </span>
            {room.lastTrickMessage && room.lastTrickMessage.includes('Malathi') && (
              <span className="text-xs font-semibold text-amber-300 mt-1.5 bg-amber-900/80 px-2.5 py-0.5 rounded border border-amber-600">
                🏳️ Declared Malathi
              </span>
            )}
          </div>
        )}

        {/* Results */}
        <div className="w-full mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Results
          </h2>
          <div className="space-y-2">
            {sortedWinners.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <span>🏆</span>
                  <span>{p.name}</span>
                  {p.id === playerId && (
                    <span className="text-xs text-amber-400 font-bold">(You)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-bold">Safe</span>
                  {isHost && p.id !== playerId && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                      title="Kick Player"
                    >
                      <UserX className="w-3 h-3" />
                      Kick
                    </button>
                  )}
                </div>
              </div>
            ))}

            {kazhuthaPlayer && (
              <div className="flex items-center justify-between bg-slate-950 border border-amber-500 p-3 rounded-lg text-sm">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <span>🫏</span>
                  <span>{kazhuthaPlayer.name}</span>
                  {kazhuthaPlayer.id === playerId && (
                    <span className="text-xs text-amber-400 font-bold">(You)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 font-extrabold uppercase">
                    Kazhutha
                  </span>
                  {isHost && kazhuthaPlayer.id !== playerId && (
                    <button
                      onClick={() => kickPlayer(kazhuthaPlayer.id)}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                      title="Kick Player"
                    >
                      <UserX className="w-3 h-3" />
                      Kick
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {spectators.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Spectators
              </span>
              {spectators.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800"
                >
                  <span className="font-medium">
                    {s.name} {s.id === playerId && <span className="text-amber-400 font-bold">(You)</span>}
                  </span>
                  {isHost && s.id !== playerId && (
                    <button
                      onClick={() => kickPlayer(s.id)}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                      title="Kick Spectator"
                    >
                      <UserX className="w-3 h-3" />
                      Kick
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {isHost ? (
            <button
              onClick={playAgain}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              PLAY AGAIN (SAME ROOM)
            </button>
          ) : (
            <div className="text-center py-2 text-xs text-amber-400 font-semibold animate-pulse">
              Waiting for host to click Play Again...
            </div>
          )}

          <button
            onClick={leaveRoom}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl border border-slate-700 text-xs"
          >
            LEAVE ROOM
          </button>
        </div>
      </div>
    </div>
  );
};
