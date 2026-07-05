/**
 * Sudoku UI Controller
 * DOM操作、イベントハンドリング、レンダリング
 */
class SudokuUI {
    constructor(core, modeConfig) {
        this.core = core;
        this.modeConfig = modeConfig;
        this.gridElement = document.getElementById('grid');
        this.timerDisplay = document.getElementById('timer');
        this.memoCheckbox = document.getElementById('memo-mode');
        this.startTime = null;
        this.timerInterval = null;
    }

    init() {
        this.gridElement.innerHTML = '';
        document.getElementById('game-title').textContent = "Sudoku: " + this.core.mode.toUpperCase();

        for (let i = 0; i < 81; i++) {
            const container = document.createElement('div');
            container.className = 'cell-container';
            const r = Math.floor(i / 9), c = i % 9;

            // 特殊背景（対角線・エリア）
            if (this.core.mode === 'diagonal' && (r === c || r + c === 8)) container.classList.add('diag-cell');
            if (this.core.mode === 'extra') {
                const isExtra = (r >= 1 && r <= 3 && c >= 1 && c <= 3) || (r >= 1 && r <= 3 && c >= 5 && c <= 7) ||
                                (r >= 5 && r <= 7 && c >= 1 && c <= 3) || (r >= 5 && r <= 7 && c >= 5 && c <= 7);
                if (isExtra) container.classList.add('extra-cell');
            }
            if (this.core.mode === 'triple') {
                if (this.core.solution && this.core.solution[r] && this.core.solution[r][c] % 3 === 0) {
                    container.classList.add('triple-cell');
                }
            }

            const input = document.createElement('input');
            input.type = 'text';
            input.addEventListener('input', (e) => this.handleInput(e));
            container.appendChild(input);

            // 不等号用要素
            const h = document.createElement('div'); h.className = 'ineq-h'; container.appendChild(h);
            const v = document.createElement('div'); v.className = 'ineq-v'; container.appendChild(v);

            this.gridElement.appendChild(container);
        }
        this.startTimer();
    }

    renderBoard(board) {
        const containers = this.gridElement.querySelectorAll('.cell-container');
        const inputs = this.gridElement.querySelectorAll('input');

        inputs.forEach((input, i) => {
            const r = Math.floor(i / 9), c = i % 9;
            const val = board[r][c];
            const container = containers[i];

            container.classList.remove('fixed-bg');
            input.classList.remove('fixed', 'memo-cell');
            input.readOnly = false;
            input.style.color = 'black';
            input.value = val !== 0 ? val : '';
            input.dataset.memos = '[]';
            input.style.fontSize = '24px';

            if (val !== 0) {
                input.readOnly = true;
                input.classList.add('fixed');
                container.classList.add('fixed-bg');
            }
        });

        if (this.core.mode === 'inequality') this.applyInequalityStyles();
        this.updateNumberCounts();
    }

    handleInput(e) {
        const input = e.target;
        let val = input.value.replace(/[^1-9]/g, '');
        if (val.length > 1) val = val.slice(-1);

        if (this.memoCheckbox.checked) {
            input.value = '';
            if (val) {
                let memos = input.dataset.memos ? JSON.parse(input.dataset.memos) : [];
                memos = memos.includes(val) ? memos.filter(m => m !== val) : [...memos, val].sort();
                input.dataset.memos = JSON.stringify(memos);
                input.classList.add('memo-cell');
                input.value = memos.join('');
                input.style.fontSize = '12px';
            }
        } else {
            input.value = val;
            input.dataset.memos = '[]';
            input.classList.remove('memo-cell');
            input.style.fontSize = '24px';
            this.updateNumberCounts();
        }
    }

    applyInequalityStyles() {
        const containers = this.gridElement.querySelectorAll('.cell-container');
        this.core.inequalities.forEach(ineq => {
            const container = containers[ineq.r * 9 + ineq.c];
            if (ineq.direction === 'h') {
                const el = container.querySelector('.ineq-h');
                el.textContent = ineq.type === 'greater' ? '>' : '<';
                el.classList.add('show');
            } else {
                const el = container.querySelector('.ineq-v');
                el.textContent = ineq.type === 'greater' ? '∨' : '∧';
                el.classList.add('show');
            }
        });
    }

    updateNumberCounts() {
        const counts = Array(10).fill(0);
        this.gridElement.querySelectorAll('input').forEach(input => {
            if (!input.classList.contains('memo-cell') && input.value) counts[input.value]++;
        });
        document.querySelectorAll('.num-status').forEach(s => {
            const n = s.dataset.num;
            s.querySelector('.count').textContent = counts[n];
            s.classList.toggle('completed', counts[n] >= 9);
        });
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const diff = Math.floor((Date.now() - this.startTime) / 1000);
            this.timerDisplay.textContent = String(Math.floor(diff/60)).padStart(2,'0') + ":" + String(diff%60).padStart(2,'0');
        }, 1000);
    }

    checkAnswer() {
        const inputs = this.gridElement.querySelectorAll('input');
        let win = true;
        inputs.forEach((input, i) => {
            const r = Math.floor(i / 9), c = i % 9;
            if (parseInt(input.value) !== this.core.solution[r][c]) {
                win = false;
                if (!input.readOnly) input.style.color = 'red';
            } else {
                input.style.color = 'black';
            }
        });
        if (win) { clearInterval(this.timerInterval); alert("おめでとうございます！"); }
    }
}

window.SudokuUI = SudokuUI;
