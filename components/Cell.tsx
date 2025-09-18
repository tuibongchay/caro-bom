
import React, { memo, useState, useEffect } from 'react';
import { CellState, Bomb } from '../types';

interface CellProps {
  cellState: CellState;
  bomb: Bomb | null;
  isExploding: boolean;
  isJustPlaced: boolean;
  onClick: () => void;
}

const Cell: React.FC<CellProps> = memo(({ cellState, bomb, isExploding, isJustPlaced, onClick }) => {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (isJustPlaced && cellState?.type === 'BOMB') {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isJustPlaced, cellState]);

  const baseClasses = "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-bold text-xl md:text-2xl border transition-all duration-200 ease-in-out";
  const disabledClasses = "cursor-default";
  const enabledClasses = "cursor-pointer hover:bg-gray-700";

  let content: React.ReactNode = null;

  if (cellState) {
    if (cellState.type === 'BOMB' && bomb) {
      content = (
        <span className="relative flex items-center justify-center text-gray-100">
          ●<span className="absolute text-xs text-white">{bomb.timer}</span>
        </span>
      );
    } else if (cellState.player === 'X') {
        content = (
            <div className="relative w-5/6 h-5/6 flex items-center justify-center">
                <div className="absolute w-full h-[15%] bg-gray-100 transform rotate-45 rounded-full"></div>
                <div className="absolute w-full h-[15%] bg-gray-100 transform -rotate-45 rounded-full"></div>
            </div>
        );
    } else { // Player 'O'
        content = (
            <div className="w-[80%] h-[80%] border-[4px] md:border-[5px] rounded-full border-gray-400"></div>
        );
    }
  }

  const isAboutToExplode = bomb?.timer === 1;

  const animationClasses = `
    ${isExploding ? 'animate-flash bg-white' : ''}
    ${isPulsing ? 'animate-pulse' : ''}
  `;

  const borderClasses = isAboutToExplode
    ? 'border-2 border-white'
    : 'border-gray-600';

  return (
    <button
      onClick={onClick}
      disabled={!!cellState}
      className={`
        ${baseClasses}
        ${cellState ? disabledClasses : enabledClasses}
        ${cellState ? 'bg-gray-800' : 'bg-gray-800/50'}
        ${borderClasses}
        ${animationClasses}
      `}
      aria-label={`Cell ${content ? `with ${cellState?.player}` : 'empty'}`}
    >
      {content}
    </button>
  );
});

export default Cell;
