
export type Player = 'X' | 'O';

export type Bomb = {
  row: number;
  col: number;
  timer: number;
  owner: Player;
};

export type CellType = 'PLAYER' | 'BOMB';

export type CellState = {
    type: CellType;
    player: Player;
} | null;

export type GameStatus = 'START' | 'PLAYING' | 'ENDED';

export type Explosion = {
  row: number;
  col: number;
};

export type GameMode = 'PVP' | 'AI';
export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
