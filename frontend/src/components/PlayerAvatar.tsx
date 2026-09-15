import React from 'react';
import type { Player, Card as CardType, Suit } from '../types';

interface PlayerAvatarProps {
  player: Player;
  isCurrentTurn: boolean;
  playedCard?: CardType;
  isSelf?: boolean;
}

const suitSymbols: Record<Suit, { symbol: string; color: string }> = {
  Hearts: { symbol: '♥', color: 'text-red-500' },
  Diamonds: { symbol: '♦', color: 'text-red-500' },
  Clubs: { symbol: '♣', color: 'text-slate-300' },
  Spades: { symbol: '♠', color: 'text-slate-300' },
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  isCurrentTurn,
  playedCard,
  isSelf = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center p-2 lg:p-3 rounded min-w-[90px] lg:min-w-[110px] ${
        isCurrentTurn
          ? 'bg-slate-800 border-2 border-amber-500'
          : 'bg-slate-900 border border-slate-700'
      }`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-xs lg:text-sm font-medium text-slate-100 max-w-[75px] lg:max-w-[100px] truncate">
          {player.name}
        </span>
        {player.isHost && <span className="text-xs" title="Host">*</span>}
        {isSelf && <span className="text-[10px] lg:text-xs text-slate-400">(you)</span>}
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] lg:text-sm text-slate-400">
        <span>{player.hand?.length ?? 0} cards</span>
        {player.ping !== undefined && player.ping >= 0 && (
          <span className="text-[9px] lg:text-xs font-mono" title={`Latency: ${player.ping}ms`}>
            {player.ping}ms
          </span>
        )}
      </div>

      {playedCard ? (
        <div className="mt-1 flex items-center gap-1 text-xs lg:text-sm">
          <span className={suitSymbols[playedCard.suit].color}>
            {suitSymbols[playedCard.suit].symbol}
          </span>
          <span className="text-slate-200">{playedCard.rank}</span>
        </div>
      ) : isCurrentTurn ? (
        <span className="mt-1 text-[10px] lg:text-xs text-amber-400">Turn</span>
      ) : !player.isConnected ? (
        <span className="mt-1 text-[10px] lg:text-xs text-red-400">Offline</span>
      ) : null}
    </div>
  );
};
