import React from 'react';
import type { Card as CardType, Suit } from '../types';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isPlayable?: boolean;
  small?: boolean;
  className?: string;
}

const suitSymbols: Record<Suit, { symbol: string; color: string }> = {
  Hearts: { symbol: '♥', color: 'text-red-600' },
  Diamonds: { symbol: '♦', color: 'text-red-600' },
  Clubs: { symbol: '♣', color: 'text-slate-900' },
  Spades: { symbol: '♠', color: 'text-slate-900' },
};

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  disabled = false,
  isPlayable = true,
  small = false,
  className = '',
}) => {
  const { symbol, color } = suitSymbols[card.suit];

  if (small) {
    return (
      <div
        onClick={!disabled && onClick ? onClick : undefined}
        className={`w-12 h-16 rounded border border-slate-300 flex flex-col justify-between p-1 select-none font-bold ${
          disabled ? 'cursor-not-allowed bg-slate-200' : 'cursor-pointer bg-white'
        } ${className}`}
      >
        <div className={`text-xs leading-none ${color}`}>{card.rank}</div>
        <div className={`text-center text-sm ${color}`}>{symbol}</div>
        <div className={`text-xs leading-none text-right ${color}`}>{card.rank}</div>
      </div>
    );
  }

  const isHighlighted = isPlayable && !disabled;

  return (
    <button
      type="button"
      onClick={isHighlighted && onClick ? onClick : undefined}
      disabled={!isHighlighted}
      className={`w-16 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-36 rounded border select-none font-bold flex flex-col justify-between p-1.5 sm:p-2 lg:p-2.5 ${
        isHighlighted
          ? 'bg-white border-amber-500 cursor-pointer shadow-md'
          : 'bg-slate-200 border-slate-400 cursor-not-allowed'
      } ${className}`}
    >
      <div className={`flex flex-col items-start leading-none ${color}`}>
        <span className="text-sm sm:text-base lg:text-lg font-bold">{card.rank}</span>
        <span className="text-xs sm:text-sm lg:text-base">{symbol}</span>
      </div>

      <div className={`text-2xl sm:text-3xl lg:text-4xl self-center ${color}`}>
        {symbol}
      </div>

      <div className={`flex flex-col items-end leading-none rotate-180 ${color}`}>
        <span className="text-sm sm:text-base lg:text-lg font-bold">{card.rank}</span>
        <span className="text-xs sm:text-sm lg:text-base">{symbol}</span>
      </div>
    </button>
  );
};
