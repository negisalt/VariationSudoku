/**
 * Sudoku Core Engine
 * 盤面管理、バリデーション、数独の解決・生成の基本ロジック
 */
class SudokuCore {
    constructor(mode = 'vanilla') {
        this.mode = mode;
        this.solution = [];
        this.currentBoard = [];
        this.inequalities = [];
    }

    isValid(board, row, col, num, inequalities = []) {
        // 基本ルール (行・列・3x3)
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num && i !== col) return false;
            if (board[i][col] === num && i !== row) return false;
        }
        const sR = Math.floor(row / 3) * 3, sC = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[sR + i][sC + j] === num && (sR + i !== row || sC + j !== col)) return false;
            }
        }
        return true;
    }

    solve(board, validationFn) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    let nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
                    for (let n of nums) {
                        if (validationFn(board, r, c, n)) {
                            board[r][c] = n;
                            if (this.solve(board, validationFn)) return true;
                            board[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    countSolutions(board, validationFn, count = 0) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    for (let n = 1; n <= 9; n++) {
                        if (validationFn(board, r, c, n)) {
                            board[r][c] = n;
                            count = this.countSolutions(board, validationFn, count);
                            board[r][c] = 0;
                            if (count >= 2) return 2;
                        }
                    }
                    return count;
                }
            }
        }
        return count + 1;
    }
}

window.SudokuCore = SudokuCore;
