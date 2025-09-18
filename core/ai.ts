import { CellState, AIDifficulty, Player, CellType } from '../types';
import { BOARD_SIZE, WINNING_LENGTH } from '../constants';

const getCandidateMoves = (board: CellState[][]): { row: number, col: number }[] => {
    const candidates = new Set<string>();
    let hasPieces = false;
    const searchRadius = 2;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c]) {
                hasPieces = true;
                for (let dr = -searchRadius; dr <= searchRadius; dr++) {
                    for (let dc = -searchRadius; dc <= searchRadius; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !board[nr][nc]) {
                            candidates.add(`${nr},${nc}`);
                        }
                    }
                }
            }
        }
    }

    if (!hasPieces) {
         return [{ row: Math.floor(BOARD_SIZE / 2), col: Math.floor(BOARD_SIZE / 2) }];
    }
    
    return Array.from(candidates).map(c => {
        const [row, col] = c.split(',').map(Number);
        return { row, col };
    });
};

const SCORES = {
    FIVE: 10000000,
    FOUR_OPEN: 50000,
    FOUR_CLOSED: 4000,
    THREE_OPEN: 5000,
    THREE_CLOSED: 300,
    TWO_OPEN: 50,
    TWO_CLOSED: 10,
};

const evaluateLine = (line: (CellState | { type: CellType, player: Player })[]) => {
    let score = { 'X': 0, 'O': 0 };

    const countPatterns = (player: Player) => {
        let playerScore = 0;
        for (let i = 0; i < line.length; i++) {
            if (line[i]?.player === player) {
                let consecutive = 1;
                while(i + 1 < line.length && line[i+1]?.player === player) {
                    consecutive++;
                    i++;
                }

                const leftOpen = i - consecutive >= 0 && line[i - consecutive] === null;
                const rightOpen = i + 1 < line.length && line[i + 1] === null;
                const openEnds = (leftOpen ? 1 : 0) + (rightOpen ? 1 : 0);

                if (consecutive >= WINNING_LENGTH) playerScore += SCORES.FIVE;
                else if (consecutive === 4) playerScore += openEnds === 2 ? SCORES.FOUR_OPEN : (openEnds === 1 ? SCORES.FOUR_CLOSED : 0);
                else if (consecutive === 3) playerScore += openEnds === 2 ? SCORES.THREE_OPEN : (openEnds === 1 ? SCORES.THREE_CLOSED : 0);
                else if (consecutive === 2) playerScore += openEnds === 2 ? SCORES.TWO_OPEN : (openEnds === 1 ? SCORES.TWO_CLOSED : 0);
            }
        }
        return playerScore;
    };

    score['O'] += countPatterns('O');
    score['X'] += countPatterns('X');

    return score['O'] - score['X'];
};


const evaluateBoard = (board: CellState[][]) => {
    let totalScore = 0;
    
    // Rows and Columns
    for (let i = 0; i < BOARD_SIZE; i++) {
        const row = board[i];
        const col = board.map(r => r[i]);
        totalScore += evaluateLine(row);
        totalScore += evaluateLine(col);
    }
    
    // Diagonals
    for (let i = 0; i < BOARD_SIZE * 2 - 1; i++) {
        const diag1 = [];
        const diag2 = [];
        for (let j = 0; j <= i; j++) {
            const r1 = j;
            const c1 = i - j;
            const r2 = j;
            const c2 = BOARD_SIZE - 1 - i + j;

            if (r1 < BOARD_SIZE && c1 < BOARD_SIZE) diag1.push(board[r1][c1]);
            if (r2 < BOARD_SIZE && c2 >= 0 && c2 < BOARD_SIZE) diag2.push(board[r2][c2]);
        }
        if(diag1.length >= WINNING_LENGTH) totalScore += evaluateLine(diag1);
        if(diag2.length >= WINNING_LENGTH) totalScore += evaluateLine(diag2);
    }

    return totalScore;
};

const minimax = (board: CellState[][], depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
    const score = evaluateBoard(board);

    if (Math.abs(score) >= SCORES.FIVE) {
        return score;
    }
    if (depth === 0) {
        return score;
    }

    const moves = getCandidateMoves(board);
    if (moves.length === 0) {
        return 0; // Draw
    }
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            board[move.row][move.col] = { type: 'PLAYER', player: 'O' };
            const evalScore = minimax(board, depth - 1, alpha, beta, false);
            board[move.row][move.col] = null;
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            board[move.row][move.col] = { type: 'PLAYER', player: 'X' };
            const evalScore = minimax(board, depth - 1, alpha, beta, true);
            board[move.row][move.col] = null;
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}


const findBestMove = (board: CellState[][], difficulty: AIDifficulty): { row: number, col: number } => {
    const moves = getCandidateMoves(board);
    if (moves.length === 0) return { row: -1, col: -1 };

    // "Hard Shield": Check for immediate win or block
    for (const move of moves) {
        // Check if AI can win
        board[move.row][move.col] = { type: 'PLAYER', player: 'O' };
        if (evaluateBoard(board) >= SCORES.FIVE) {
            board[move.row][move.col] = null;
            return move;
        }
        board[move.row][move.col] = null;
    }
    for (const move of moves) {
         // Check if player is about to win and block
        board[move.row][move.col] = { type: 'PLAYER', player: 'X' };
        if (evaluateBoard(board) <= -SCORES.FIVE) {
            board[move.row][move.col] = null;
            return move;
        }
        board[move.row][move.col] = null;
    }


    let bestMove = moves[0];
    let bestValue = -Infinity;
    const depth = difficulty === 'MEDIUM' ? 2 : 4;

    for (const move of moves) {
        board[move.row][move.col] = { type: 'PLAYER', player: 'O' };
        const moveValue = minimax(board, depth, -Infinity, Infinity, false);
        board[move.row][move.col] = null;

        if (moveValue > bestValue) {
            bestValue = moveValue;
            bestMove = move;
        } else if (moveValue === bestValue && Math.random() > 0.5) {
            bestMove = move;
        }
    }

    return bestMove;
};


export const calculateAIMove = (board: CellState[][], difficulty: AIDifficulty): { row: number, col: number } => {
    const allAvailableMoves: {row: number, col: number}[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (!board[r][c]) {
                allAvailableMoves.push({ row: r, col: c });
            }
        }
    }
    if (allAvailableMoves.length === 0) return { row: -1, col: -1 };

    switch (difficulty) {
        case 'EASY': {
            return allAvailableMoves[Math.floor(Math.random() * allAvailableMoves.length)];
        }
        case 'MEDIUM':
        case 'HARD': {
            const boardCopy = board.map(row => [...row]);
            return findBestMove(boardCopy, difficulty);
        }
        default: {
            return allAvailableMoves[Math.floor(Math.random() * allAvailableMoves.length)];
        }
    }
};
