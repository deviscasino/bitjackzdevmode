export interface GameResult {
  id: number;
  userId: number;
  gameType: string;
  betAmount: number;
  multiplier: number;
  payout: number;
  result: string;
  timestamp: string;
}

export interface User {
  id: number;
  username: string;
  balance: number;
  createdAt: string;
}

export interface GameState {
  balance: number;
  isPlaying: boolean;
  currentGame: string | null;
}
