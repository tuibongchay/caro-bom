
import React, { memo } from 'react';
import { CellState, Bomb, Explosion } from '../types';
import Cell from './Cell';

interface BoardProps {
  board: CellState[][];
  bombs: Bomb[];
  explodingCells: Explosion[];
  lastMove: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
}

const Board: React.FC<BoardProps> = memo(({ board, bombs, explodingCells, lastMove, onCellClick }) => {
  return (
    <div className="bg-gray-800 p-2 rounded-lg shadow-lg">
      <div 
        className="grid" 
        style={{ 
          gridTemplateColumns: `repeat(${board.length}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${board.length}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const bomb = bombs.find(b => b.row === r && b.col === c) || null;
            const isExploding = explodingCells.some(ec => ec.row === r && ec.col === c);
            const isJustPlaced = lastMove?.row === r && lastMove?.col === c;
            return (
              <Cell
                key={`${r}-${c}`}
                cellState={cell}
                bomb={bomb}
                isExploding={isExploding}
                isJustPlaced={isJustPlaced}
                onClick={() => onCellClick(r, c)}
              />
            );
          })
        )}
      </div>
    </div>
  );
});

export default Board;
