import React, { useState, useCallback, useEffect } from 'react';
import { Player, CellState, Bomb, GameStatus, Explosion, GameMode, AIDifficulty } from './types';
import { BOARD_SIZE, WINNING_LENGTH, BOMB_CHANCE, BOMB_INITIAL_TIMER } from './constants';
import Board from './components/Board';
import { initAudio, playMoveSound, playExplosionSound } from './utils/audio';
import { calculateAIMove } from './core/ai';

const createEmptyBoard = (): CellState[][] => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

const App: React.FC = () => {
    const [gameStatus, setGameStatus] = useState<GameStatus>('START');
    const [board, setBoard] = useState<CellState[][]>(createEmptyBoard);
    const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
    const [winner, setWinner] = useState<Player | 'Hòa' | null>(null);
    const [bombs, setBombs] = useState<Bomb[]>([]);
    const [explodingCells, setExplodingCells] = useState<Explosion[]>([]);
    const [notification, setNotification] = useState<string>('');
    const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
    const [gameMode, setGameMode] = useState<GameMode | null>(null);
    const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty | null>(null);
    const [isChoosingDifficulty, setIsChoosingDifficulty] = useState(false);
    const [isAiThinking, setIsAiThinking] = useState(false);

    const checkWinner = useCallback((currentBoard: CellState[][], player: Player): boolean => {
        const directions = [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: -1 }];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (currentBoard[r][c]?.type === 'PLAYER' && currentBoard[r][c]?.player === player) {
                    for (const dir of directions) {
                        let count = 1;
                        for (let i = 1; i < WINNING_LENGTH; i++) {
                            const newR = r + i * dir.r; const newC = c + i * dir.c;
                            if (newR >= 0 && newR < BOARD_SIZE && newC >= 0 && newC < BOARD_SIZE && currentBoard[newR][newC]?.type === 'PLAYER' && currentBoard[newR][newC]?.player === player) {
                                count++;
                            } else { break; }
                        }
                        if (count >= WINNING_LENGTH) return true;
                    }
                }
            }
        }
        return false;
    }, []);
    
    const nextTurn = useCallback(() => {
       setCurrentPlayer(p => (p === 'X' ? 'O' : 'X'));
    }, []);

    const startGame = (mode: GameMode, difficulty?: AIDifficulty) => {
        initAudio();
        setGameMode(mode);
        if (difficulty) setAiDifficulty(difficulty);
        setGameStatus('PLAYING');
        setBoard(createEmptyBoard());
        setCurrentPlayer('X');
        setWinner(null);
        setBombs([]);
        setExplodingCells([]);
        setNotification('');
        setLastMove(null);
        setIsChoosingDifficulty(false);
    };

    const handleCellClick = useCallback((row: number, col: number) => {
        if (board[row][col] || winner || gameStatus !== 'PLAYING' || explodingCells.length > 0 || isAiThinking) return;

        playMoveSound();
        setLastMove({ row, col });
        let newBoard = board.map(r => [...r]);
        let newBombs = [...bombs];

        const isBomb = Math.random() < BOMB_CHANCE;
        if (isBomb) {
            newBoard[row][col] = { type: 'BOMB', player: currentPlayer };
            newBombs.push({ row, col, timer: BOMB_INITIAL_TIMER + 1, owner: currentPlayer });
            setNotification('💣 Bom hẹn giờ! Nổ sau 3 lượt.');
            setTimeout(() => setNotification(''), 2000);
        } else {
            newBoard[row][col] = { type: 'PLAYER', player: currentPlayer };
        }

        if (checkWinner(newBoard, currentPlayer)) {
            setWinner(currentPlayer);
            setGameStatus('ENDED');
            setBoard(newBoard);
            setBombs(newBombs);
            return;
        }

        let explosions: Explosion[] = [];
        const remainingBombs: Bomb[] = [];
        newBombs.forEach(bomb => {
            const updatedBomb = { ...bomb, timer: bomb.timer - 1 };
            if (updatedBomb.timer <= 0) {
                playExplosionSound();
                explosions.push({ row: updatedBomb.row, col: updatedBomb.col });
                [{r:1,c:0},{r:-1,c:0},{r:0,c:1},{r:0,c:-1}].forEach(dir => {
                    const nextR = updatedBomb.row + dir.r; 
                    const nextC = updatedBomb.col + dir.c;
                    if(nextR >= 0 && nextR < BOARD_SIZE && nextC >= 0 && nextC < BOARD_SIZE) {
                        explosions.push({ row: nextR, col: nextC });
                    }
                });
            } else { remainingBombs.push(updatedBomb); }
        });
        
        setBoard(newBoard);
        setBombs(remainingBombs);

        if (explosions.length > 0) {
            setExplodingCells(explosions);
        } else {
            const isBoardFull = newBoard.every(r => r.every(cell => cell !== null));
            if (isBoardFull) {
                setWinner('Hòa');
                setGameStatus('ENDED');
            } else {
                nextTurn();
            }
        }
    }, [board, bombs, checkWinner, currentPlayer, gameStatus, isAiThinking, winner, explodingCells.length, nextTurn]);

    useEffect(() => {
        if (explodingCells.length === 0) return;

        const explosionTimeout = setTimeout(() => {
            const boardAfterExplosion = board.map(row => [...row]);
            explodingCells.forEach(({ row, col }) => {
                if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
                    boardAfterExplosion[row][col] = null;
                }
            });

            setExplodingCells([]);

            const opponent = currentPlayer === 'X' ? 'O' : 'X';
            if (checkWinner(boardAfterExplosion, currentPlayer)) {
                setWinner(currentPlayer);
                setGameStatus('ENDED');
            } else if (checkWinner(boardAfterExplosion, opponent)) {
                setWinner(opponent);
                setGameStatus('ENDED');
            } else {
                const isBoardFull = boardAfterExplosion.every(r => r.every(cell => cell !== null));
                if (isBoardFull && bombs.length === 0) {
                    setWinner('Hòa');
                    setGameStatus('ENDED');
                } else {
                    nextTurn();
                }
            }
            setBoard(boardAfterExplosion);

        }, 500);

        return () => clearTimeout(explosionTimeout);
    }, [explodingCells, board, bombs, currentPlayer, checkWinner, nextTurn]);
    
    useEffect(() => {
        if (gameMode === 'AI' && currentPlayer === 'O' && gameStatus === 'PLAYING' && !winner) {
            setIsAiThinking(true);
            const thinkingTimeout = setTimeout(() => {
                // FIX: Removed `bombs` argument as `calculateAIMove` only expects 2 arguments.
                const move = calculateAIMove(board, aiDifficulty!);
                if (move && move.row !== -1) {
                    handleCellClick(move.row, move.col);
                }
                setIsAiThinking(false);
            }, 300);

            return () => clearTimeout(thinkingTimeout);
        }
    }, [gameMode, currentPlayer, gameStatus, winner, board, bombs, aiDifficulty, handleCellClick]);

    const renderStartScreen = () => (
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-wider">Caro Bom Hẹn Giờ</h1>
            {!isChoosingDifficulty ? (
                <div className="space-y-4">
                    <button onClick={() => startGame('PVP')} className="w-64 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105">
                        2 Người Chơi
                    </button>
                    <button onClick={() => setIsChoosingDifficulty(true)} className="w-64 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105">
                        Chơi với Máy
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-4">
                    <h2 className="text-3xl mb-4">Chọn Độ Khó</h2>
                    <button onClick={() => startGame('AI', 'EASY')} className="w-64 bg-green-700 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105">
                        Dễ
                    </button>
                    <button onClick={() => startGame('AI', 'MEDIUM')} className="w-64 bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105">
                        Trung Bình
                    </button>
                    <button onClick={() => startGame('AI', 'HARD')} className="w-64 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105">
                        Khó
                    </button>
                    <button onClick={() => setIsChoosingDifficulty(false)} className="mt-4 text-gray-400 hover:text-white">
                        Quay lại
                    </button>
                </div>
            )}
        </div>
    );
    
    const renderGameScreen = () => (
        <div className="flex flex-col items-center">
            <div className="mb-4 text-2xl h-12 flex items-center justify-center text-center">
                {winner ? (
                    <span className="text-green-400 animate-pulse">
                        {winner === 'Hòa' ? 'Trận đấu hòa!' : `Người chơi ${winner} thắng!`}
                    </span>
                ) : (
                    <span className="text-gray-400">
                        {isAiThinking ? 'Máy đang suy nghĩ...' : `Lượt của: Người chơi ${currentPlayer}`}
                    </span>
                )}
            </div>
            
            <Board 
                board={board} 
                bombs={bombs} 
                explodingCells={explodingCells}
                lastMove={lastMove} 
                onCellClick={handleCellClick} 
            />

            <div className="mt-4 h-8 text-xl text-yellow-400 font-bold">
                {notification}
            </div>
            
            <button 
                onClick={() => {
                    setGameStatus('START');
                    setIsChoosingDifficulty(false);
                }}
                className="mt-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
            >
                {winner ? 'Chơi lại' : 'Về Menu Chính'}
            </button>
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-900 text-white font-mono flex items-center justify-center p-4">
            {gameStatus === 'START' ? renderStartScreen() : renderGameScreen()}
        </main>
    );
};

export default App;