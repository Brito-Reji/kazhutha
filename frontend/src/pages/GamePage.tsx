import React from 'react';
import { LogOut, Flag } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { Card } from '../components/Card';
import { PlayerAvatar } from '../components/PlayerAvatar';
import type { Card as CardType } from '../types';

export const GamePage: React.FC = () => {
  const { room, playerId, playCard, leaveRoom, declareMalathi, error } = useSocket();

  const [isPlayingCard, setIsPlayingCard] = React.useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = React.useState(false);
  const [showMalathiConfirm, setShowMalathiConfirm] = React.useState(false);

  React.useEffect(() => {
    setIsPlayingCard(false);
  }, [room?.centerCards, room?.currentTurnId]);

  if (!room) return null;

  const me = room.players.find((p) => p.id === playerId);
  const isSpectator = me?.isSpectator ?? false;
  const canDeclareMalathi = !isSpectator && room.state === 'PLAYING' && me && me.hand && me.hand.length > 0;

  const activePlayers = room.players.filter(p => !p.isSpectator);

  const isMyTurn = !isSpectator && room.currentTurnId === playerId;
  const currentTurnPlayer = room.players.find((p) => p.id === room.currentTurnId);

  // find played card for a player in current trick
  const getPlayedCard = (pId: string) => {
    return room.centerCards.find((c) => c.playerId === pId)?.card;
  };

  const isCardPlayable = (card: CardType): boolean => {
    if (isSpectator || !isMyTurn || !me || !me.hand) return false;
    if (playerId && getPlayedCard(playerId)) return false;
    if (room.centerCards.length >= activePlayers.length) return false;
    if (room.ledSuit && room.centerCards.some((c) => c.card.suit !== room.ledSuit)) return false;

    if (room.centerCards.length === 0) return true;

    if (room.ledSuit) {
      const hasLedSuit = me.hand.some((c) => c.suit === room.ledSuit);
      if (hasLedSuit) return card.suit === room.ledSuit;
      return true;
    }

    return true;
  };

  const handleCardClick = (card: CardType) => {
    if (isPlayingCard || !isCardPlayable(card)) return;
    setIsPlayingCard(true);
    playCard(card);
  };

  const sortedHand = me?.hand ? [...me.hand].sort((a, b) => {
    if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
    const rankValues: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return (rankValues[a.rank] || 0) - (rankValues[b.rank] || 0);
  }) : [];

  const myPlayedCard = me ? getPlayedCard(me.id) : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-5 md:p-6 w-full select-none overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 shadow-md">
        <h1 className="text-lg sm:text-xl font-extrabold text-amber-400">KAZHUTHA 🃏</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">ROOM:</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">{room.id}</span>
          </div>

          {canDeclareMalathi && (
            <button
              onClick={() => setShowMalathiConfirm(true)}
              className="flex items-center gap-1 bg-amber-600/90 hover:bg-amber-600 text-amber-950 border border-amber-400 text-xs font-black px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
              title="Call Malathi (Accept Defeat)"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Malathi</span>
            </button>
          )}

          <button
            onClick={() => setShowQuitConfirm(true)}
            className="flex items-center gap-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
            title="Quit Game"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Quit</span>
          </button>
        </div>
      </div>

      {/* Quit confirm banner */}
      {showQuitConfirm && (
        <div className="bg-red-950 border border-red-500 rounded-xl px-4 py-3 mt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-red-200 text-xs font-bold text-center sm:text-left">
            Are you sure you want to quit?
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { leaveRoom(); setShowQuitConfirm(false); }}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg"
            >
              Yes, Quit
            </button>
            <button
              onClick={() => setShowQuitConfirm(false)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs px-4 py-1.5 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Malathi confirm banner */}
      {showMalathiConfirm && (
        <div className="bg-amber-950 border border-amber-500 rounded-xl px-4 py-3 mt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-amber-200 text-xs font-bold text-center sm:text-left">
            🏳️ Call Malathi and accept defeat as Kazhutha?
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { declareMalathi(); setShowMalathiConfirm(false); }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-lg"
            >
              Yes, Malathi
            </button>
            <button
              onClick={() => setShowMalathiConfirm(false)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs px-4 py-1.5 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Spectator banner */}
      {isSpectator && (
        <div className="bg-amber-950 border border-amber-500 text-amber-200 text-xs sm:text-sm px-3 py-2 rounded-lg my-1 text-center font-bold animate-pulse">
          👁 SPECTATING GAME — YOU WILL JOIN THE NEXT ROUND
        </div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-500 text-red-200 text-xs sm:text-sm px-3 py-2 rounded-lg my-1.5 text-center font-bold">
          {error}
        </div>
      )}

      {/* Turn order label */}
      <div className="flex justify-between items-center mt-3 px-1">
        <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
          Turn Order (Left ➔ Right)
        </span>
        <span className="text-[11px] sm:text-xs font-bold text-amber-400">
          {activePlayers.length} / 7 Players
        </span>
      </div>

      {/* Players sequence bar */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-2 px-1 scrollbar-thin my-1">
        {activePlayers.map((p, idx) => (
          <React.Fragment key={p.id}>
            <PlayerAvatar
              player={p}
              isCurrentTurn={p.id === room.currentTurnId}
              playedCard={getPlayedCard(p.id)}
              isSelf={p.id === playerId}
            />
            {idx < activePlayers.length - 1 && (
              <span className="text-slate-600 font-bold text-xs sm:text-sm shrink-0">➔</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Center table */}
      <div className="flex-1 bg-emerald-900 border-2 border-emerald-700 rounded-2xl p-4 flex flex-col items-center justify-center my-3 relative min-h-[220px] md:min-h-[320px] shadow-inner">
        {room.ledSuit && (
          <div className="absolute top-3 left-4 text-xs sm:text-sm font-bold text-emerald-200 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-700">
            Led Suit: <span className="text-white font-extrabold">{room.ledSuit}</span>
          </div>
        )}

        {room.lastTrickMessage && (
          <div className="mb-3 px-4 py-2 bg-amber-900 border border-amber-400 rounded-lg text-amber-200 text-xs sm:text-sm font-extrabold text-center z-20 shadow-md">
            {room.lastTrickMessage}
          </div>
        )}

        {room.centerCards.length === 0 ? (
          <div className="text-center text-emerald-200 text-xs sm:text-sm font-medium italic">
            {isMyTurn ? 'Lead any card to start the round' : 'Waiting for lead card...'}
          </div>
        ) : (
          <div className="flex -space-x-6 sm:-space-x-8 md:-space-x-6 lg:space-x-2 justify-center items-center py-3 px-4 flex-wrap gap-y-2">
            {room.centerCards.map((played, idx) => {
              const p = room.players.find((player) => player.id === played.playerId);
              return (
                <div
                  key={idx}
                  className="relative transition-transform duration-200 flex flex-col items-center hover:z-30 hover:-translate-y-2"
                  style={{ zIndex: idx + 1 }}
                >
                  <Card card={played.card} disabled />
                  <span className="text-[10px] sm:text-xs text-amber-300 font-extrabold mt-1.5 bg-slate-900 px-2 py-0.5 rounded border border-amber-500 max-w-[80px] truncate">
                    {p?.name ?? 'Player'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Turn banner */}
      <div className="my-2 flex items-center justify-between gap-3">
        <div
          className={`flex-1 py-2.5 px-4 rounded-xl text-center font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all ${
            isSpectator
              ? 'bg-slate-900 text-amber-400 border border-slate-800'
              : isMyTurn
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          {isSpectator
            ? `👁 Spectating — Turn: ${currentTurnPlayer?.name ?? 'Player'}`
            : isMyTurn
            ? '⚡ YOUR TURN — TAP A HIGHLIGHTED CARD'
            : `Waiting for ${currentTurnPlayer?.name ?? 'opponent'}...`}
        </div>

        {myPlayedCard && (
          <div className="bg-slate-900 border border-amber-500 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-black">
            <span className="text-[10px] sm:text-xs text-slate-400 uppercase">You:</span>
            <span className="text-amber-300">{myPlayedCard.rank}</span>
          </div>
        )}
      </div>

      {/* Your hand */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col">
        {isSpectator ? (
          <div className="w-full text-center py-4 text-xs sm:text-sm text-amber-300 font-extrabold">
            👁 Spectator Mode — You are watching the live game
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                Your Hand
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-400">
                {sortedHand.length} {sortedHand.length === 1 ? 'card' : 'cards'}
              </span>
            </div>

            <div className="overflow-x-auto pt-5 pb-4 px-2 scrollbar-thin w-full flex justify-start sm:justify-center items-center">
              {sortedHand.length === 0 ? (
                <div className="w-full text-center py-4 text-xs sm:text-sm text-green-400 font-bold">
                  🎉 You have finished all your cards!
                </div>
              ) : (
                <div className="flex -space-x-9 sm:-space-x-10 hover:space-x-0 transition-all duration-300 py-1 pl-2 pr-12 min-w-max">
                  {sortedHand.map((c, i) => {
                    const playable = isCardPlayable(c);
                    return (
                      <div
                        key={`${c.suit}-${c.rank}-${i}`}
                        className="relative transition-all duration-200 hover:z-30 hover:-translate-y-3"
                        style={{ zIndex: i + 1 }}
                      >
                        <Card
                          card={c}
                          onClick={() => handleCardClick(c)}
                          disabled={!playable}
                          isPlayable={playable}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
