export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  sessionToken?: string;
  name: string;
  hand: Card[];
  isConnected: boolean;
  isHost: boolean;
  isSpectator?: boolean;
  ping?: number;
}

export type GameState = 'LOBBY' | 'PLAYING' | 'FINISHED';

export interface PlayedCard {
  playerId: string;
  card: Card;
}

export interface Room {
  id: string;
  players: Player[];
  state: GameState;
  currentTurnId: string | null;
  centerCards: PlayedCard[];
  ledSuit: Suit | null;
  kazhuthaId: string | null;
  lastTrickMessage?: string | null;
  finishedOrder?: string[];
  isFirstLead?: boolean;
}
