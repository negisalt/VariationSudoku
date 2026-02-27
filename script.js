// script.js

// --- グローバル変数 ---
const gridElement = document.getElementById('grid');
const memoCheckbox = document.getElementById('memo-mode');
const timerDisplay = document.getElementById('timer');
let solution = []; 
let timerInterval;
let startTime;
let hintNum = 30;

// --- 1. 初期化処理 ---
function initBoard() {
    gridElement.innerHTML = '';
    for (let i = 0; i < 81; i++) {
        const input = document.createElement('input');
        input.type = 'text'; // メモ入力のためにtextに
        input.maxLength = 10;
        input.addEventListener('input', handleInput);
        gridElement.appendChild(input);
    }
    generateSudoku();
    startTimer();
}

// --- 2. 数独生成ロジック ---
function isValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        const m = 3 * Math.floor(row / 3) + Math.floor(i / 3);
        const n = 3 * Math.floor(col / 3) + i % 3;
        if (board[row][i] === num || board[i][col] === num || board[m][n] === num) return false;
    }
    return true;
}

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

// 解の個数を数える関数（再帰的に探索し、2つ見つかった時点で止める）
function countSolutions(board, count = 0) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        count = countSolutions(board, count);
                        board[row][col] = 0;
                        if (count >= 2) return count; // 2つ以上あれば唯一解ではない
                    }
                }
                return count;
            }
        }
    }
    return count + 1;
}

function generateSudoku() {
    // 1. まず完成盤面を作る
    let board = Array.from({ length: 9 }, () => Array(9).fill(0));
    solve(board);
    solution = board.map(row => [...row]);

    // 2. 消す順番をランダムに決める（0〜80の配列をシャッフル）
    let cellIndices = [...Array(81).keys()].sort(() => Math.random() - 0.5);

    // 3. 可能な限り数字を消していく
    // 目標のヒント数（例：30個程度）を設定することも可能ですが、
    let hintsCount = 81;
    for (let i of cellIndices) {
        if (hintsCount <= hintNum) break;

        let r = Math.floor(i / 9);
        let c = i % 9;
        
        let backup = board[r][c];
        board[r][c] = 0;

        // 答えが1つより多くなるなら、消しちゃダメなので戻す
        if (countSolutions(board.map(row => [...row])) !== 1) {
            board[r][c] = backup;
        } else {
            hintsCount--;
        }
    }

    // 4. 画面に反映
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
}

// --- 3. ユーザー入力ハンドラ ---
function handleInput(e) {
    const input = e.target;
    if (input.readOnly) return;

    const rawValue = input.value.replace(/[^1-9]/g, '');
    const lastChar = rawValue.slice(-1);

    if (memoCheckbox.checked) {
        // メモモード：数字をトグルして並べる
        input.classList.add('memo-cell');
        let currentMemos = input.dataset.memos ? input.dataset.memos.split('') : [];
        if (lastChar) {
            if (currentMemos.includes(lastChar)) {
                currentMemos = currentMemos.filter(m => m !== lastChar);
            } else {
                currentMemos.push(lastChar);
            }
            currentMemos.sort();
            input.dataset.memos = currentMemos.join('');
            input.value = currentMemos.join(' ');
        }
    } else {
        // 通常モード：すでに入っている数字と同じ数字を打ったら消去する
        if (input.dataset.lastValue === lastChar && lastChar !== "") {
            input.value = "";
            input.dataset.lastValue = "";
        } else {
            input.value = lastChar;
            input.dataset.lastValue = lastChar;
        }
        input.classList.remove('memo-cell');
    }
}

// --- 4. 判定・タイマー機能 ---
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
        alert(`正解です！ タイム: ${timerDisplay.textContent}`);
    } else {
        alert("間違っているか、埋まっていないマスがあります。");
    }
}

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

function resetGame() {
    if (confirm("新しくゲームを開始しますか？")) initBoard();
}

// 起動
initBoard();