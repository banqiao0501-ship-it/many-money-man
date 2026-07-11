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
    else if (currentDrawnCard.autoAction === "steal_all_cards") {
        const stealerId = parseInt(document.getElementById('spy-stealer').value);
        const targetId = parseInt(document.getElementById('spy-target').value);

        const stealer = players.find(p => p.id === stealerId);
        const target = players.find(p => p.id === targetId);

        if (!target.inventory) target.inventory = [];
        if (!stealer.inventory) stealer.inventory = [];

        const cardCount = target.inventory.length;

        if (cardCount === 0) {
            alert(`🤷‍♂️ 撲空了！\n\n${target.name} 手上根本沒有任何功能牌！\n${stealer.name} 什麼都沒搶到，白忙一場。`);
        } else {
            stealer.inventory = stealer.inventory.concat(target.inventory);
            target.inventory = [];

            transactionHistory.push({
                payerId: 'system',
                payeeId: 'multi',
                amount: 0,
                desc: `🕵️ 商業間諜 - ${stealer.name} 奪取了 ${target.name} 的 ${cardCount} 張功能牌`
            });

            alert(`🕵️ 奪取成功！\n\n${stealer.name} 成功奪取了 ${target.name} 手上的 ${cardCount} 張牌！`);
        }
    }
    else if (currentDrawnCard.autoAction === "birthday") {
        const birthdayPerson = players.find(p => p.id === targetId);
        const giftAmount = 1000;
        const totalGifts = (players.length - 1) * giftAmount; 

        players.forEach(p => {
            if (p.id !== targetId) {
                p.money -= giftAmount;
                transactionHistory.push({
                    payerId: p.id,
                    payeeId: targetId,
                    amount: giftAmount,
                    desc: `🎁 賀禮 - ${p.name} ➔ ${birthdayPerson.name} : $1,000`
                });
            }
        });

        birthdayPerson.money += totalGifts;
        
        alert(`🎉 生日快樂！已自動從其他 ${players.length - 1} 位玩家帳戶扣除 1,000 元，\n${birthdayPerson.name} 總共收到 ${totalGifts} 元的生日禮金！`);
    }
    else if (currentDrawnCard.autoAction === "financial_crisis") {
        const crisisAmount = 5000;
        
        players.forEach(p => {
            p.money -= crisisAmount;
            transactionHistory.push({
                payerId: p.id,
                payeeId: 'bank',
                amount: crisisAmount,
                desc: `📉 金融風暴 - ${p.name} ➔ 🏦 銀行 : $5,000`
            });
        });

        alert(`💥 金融風暴襲捲！已從所有玩家（共 ${players.length} 位）帳戶各扣除 5,000 元。`);
    }
    else if (currentDrawnCard.autoAction === "asset_liquidation") {
        let currentMaxMoney = -Infinity;
        let currentMinMoney = Infinity;
        players.forEach(p => {
            if (p.money > currentMaxMoney) currentMaxMoney = p.money;
            if (p.money < currentMinMoney) currentMinMoney = p.money;
        });

        if (currentMaxMoney === currentMinMoney) {
            alert("⚖️ 資產清算結果：\n目前所有玩家的現金居然一模一樣多！無須進行轉帳。");
        } else {
            const maxPlayers = players.filter(p => p.money === currentMaxMoney);
            const minPlayers = players.filter(p => p.money === currentMinMoney);
            const totalAmount = 6000; 
            const costPerMaxPlayer = totalAmount / maxPlayers.length;  
            const gainPerMinPlayer = totalAmount / minPlayers.length;  

            maxPlayers.forEach(p => { p.money -= costPerMaxPlayer; });
            minPlayers.forEach(p => { p.money += gainPerMinPlayer; });

            const maxNames = maxPlayers.map(p => p.name).join('、');
            const minNames = minPlayers.map(p => p.name).join('、');
            
            transactionHistory.push({
                payerId: maxPlayers.length === 1 ? maxPlayers[0].id : 'multi',
                payeeId: minPlayers.length === 1 ? minPlayers[0].id : 'multi',
                amount: totalAmount,
                desc: `⚖️ 資產清算 - [首富] ${maxNames} (各出 $${costPerMaxPlayer}) ➔ [最窮] ${minNames} (各得 $${gainPerMinPlayer})`
            });

            let infoMessage = `⚖️ 資產清算成功！（總額 $${totalAmount}）\n\n`;
            infoMessage += `👑 現金最多 (${maxPlayers.length}人平分出資)：\n👉 ${maxNames}（每人各扣除 $${costPerMaxPlayer}）\n\n`;
            infoMessage += `📉 現金最少 (${minPlayers.length}人平分分配)：\n👉 ${minNames}（每人各獲得 $${gainPerMinPlayer}）`;
            alert(infoMessage);
        }
    }
    else if (currentDrawnCard.autoAction === "fair_share") {
        const checkboxes = document.querySelectorAll('input[name="fairSharePlayers"]:checked');
        const id1 = parseInt(checkboxes[0].value);
        const id2 = parseInt(checkboxes[1].value);

        const p1 = players.find(p => p.id === id1);
        const p2 = players.find(p => p.id === id2);

        const totalPool = p1.money + p2.money;
        const splitAmount = totalPool / 2;

        p1.money = splitAmount;
        p2.money = splitAmount;

        transactionHistory.push({
            payerId: 'system',
            payeeId: 'multi',
            amount: totalPool,
            desc: `⚖️ 公平平分 - ${p1.name} 與 ${p2.name} 資產重組，每人各持 $${splitAmount}`
        });

        alert(`⚖️ 公平公正公開！\n\n${p1.name} (原本 $${p1.money + (p1.money - splitAmount)}) 與 ${p2.name} (原本 $${p2.money + (p2.money - splitAmount)})\n兩人總資產 $${totalPool} 已重新強制對半平分！\n\n✨ 現兩每人各有現金：$${splitAmount} 元。`);
    }

    updateLogUI(); 
    renderGameBoard();
    closeCardModal();
}

