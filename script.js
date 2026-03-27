const gridElement = document.getElementById('grid');
const memoCheckbox = document.getElementById('memo-mode');
const timerDisplay = document.getElementById('timer');
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'vanilla';

let solution = [];
let timerInterval;
let startTime;
let inequalities = [];

// --- 1. ルール判定 (全モード統合) ---
function isValid(board, row, col, num) {
    // A. 標準ルール (行・列・3x3ブロック)
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

    // B. Diagonal (対角線)
    if (mode === 'diagonal') {
        if (row === col) { for (let i = 0; i < 9; i++) if (board[i][i] === num && i !== row) return false; }
        if (row + col === 8) { for (let i = 0; i < 9; i++) if (board[i][8 - i] === num && i !== row) return false; }
    }

    // C. Extra Regions (j,k,l,m)
    if (mode === 'extra') {
        const regions = [{r:1,c:1},{r:1,c:5},{r:5,c:1},{r:5,c:5}];
        for (let reg of regions) {
            if (row >= reg.r && row < reg.r + 3 && col >= reg.c && col < reg.c + 3) {
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        if (board[reg.r+i][reg.c+j] === num && (reg.r+i !== row || reg.c+j !== col)) return false;
                    }
                }
            }
        }
    }

    // D. Inequality (不等号)
    if (mode === 'inequality') {
        for (let ineq of inequalities) {
            if (ineq.r === row && ineq.c === col) {
                let target = board[ineq.tr][ineq.tc];
                if (target !== 0 && ((ineq.type === 'greater' && num <= target) || (ineq.type === 'less' && num >= target))) return false;
            }
            if (ineq.tr === row && ineq.tc === col) {
                let origin = board[ineq.r][ineq.c];
                if (origin !== 0 && ((ineq.type === 'greater' && origin <= num) || (ineq.type === 'less' && origin >= num))) return false;
            }
        }
    }
    return true;
}

