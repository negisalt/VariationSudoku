/**
 * Main Application Entry Point
 */
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode") || "vanilla";
    
    const core = new SudokuCore(mode);
    const modeConfig = SudokuModes[mode] || SudokuModes.vanilla;
    const ui = new SudokuUI(core, modeConfig);

    // スライダー系要素
    const hintSlider = document.getElementById("hint-slider");
    const hintValueDisplay = document.getElementById("hint-value");
    const difficultyText = document.getElementById("difficulty-text");
    
    const ineqConfig = document.getElementById("inequality-config");
    const ineqSlider = document.getElementById("ineq-slider");
    const ineqValueDisplay = document.getElementById("ineq-value");

    // 初期化設定
    hintSlider.min = modeConfig.minHints;
    hintSlider.max = modeConfig.maxHints;
    hintSlider.value = modeConfig.defaultHints;
    hintValueDisplay.textContent = hintSlider.value;

    if (mode === "inequality") {
        ineqConfig.style.display = "block";
        ineqSlider.addEventListener("input", (e) => {
            ineqValueDisplay.textContent = e.target.value;
        });
    }

    function updateDifficultyLabel(val) {
        const range = modeConfig.maxHints - modeConfig.minHints;
        const percent = (val - modeConfig.minHints) / (range || 1);
        if (percent > 0.8) difficultyText.textContent = "かんたん";
        else if (percent > 0.5) difficultyText.textContent = "やや易しい";
        else if (percent > 0.3) difficultyText.textContent = "ふつう";
        else if (percent > 0.1) difficultyText.textContent = "むずかしい";
        else difficultyText.textContent = "極限";
    }

    hintSlider.addEventListener("input", (e) => {
        hintValueDisplay.textContent = e.target.value;
        updateDifficultyLabel(e.target.value);
    });

    updateDifficultyLabel(hintSlider.value);

    function generateGame() {
        modeConfig.onInit(core);
        
        // 1. 正解盤面生成
        core.currentBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
        core.solve(core.currentBoard, (b, r, c, n) => modeConfig.isValid(core, b, r, c, n));
        core.solution = core.currentBoard.map(row => [...row]);

        // 2. モード固有の生成処理 (不等号など)
        modeConfig.onGenerate(core, core.currentBoard);

        // 3. ヒント削除
        let targetHints = parseInt(hintSlider.value);
        
        let indices = [...Array(81).keys()].sort(() => Math.random() - 0.5);
        let hintsCount = 81;
        for (let i of indices) {
            if (hintsCount <= targetHints) break;
            let r = Math.floor(i / 9), c = i % 9;
            let backup = core.currentBoard[r][c];
            core.currentBoard[r][c] = 0;
            if (core.countSolutions(core.currentBoard.map(row => [...row]), (b, r, c, n) => modeConfig.isValid(core, b, r, c, n)) !== 1) {
                core.currentBoard[r][c] = backup;
            } else {
                hintsCount--;
            }
        }

        ui.init();
        ui.renderBoard(core.currentBoard);
    }

    window.checkAnswer = () => ui.checkAnswer();
    window.resetGame = () => { if(confirm("再生成しますか？")) generateGame(); };

    document.addEventListener("keydown", (e) => {
        const inputs = Array.from(document.querySelectorAll("#grid input"));
        let idx = inputs.indexOf(document.activeElement);
        if (e.key.startsWith("Arrow")) {
            e.preventDefault();
            if (e.key === "ArrowUp") idx -= 9;
            if (e.key === "ArrowDown") idx += 9;
            if (e.key === "ArrowLeft") idx -= 1;
            if (e.key === "ArrowRight") idx += 1;
            if (idx >= 0 && idx < 81) inputs[idx].focus();
        }
        if (e.key === "Shift") {
            ui.memoCheckbox.checked = !ui.memoCheckbox.checked;
            document.body.classList.toggle("memo-active", ui.memoCheckbox.checked);
        }
    });

    generateGame();
});