// 🃏 卡牌後續處理與手牌操作
function assignCardToPlayer(playerId) {
    const player = players.find(p => p.id === playerId);
    player.inventory.push({ ...currentDrawnCard });
    const title = currentDrawnCard.text.match(/【(.*?)】/) ? currentDrawnCard.text.match(/【(.*?)】/)[1] : '功能卡';
    transactionHistory.push({ 
        payerId: playerId, 
        payeeId: playerId, 
        amount: 0, 
        desc: `📥 ${player.name} 收下 [${title}]` 
    });
    updateLogUI(); 
    renderGameBoard(); 
    closeCardModal();
}

function viewPlayerCard(playerId, idx) {
    const player = players.find(p => p.id === playerId);
    viewingHandCard = { playerId: playerId, idx: idx, card: player.inventory[idx] };
    document.getElementById('hc-owner').innerText = player.name + " 的手牌";
    document.getElementById('hc-text').innerHTML = viewingHandCard.card.text.replace(/\n/g, '<br>');
    document.getElementById('hand-card-modal').classList.remove('hidden');
}

function closeHandCardModal() { 
    document.getElementById('hand-card-modal').classList.add('hidden'); 
}

function useHandCard() {
    const { playerId, idx, card } = viewingHandCard;
    const player = players.find(p => p.id === playerId);
    const title = card.text.match(/【(.*?)】/) ? card.text.match(/【(.*?)】/)[1] : '功能卡';
    
    player.inventory.splice(idx, 1);
    
    if (card.value !== 0) { 
        executeCardPayout(playerId, card.value, true, title); 
    } else { 
        transactionHistory.push({ 
            payerId: playerId, 
            payeeId: playerId, 
            amount: 0, 
            desc: `✨ ${player.name} 發動了 [${title}]` 
        }); 
        updateLogUI(); 
        renderGameBoard(); 
    }
    closeHandCardModal();
}

function executeCardPayout(playerId, value, isFromHand = false, cardName = "") {
    const player = players.find(p => p.id === playerId);
    const absValue = Math.abs(value);
    const prefix = isFromHand ? `✨ 發動 [${cardName}]` : `🃏 抽卡事件`;
    
    if (value < 0) {
        player.money -= absValue;
        transactionHistory.push({ 
            payerId: playerId, 
            payeeId: 'bank', 
            amount: absValue, 
            desc: `${prefix} - ${player.name} ➔ 🏦 銀行 : $${absValue.toLocaleString()}` 
        });
    } else {
        player.money += absValue;
        transactionHistory.push({ 
            payerId: 'bank', 
            payeeId: playerId, 
            amount: absValue, 
            desc: `${prefix} - 🏦 銀行 ➔ ${player.name} : $${absValue.toLocaleString()}` 
        });
    }
    updateLogUI(); 
    renderGameBoard();
    if(!isFromHand) closeCardModal(); 
}

function closeCardModal() { 
    document.getElementById('card-modal').classList.add('hidden'); 
}

// 👻 神秘事件系統
function checkMysteryCondition() {
    if (!isMysteryMode) return;
    mysteryX++;
    if (mysteryX >= mysteryN) {
        triggerMysteryEvent();
    }
}

