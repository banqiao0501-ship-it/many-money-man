// 🎮 全域遊戲狀態變數 (Global State)
let players = [];
let selectedColorIndices = {};
let transactionHistory = [];
let transferState = { payer: null, payee: null };
let currentAmountStr = "0";

let currentDrawnCard = null; 
let viewingHandCard = { playerId: null, idx: null, card: null }; 

// 🔮 神秘事件與高利貸狀態
let isMysteryMode = false;
let mysteryX = 0;
let mysteryN = 0;
let isLoanSharkActive = false;
let loanSharkPool = 0;

// 🎲 骰子狀態
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
let isRolling = false;

// 🚀 遊戲啟動核心邏輯
function startGame() {
    const count = parseInt(document.getElementById('player-count').value);
    
    // 檢查顏色是否重複
    const usedColors = new Set();
    for (let i = 0; i < count; i++) {
        if (usedColors.has(selectedColorIndices[i])) return alert("有人選到重複的顏色哦！");
        usedColors.add(selectedColorIndices[i]);
    }

    // 建立初始資金與神秘事件參數
    const initMoney = parseInt(document.getElementById('initial-money').value) || 15000;
    isMysteryMode = document.getElementById('mystery-mode').checked;
    
    if (isMysteryMode) {
        mysteryX = 0;
        let minN = count, maxN = Math.min(count * 3, 20);
        mysteryN = Math.floor(Math.random() * (maxN - minN + 1)) + minN;
    }

    // 正式生成玩家陣列資料
    players = Array.from({ length: count }, (_, i) => ({
        id: i, 
        name: document.getElementById(`p-name-${i}`).value.trim() || `玩家 ${i+1}`, 
        money: initMoney, 
        color: COLORS[selectedColorIndices[i]], 
        inventory: []
    }));

    // 切換畫面並渲染主遊戲板
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    // 呼叫 UI 渲染主畫面 (這個函數稍後會貼上來)
    renderGameBoard();
}
