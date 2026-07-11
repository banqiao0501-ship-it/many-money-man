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

// 💰 金流轉帳與核心邏輯
function selectParticipant(target) {
    const part = (target === 'bank') ? 'bank' : players.find(p => p.id === target);
    if (!transferState.payer) { 
        transferState.payer = part; 
    } else if (!transferState.payee) { 
        if (transferState.payer === part) transferState.payer = null; 
        else { transferState.payee = part; openKeyboard(); }
    }
    renderGameBoard();
}

function executeTransaction() {
    const amount = parseInt(currentAmountStr);
    if (amount <= 0) return;
    
    if (transferState.payer !== 'bank') transferState.payer.money -= amount;
    if (transferState.payee !== 'bank') transferState.payee.money += amount;
    
    const pName = transferState.payer === 'bank' ? '🏦 銀行' : transferState.payer.name;
    const pTarget = transferState.payee === 'bank' ? '🏦 銀行' : transferState.payee.name;
    
    transactionHistory.push({ 
        payerId: transferState.payer === 'bank' ? 'bank' : transferState.payer.id, 
        payeeId: transferState.payee === 'bank' ? 'bank' : transferState.payee.id, 
        amount: amount, 
        desc: `💸 轉帳 - ${pName} ➔ ${pTarget} : $${amount.toLocaleString()}` 
    });
    
    checkMysteryCondition(); // 稍後會貼上的神秘事件檢查函數
    updateLogUI();           // 稍後會貼上的日誌更新函數
    closeKeyboard();
}

function handlePassStart() {
    let amount = 3000;
    if (isLoanSharkActive) {
        // 繳交利息
        if (transferState.payee !== 'bank') transferState.payee.money -= amount;
        loanSharkPool += amount;
        transactionHistory.push({ payerId: transferState.payee === 'bank' ? 'bank' : transferState.payee.id, payeeId: 'pool', amount: amount, desc: `🚨 ${transferState.payee === 'bank' ? '銀行' : transferState.payee.name} 繳交高利貸利息 : $3,000` });
    } else {
        // 正常通過起點
        if (transferState.payee !== 'bank') transferState.payee.money += amount;
        transactionHistory.push({ payerId: 'bank', payeeId: transferState.payee === 'bank' ? 'bank' : transferState.payee.id, amount: amount, desc: `🏁 🏦 銀行 ➔ ${transferState.payee === 'bank' ? '銀行' : transferState.payee.name} (通過起點) : $3,000` });
    }
    
    checkMysteryCondition();
    updateLogUI();
    closeKeyboard();
}

// 🃏 抽卡與手牌系統 (核心邏輯)
function executeAutoAction(targetId = null) {
    if (currentDrawnCard.autoAction === "bailout") {
        let bailoutCount = 0;
        
        players.forEach(p => {
            if (p.money < 5000) {
                p.money += 10000;
                transactionHistory.push({ 
                    payerId: 'bank', 
                    payeeId: p.id, 
                    amount: 10000, 
                    desc: `🏥 紓困補助 - 🏦 銀行 ➔ ${p.name} : $10,000` 
                });
                bailoutCount++;
            }
        });

        if (bailoutCount > 0) {
            alert(`✅ 結算完成！已自動為 ${bailoutCount} 位符合資格的玩家發放 10,000 元。`);
        } else {
            alert(`🤷‍♂️ 結算完成！但目前沒有任何玩家的現金低於 5,000 元，無人獲得補助。`);
        }
    }