function triggerMysteryEvent() {
    const event = MYSTERY_EVENTS[Math.floor(Math.random() * MYSTERY_EVENTS.length)];
    document.getElementById('mystery-modal-text').innerHTML = event.text.replace(/\n/g, '<br>');
    document.getElementById('mystery-modal').classList.remove('hidden');
    
    if (event.id === 'loan_shark') {
        isLoanSharkActive = true;
        loanSharkPool = 0;
    }

    // 重置計數器與新目標
    mysteryX = 0;
    const count = players.length;
    const minN = count;
    const maxN = Math.min(count * 3, 20);
    mysteryN = Math.floor(Math.random() * (maxN - minN + 1)) + minN;
    
    renderGameBoard();
}

function closeMysteryModal() { 
    document.getElementById('mystery-modal').classList.add('hidden'); 
}

function claimLoanShark() {
    if (!transferState.payee || transferState.payee === 'bank') {
        alert("請先選擇要提領全額的【收款方】玩家！");
        return;
    }
    
    const player = transferState.payee;
    player.money += loanSharkPool;
    
    transactionHistory.push({ 
        payerId: 'pool', 
        payeeId: player.id, 
        amount: loanSharkPool, 
        desc: `🎊 ${player.name} 提領了高利貸專戶全額 : $${loanSharkPool.toLocaleString()}` 
    });
    
    isLoanSharkActive = false;
    loanSharkPool = 0;
    transferState = { payer: null, payee: null };
    
    updateLogUI();
    renderGameBoard();
}

// 🎲 線上骰子系統
function rollDice() {
    if (isRolling) return;
    isRolling = true;

    const dice1El = document.getElementById('dice-1');
    const dice2El = document.getElementById('dice-2');
    const resultText = document.getElementById('dice-result-text');
    
    let rolls = 0;
    const maxRolls = 10; 
    
    dice1El.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;
    dice2El.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;

    const rollInterval = setInterval(() => {
        let tempVal1 = Math.floor(Math.random() * 6);
        let tempVal2 = Math.floor(Math.random() * 6);
        
        dice1El.innerText = DICE_FACES[tempVal1];
        dice2El.innerText = DICE_FACES[tempVal2];
        resultText.innerText = "擲骰中...";
        resultText.className = "text-base font-bold text-gray-400 h-6";
        
        rolls++;

        if (rolls >= maxRolls) {
            clearInterval(rollInterval);
            
            const finalVal1 = Math.floor(Math.random() * 6);
            const finalVal2 = Math.floor(Math.random() * 6);
            
            dice1El.innerText = DICE_FACES[finalVal1];
            dice2El.innerText = DICE_FACES[finalVal2];
            
            dice1El.style.transform = `rotate(0deg)`;
            dice2El.style.transform = `rotate(0deg)`;
            
            const total = (finalVal1 + 1) + (finalVal2 + 1);
            let text = `點數：${total}`;
            
            if (finalVal1 === finalVal2) {
                text += " (雙骰！)";
                resultText.className = "text-base font-bold text-red-500 h-6";
            } else {
                resultText.className = "text-base font-bold text-gray-800 h-6";
            }
            
            resultText.innerText = text;
            isRolling = false;
        }
    }, 60); 
}

// 📜 紀錄與通用工具 (Undo系統)
function updateLogUI() {
    const list = document.getElementById('log-list');
    list.innerHTML = transactionHistory.slice().reverse().map((t, i) => 
        `<div class="bg-gray-50 p-2 rounded border border-gray-100 text-gray-600">${t.desc}</div>`
    ).join('');
}

function toggleLog() { 
    document.getElementById('log-panel').classList.toggle('hidden'); 
}

function undoLastTransaction() {
    if (transactionHistory.length === 0) return alert("沒有可以復原的紀錄了！");
    
    const lastTx = transactionHistory.pop();
    
    if (lastTx.amount === 0 && lastTx.desc.includes("收下")) {
        const p = players.find(x => x.id === lastTx.payerId);
        p.inventory.pop();
    } else if (lastTx.amount > 0) {
        if (lastTx.payerId === 'pool') {
            loanSharkPool += lastTx.amount;
            isLoanSharkActive = true;
            if (lastTx.payeeId !== 'bank' && lastTx.payeeId !== 'pool') {
                players.find(p => p.id === lastTx.payeeId).money -= lastTx.amount;
            }
        } else if (lastTx.payeeId === 'pool') {
            loanSharkPool -= lastTx.amount;
            if (lastTx.payerId !== 'bank' && lastTx.payerId !== 'pool') {
                players.find(p => p.id === lastTx.payerId).money += lastTx.amount;
            }
        } else {
            if (lastTx.payerId !== 'bank') {
                players.find(p => p.id === lastTx.payerId).money += lastTx.amount;
            }
            if (lastTx.payeeId !== 'bank') {
                players.find(p => p.id === lastTx.payeeId).money -= lastTx.amount;
            }
        }
    }
    updateLogUI(); 
    renderGameBoard();
}
