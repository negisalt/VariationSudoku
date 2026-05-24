/**
 * Mode Registry
 */
const SudokuModes = {
    vanilla: {
        minHints: 22, maxHints: 45, defaultHints: 35,
        isValid: (core, board, r, c, n) => core.isValid(board, r, c, n),
        onInit: (core) => {},
        onGenerate: (core, board) => {}
    },
    diagonal: {
        minHints: 20, maxHints: 40, defaultHints: 30,
        isValid: (core, board, r, c, n) => {
            if (!core.isValid(board, r, c, n)) return false;
            if (r === c) { for (let i = 0; i < 9; i++) if (board[i][i] === n && i !== r) return false; }
            if (r + c === 8) { for (let i = 0; i < 9; i++) if (board[i][8 - i] === n && i !== r) return false; }
            return true;
        },
        onInit: (core) => {},
        onGenerate: (core, board) => {}
    },
    extra: {
        minHints: 18, maxHints: 38, defaultHints: 28,
        isValid: (core, board, r, c, n) => {
            if (!core.isValid(board, r, c, n)) return false;
            const regions = [{r:1,c:1},{r:1,c:5},{r:5,c:1},{r:5,c:5}];
            for (let reg of regions) {
                if (r >= reg.r && r < reg.r + 3 && c >= reg.c && c < reg.c + 3) {
                    for (let i = 0; i < 3; i++) {
                        for (let j = 0; j < 3; j++) {
                            if (board[reg.r+i][reg.c+j] === n && (reg.r+i !== r || reg.c+j !== c)) return false;
                        }
                    }
                }
            }
            return true;
        },
        onInit: (core) => {},
        onGenerate: (core, board) => {}
    },
    inequality: {
        minHints: 0, maxHints: 30, defaultHints: 15,
        isValid: (core, board, r, c, n) => {
            if (!core.isValid(board, r, c, n)) return false;
            for (let ineq of core.inequalities) {
                if (ineq.r === r && ineq.c === c) {
                    let target = board[ineq.tr][ineq.tc];
                    if (target !== 0 && ((ineq.type === "greater" && n <= target) || (ineq.type === "less" && n >= target))) return false;
                }
                if (ineq.tr === r && ineq.tc === c) {
                    let origin = board[ineq.r][ineq.c];
                    if (origin !== 0 && ((ineq.type === "greater" && origin <= n) || (ineq.type === "less" && origin >= n))) return false;
                }
            }
            return true;
        },
        onInit: (core) => { core.inequalities = []; },
        onGenerate: (core, board) => {
            // main.jsから渡される不等号の数を取得 (なければデフォルト40)
            const ineqSlider = document.getElementById("ineq-slider");
            const targetCount = ineqSlider ? parseInt(ineqSlider.value) : 40;

            let candidates = [];
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (c < 8) candidates.push({r, c, tr: r, tc: c+1, dir: "h"});
                    if (r < 8) candidates.push({r, c, tr: r+1, tc: c, dir: "v"});
                }
            }
            candidates.sort(() => Math.random() - 0.5).slice(0, targetCount).forEach(cand => {
                core.inequalities.push({
                    r: cand.r, c: cand.c, tr: cand.tr, tc: cand.tc,
                    type: core.solution[cand.r][cand.c] > core.solution[cand.tr][cand.tc] ? "greater" : "less",
                    direction: cand.dir
                });
            });
        }
    }
};

window.SudokuModes = SudokuModes;
