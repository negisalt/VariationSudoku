const gridElement = document.getElementById('grid');
const memoCheckbox = document.getElementById('memo-mode');
const timerDisplay = document.getElementById('timer');
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'vanilla'; // vanilla or diagonal

let solution = [];
let timerInterval;
let startTime;

// --- 1. ルール判定 ---
function isValid(board, row, col, num) {
    // 行と列のチェック
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num && i !== col) return false;
        if (board[i][col] === num && i !== row) return false;
    }
    // 3x3ブロックのチェック
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[startRow + i][startCol + j] === num && (startRow + i !== row || startCol + j !== col)) {
                return false;
            }
        }
    }
    // Diagonal（対角線）ルール
    if (mode === 'diagonal') {
        if (row === col) { // 左上→右下
            for (let i = 0; i < 9; i++) {
                if (board[i][i] === num && i !== row) return false;
            }
        }
        if (row + col === 8) { // 右上→左下
            for (let i = 0; i < 9; i++) {
                if (board[i][8 - i] === num && i !== row) return false;
            }
        }
    }
    return true;
}

// --- 2. 唯一解チェック用ソルバー ---
function countSolutions(board, count = 0) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        count = countSolutions(board, count);
                        board[row][col] = 0;
                        if (count >= 2) return 2;
                    }
                }
                return count;
            }
        }
    }
    return count + 1;
}

// --- 3. 盤面生成アルゴリズム ---
function solve(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                let nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
                for (let num of nums) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solve(board)) return true;
                        board[row][col] = 0;
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

    let targetHints = parseInt(document.getElementById('difficulty-level').value);
    // Diagonalモードは制約が強いため、ヒントを削りすぎると生成が止まるのを防ぐ
    if (mode === 'diagonal') targetHints = Math.max(targetHints, 28);

    let cellIndices = [...Array(81).keys()].sort(() => Math.random() - 0.5);
    let hintsCount = 81;

    for (let i of cellIndices) {
        if (hintsCount <= targetHints) break;
        let r = Math.floor(i / 9), c = i % 9;
        let backup = board[r][c];
        board[r][c] = 0;

        if (countSolutions(board.map(row => [...row])) !== 1) {
            board[r][c] = backup;
        } else {
            hintsCount--;
        }
    }

    const inputs = gridElement.querySelectorAll('input');
    inputs.forEach((input, i) => {
        const r = Math.floor(i / 9), c = i % 9;
        input.value = '';
        input.classList.remove('fixed', 'memo-cell');
        input.readOnly = false;
        input.style.color = 'black';
        input.dataset.memos = "";

        if (board[r][c] !== 0) {
            input.value = board[r][c];
            input.readOnly = true;
            input.classList.add('fixed');
        }
    });
    updateNumberCounts();
}

// --- 4. 数字の使用状況カウント ---
function updateNumberCounts() {
    const inputs = gridElement.querySelectorAll('input');
    const counts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0};

    inputs.forEach(input => {
        if (!input.classList.contains('memo-cell') && input.value >= 1 && input.value <= 9) {
            counts[input.value]++;
        }
    });

    document.querySelectorAll('.num-status').forEach(status => {
        const num = status.dataset.num;
        const countSpan = status.querySelector('.count');
        countSpan.textContent = counts[num];
        if (counts[num] >= 9) status.classList.add('completed');
        else status.classList.remove('completed');
    });
}

// --- 5. イベントハンドラ ---
function handleInput(e) {
    const input = e.target;
    if (input.readOnly) return;
    const val = input.value.replace(/[^1-9]/g, '').slice(-1);
    
    if (memoCheckbox.checked) {
        input.classList.add('memo-cell');
        let memos = input.dataset.memos ? input.dataset.memos.split('') : [];
        if (val) {
            if (memos.includes(val)) memos = memos.filter(m => m !== val);
            else memos.push(val);
            memos.sort();
            input.dataset.memos = memos.join('');
            input.value = memos.join(' ');
        }
    } else {
        input.classList.remove('memo-cell');
        input.dataset.memos = "";
        input.value = val;
    }
    updateNumberCounts();
}

// キーボード操作
document.addEventListener('keydown', (e) => {
    const inputs = Array.from(gridElement.querySelectorAll('input'));
    let idx = inputs.indexOf(document.activeElement);

    if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        if (idx === -1) { inputs[0].focus(); return; }
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

// タイマー・システム
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const m = String(Math.floor(diff / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
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
    if (win) {
        clearInterval(timerInterval);
        alert(`おめでとうございます！ 正解です！ タイム: ${timerDisplay.textContent}`);
    } else {
        alert("間違っているか、埋まっていないマスがあります。");
    }
}

function resetGame() {
    if (confirm("新しくパズルを作成しますか？")) initBoard();
}

// --- 6. 初期化 ---
function initBoard() {
    gridElement.innerHTML = '';
    const titleText = mode === 'diagonal' ? 'Sudoku: Diagonal' : 'Sudoku: Vanilla';
    document.getElementById('game-title').textContent = titleText;

    for (let i = 0; i < 81; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        const r = Math.floor(i / 9), c = i % 9;
        if (mode === 'diagonal' && (r === c || r + c === 8)) {
            input.classList.add('diag-cell');
        }
        input.addEventListener('input', handleInput);
        gridElement.appendChild(input);
    }
    generateSudoku();
    startTimer();
}

initBoard();