const gridElement = document.getElementById('grid');
const memoCheckbox = document.getElementById('memo-mode');
const timerDisplay = document.getElementById('timer');
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'vanilla';

let solution = [];
let timerInterval;
let startTime;
let inequalities = [];

// --- 1. ルール判定統合 ---
function isValid(board, row, col, num) {
    // 標準（行・列・3x3）
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
    // Diagonal
    if (mode === 'diagonal') {
        if (row === col) { for (let i = 0; i < 9; i++) if (board[i][i] === num && i !== row) return false; }
        if (row + col === 8) { for (let i = 0; i < 9; i++) if (board[i][8 - i] === num && i !== row) return false; }
    }
    // Extra Regions
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
    // Inequality
    if (mode === 'inequality') {
        if (!checkInequality(board, row, col, num)) return false;
    }
    return true;
}

function checkInequality(board, row, col, num) {
    for (let ineq of inequalities) {
        if (ineq.r === row && ineq.c === col) {
            let target = board[ineq.tr][ineq.tc];
            if (target !== 0) {
                if (ineq.type === 'greater' && num <= target) return false;
                if (ineq.type === 'less' && num >= target) return false;
            }
        }
        if (ineq.tr === row && ineq.tc === col) {
            let origin = board[ineq.r][ineq.c];
            if (origin !== 0) {
                if (ineq.type === 'greater' && origin <= num) return false;
                if (ineq.type === 'less' && origin >= num) return false;
            }
        }
    }
    return true;
}

// --- 2. 唯一解・生成 ---
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

function generateSudoku() {
    let board = Array.from({ length: 9 }, () => Array(9).fill(0));
    solve(board);
    solution = board.map(row => [...row]);

    if (mode === 'inequality') generateInequalities(solution);

    let targetHints = parseInt(document.getElementById('difficulty-level').value);
    if (mode === 'diagonal' || mode === 'extra' || mode === 'inequality') {
        targetHints = Math.max(targetHints, 25);
    }

    let indices = [...Array(81).keys()].sort(() => Math.random() - 0.5);
    let hints = 81;
    for (let i of indices) {
        if (hints <= targetHints) break;
        let r = Math.floor(i / 9), c = i % 9;
        let backup = board[r][c];
        board[r][c] = 0;
        if (countSolutions(board.map(row => [...row])) !== 1) board[r][c] = backup;
        else hints--;
    }

    const inputs = gridElement.querySelectorAll('input');
    inputs.forEach((input, i) => {
        const r = Math.floor(i / 9), c = i % 9;
        input.value = board[r][c] !== 0 ? board[r][c] : '';
        input.readOnly = board[r][c] !== 0;
        input.className = board[r][c] !== 0 ? 'fixed' : '';
        input.dataset.memos = "";
        input.parentElement.className = 'cell-container'; // クラスリセット
    });

    if (mode === 'inequality') applyInequalityStyles();
    updateNumberCounts();
}

function generateInequalities(fullBoard) {
    inequalities = [];
    let candidates = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (c < 8) candidates.push({r, c, tr: r, tc: c+1, dir: 'h'});
            if (r < 8) candidates.push({r, c, tr: r+1, tc: c, dir: 'v'});
        }
    }
    candidates.sort(() => Math.random() - 0.5);
    candidates.slice(0, 50).forEach(cand => {
        inequalities.push({
            r: cand.r, c: cand.c, tr: cand.tr, tc: cand.tc,
            type: fullBoard[cand.r][cand.c] > fullBoard[cand.tr][cand.tc] ? 'greater' : 'less',
            direction: cand.dir
        });
    });
}

function applyInequalityStyles() {
    const containers = gridElement.querySelectorAll('.cell-container');
    inequalities.forEach(ineq => {
        const idx = ineq.r * 9 + ineq.c;
        const cls = ineq.direction === 'h' ? 
            (ineq.type === 'greater' ? 'ineq-right' : 'ineq-left') :
            (ineq.type === 'greater' ? 'ineq-down' : 'ineq-up');
        containers[idx].classList.add(cls);
    });
}

// --- 3. UI・初期化 ---
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

function handleInput(e) {
    const input = e.target;
    let val = input.value.replace(/[^1-9]/g, '').slice(-1);
    if (memoCheckbox.checked) {
        input.classList.add('memo-cell');
        let memos = input.dataset.memos ? input.dataset.memos.split('') : [];
        if (val) {
            memos = memos.includes(val) ? memos.filter(m => m !== val) : [...memos, val].sort();
            input.dataset.memos = memos.join('');
            input.value = memos.join(' ');
        }
    } else {
        input.classList.remove('memo-cell');
        input.value = val;
    }
    updateNumberCounts();
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
        if (mode === 'diagonal' && (r === c || r + c === 8)) input.classList.add('diag-cell');
        if (mode === 'extra' && ((r>=1 && r<=3 && c>=1 && c<=3)||(r>=1 && r<=3 && c>=5 && c<=7)||(r>=5 && r<=7 && c>=1 && c<=3)||(r>=5 && r<=7 && c>=5 && c<=7))) {
            input.classList.add('extra-cell');
        }
        input.addEventListener('input', handleInput);
        container.appendChild(input);
        gridElement.appendChild(container);
    }
    generateSudoku();
    startTimer();
}

// 以下、startTimer, resetGame, checkAnswer, キーボード操作などは以前のコードを継承
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

function resetGame() { if(confirm("新しく作りますか？")) initBoard(); }

initBoard();