// --- 2. 盤面生成ロジック ---
function solve(board) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                let nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
                for (let n of nums) {
                    if (isValid(board, r, c, n)) {
                        board[r][c] = n;
                        if (solve(board)) return true;
                        board[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function countSolutions(board, count = 0) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                for (let n = 1; n <= 9; n++) {
                    if (isValid(board, r, c, n)) {
                        board[r][c] = n;
                        count = countSolutions(board, count);
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

function generateSudoku() {
    // 1. 内部計算用のボードを作成
    let currentBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    solve(currentBoard); // 満タンの解答を作成
    solution = currentBoard.map(row => [...row]); // 正解を保存

    // 2. 不等号の生成 (Inequalityモードの場合)
    if (mode === 'inequality') {
        inequalities = [];
        let candidates = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (c < 8) candidates.push({r, c, tr: r, tc: c+1, dir: 'h'});
                if (r < 8) candidates.push({r, c, tr: r+1, tc: c, dir: 'v'});
            }
        }
        candidates.sort(() => Math.random() - 0.5).slice(0, 50).forEach(cand => {
            inequalities.push({
                r: cand.r, c: cand.c, tr: cand.tr, tc: cand.tc,
                type: solution[cand.r][cand.c] > solution[cand.tr][cand.tc] ? 'greater' : 'less',
                direction: cand.dir
            });
        });
    }

    // 3. ヒントを削る
    let targetHints = parseInt(document.getElementById('difficulty-level').value) || 30;
    if (mode !== 'vanilla') targetHints = Math.max(targetHints, 26);
    
    let indices = [...Array(81).keys()].sort(() => Math.random() - 0.5);
    let hintsCount = 81;
    for (let i of indices) {
        if (hintsCount <= targetHints) break;
        let r = Math.floor(i / 9), c = i % 9;
        let backup = currentBoard[r][c];
        currentBoard[r][c] = 0;
        if (countSolutions(currentBoard.map(row => [...row])) !== 1) {
            currentBoard[r][c] = backup;
        } else {
            hintsCount--;
        }
    }

    // 4. 画面（DOM）に反映
    const containers = gridElement.querySelectorAll('.cell-container');
    const inputs = gridElement.querySelectorAll('input');
    
    inputs.forEach((input, i) => {
        const r = Math.floor(i / 9), c = i % 9;
        const val = currentBoard[r][c];
        const container = containers[i];
        
        // クラスリセット
        container.classList.remove('fixed-bg');
        input.classList.remove('fixed');
        input.readOnly = false;
        input.style.color = 'black';

        if (val !== 0) {
            input.value = val;
            input.readOnly = true;
            input.classList.add('fixed');
            container.classList.add('fixed-bg');
        } else {
            input.value = '';
        }
    });

    if (mode === 'inequality') applyInequalityStyles();
    updateNumberCounts();
}

function updateNumberCounts() {
    const counts = Array(10).fill(0);
    gridElement.querySelectorAll('input').forEach(input => {
        if (!input.classList.contains('memo-cell') && input.value) counts[input.value]++;
    });
    document.querySelectorAll('.num-status').forEach(s => {
        const n = s.dataset.num;
        s.querySelector('.count').textContent = counts[n];
        s.classList.toggle('completed', counts[n] >= 9);
    });
}

function initBoard() {
    gridElement.innerHTML = '';
    document.getElementById('game-title').textContent = `Sudoku: ${mode.toUpperCase()}`;

    for (let i = 0; i < 81; i++) {
        const container = document.createElement('div');
        container.className = 'cell-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        const r = Math.floor(i / 9), c = i % 9;

        // --- 視覚的誘導（コンテナにクラスを付与） ---
        if (mode === 'diagonal' && (r === c || r + c === 8)) {
            container.classList.add('diag-cell');
        }
        if (mode === 'extra') {
            const isExtra = (r >= 1 && r <= 3 && c >= 1 && c <= 3) || 
                            (r >= 1 && r <= 3 && c >= 5 && c <= 7) || 
                            (r >= 5 && r <= 7 && c >= 1 && c <= 3) || 
                            (r >= 5 && r <= 7 && c >= 5 && c <= 7);
            if (isExtra) container.classList.add('extra-cell');
        }

        input.addEventListener('input', handleInput);
        container.appendChild(input);
        
        // 不等号用
        const h = document.createElement('div'); h.className = 'ineq-h'; container.appendChild(h);
        const v = document.createElement('div'); v.className = 'ineq-v'; container.appendChild(v);
        
        gridElement.appendChild(container);
    }
    generateSudoku();
    startTimer();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = `${String(Math.floor(diff/60)).padStart(2,'0')}:${String(diff%60).padStart(2,'0')}`;
    }, 1000);
}

function checkAnswer() {
    const inputs = gridElement.querySelectorAll('input');
    let win = true;
    inputs.forEach((input, i) => {
        const r = Math.floor(i / 9), c = i % 9;
        if (parseInt(input.value) !== solution[r][c]) {
            win = false;
            if (!input.readOnly) input.style.color = 'red';
        } else {
            input.style.color = 'black';
        }
    });
    if (win) { clearInterval(timerInterval); alert("正解です！"); }
}

function resetGame() { if(confirm("新しくパズルを生成しますか？")) initBoard(); }

document.addEventListener('keydown', (e) => {
    const inputs = Array.from(gridElement.querySelectorAll('input'));
    let idx = inputs.indexOf(document.activeElement);
    if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        if (e.key === 'ArrowUp') idx -= 9;
        if (e.key === 'ArrowDown') idx += 9;
        if (e.key === 'ArrowLeft') idx -= 1;
        if (e.key === 'ArrowRight') idx += 1;
        if (idx >= 0 && idx < 81) inputs[idx].focus();
    }
    if (e.key === 'Shift') {
        memoCheckbox.checked = !memoCheckbox.checked;
        document.body.classList.toggle('memo-active', memoCheckbox.checked);
    }
});

initBoard();