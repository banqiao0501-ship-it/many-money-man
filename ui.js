// 🎨 初始化設定畫面渲染
function renderSetupPlayers() {
    const count = parseInt(document.getElementById('player-count').value);
    const container = document.getElementById('setup-players-list');
    
    let existingNames = [];
    for (let i = 0; i < 8; i++) {
        let input = document.getElementById(`p-name-${i}`);
        if (input) existingNames[i] = input.value;
    }

    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        if (selectedColorIndices[i] === undefined) selectedColorIndices[i] = i % COLORS.length;
        let currentName = existingNames[i] !== undefined ? existingNames[i] : `玩家 ${i+1}`;
        
        let colorBadges = COLORS.map((color, cIdx) => 
            `<button id="color-btn-${i}-${cIdx}" onclick="selectColor(${i}, ${cIdx})" type="button" 
                class="w-6 h-6 rounded-full border-2 transition-all ${selectedColorIndices[i] === cIdx ? 'border-gray-900 scale-110 shadow-sm' : 'border-transparent opacity-60'}" 
                style="background-color: ${color.raw};"></button>`
        ).join('');
        
        container.innerHTML += `
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-3">
                <div class="flex items-center gap-3">
                    <span class="font-bold text-sm text-gray-400">#${i+1}</span>
                    <input type="text" id="p-name-${i}" value="${currentName}" class="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium">
                </div>
                <div class="flex items-center gap-2 pl-7">
                    <span class="text-xs text-gray-400 mr-2">代表色：</span>
                    <div class="flex gap-1.5">${colorBadges}</div>
                </div>
            </div>`;
    }
}

function selectColor(playerIdx, colorIdx) {
    selectedColorIndices[playerIdx] = colorIdx; 
    COLORS.forEach((_, c) => {
        const btn = document.getElementById(`color-btn-${playerIdx}-${c}`);
        if (btn) btn.className = `w-6 h-6 rounded-full border-2 transition-all ${c === colorIdx ? 'border-gray-900 scale-110 shadow-sm' : 'border-transparent opacity-60'}`;
    });
}

// 🎲 渲染主遊戲板 (包含玩家卡片、銀行狀態、高利貸)
function renderGameBoard() {
    const left = document.getElementById('left-players'), right = document.getElementById('right-players');
    left.innerHTML = ''; right.innerHTML = '';
    
    players.forEach((p, idx) => {
        let stateBorder = 'border-transparent';
        if (transferState.payer?.id === p.id) stateBorder = 'border-red-500 ring-2 ring-red-500/20';
        if (transferState.payee?.id === p.id) stateBorder = 'border-emerald-500 ring-2 ring-emerald-500/20';
        
        let inventoryTags = p.inventory.map((c, i) => {
            const title = c.text.match(/【(.*?)】/) ? c.text.match(/【(.*?)】/)[1] : '卡片';
            return `<button onclick="event.stopPropagation(); viewPlayerCard(${p.id}, ${i})" class="text-[11px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-2 py-1 rounded-md shadow-sm truncate max-w-[85px] transition">🎟️ ${title}</button>`;
        }).join('');

        const html = `
            <div onclick="selectParticipant(${p.id})" class="w-full bg-white p-4 rounded-2xl border-2 ${stateBorder} text-left shadow-sm transition-all duration-200 flex flex-col min-h-[7rem] relative overflow-hidden group cursor-pointer">
                <div class="absolute top-0 left-0 w-2 h-full ${p.color.bg}"></div>
                <div class="flex justify-between items-start w-full pl-2 mb-1">
                    <span class="font-bold text-gray-800 text-lg">${p.name}</span>
                    <span class="w-3 h-3 rounded-full mt-1.5" style="background-color:${p.color.raw}"></span>
                </div>
                <div class="text-right w-full font-mono font-bold text-2xl mb-2 ${p.money < 0 ? 'text-red-500 animate-pulse':'text-gray-900'}">${p.money < 0 ? '- ':''}$${Math.abs(p.money).toLocaleString()}</div>
                <div class="pl-2 flex flex-wrap gap-1 w-full mt-auto">${inventoryTags}</div>
            </div>`;
        (idx % 2 === 0) ? left.innerHTML += html : right.innerHTML += html;
    });
    
    // 更新銀行按鈕狀態
    document.getElementById('btn-bank').className = "w-full max-w-[180px] text-white p-4 rounded-xl text-center font-bold tracking-widest transition " + (transferState.payer === 'bank' ? 'bg-red-600 ring-2 ring-red-500/20' : transferState.payee === 'bank' ? 'bg-emerald-600 ring-2 ring-emerald-500/20' : 'bg-gray-800 hover:bg-gray-700');
    
    // 更新提示文字
    const prompt = document.getElementById('prompt-msg');
    if (!transferState.payer) { 
        prompt.innerText = "💡 請點擊【付款方】"; 
        prompt.className = "text-sm font-medium text-red-400"; 
    } else if (!transferState.payee) { 
        prompt.innerText = `💡 誰要接收【${transferState.payer === 'bank' ? '銀行' : transferState.payer.name}】的錢？`; 
        prompt.className = "text-sm font-medium text-emerald-500"; 
    }

    // 更新高利貸 UI
    if (isLoanSharkActive) {
        document.getElementById('loan-shark-ui').classList.remove('hidden');
        document.getElementById('loan-shark-ui').classList.add('flex');
        document.getElementById('loan-shark-amt').innerText = `$${loanSharkPool.toLocaleString()}`;
        
        if (loanSharkPool >= 15000) {
            document.getElementById('btn-claim-loan').classList.remove('hidden');
            document.getElementById('loan-shark-amt').classList.add('text-green-600');
        } else {
            document.getElementById('btn-claim-loan').classList.add('hidden');
            document.getElementById('loan-shark-amt').classList.remove('text-green-600');
        }
    } else {
        document.getElementById('loan-shark-ui').classList.add('hidden');
        document.getElementById('loan-shark-ui').classList.remove('flex');
    }
}

// ⌨️ 數字鍵盤與轉帳介面控制
function openKeyboard() {
    document.getElementById('kb-payer-name').innerText = transferState.payer === 'bank' ? '🏦 銀行' : transferState.payer.name;
    document.getElementById('kb-payee-name').innerText = transferState.payee === 'bank' ? '🏦 銀行' : transferState.payee.name;
    currentAmountStr = "0"; 
    updateKeyboardDisplay();
    
    const btnStart = document.getElementById('btn-pass-start');
    if (isLoanSharkActive) {
        btnStart.innerHTML = "🚨 繳交利息！<br>(-3000)";
        btnStart.className = "bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 rounded-lg text-sm border border-red-200 shadow-sm transition";
    } else {
        btnStart.innerHTML = "🏁 通過起點！<br>(+3000)";
        btnStart.className = "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 rounded-lg text-sm border border-indigo-200 shadow-sm transition";
    }
    document.getElementById('keyboard-modal').classList.remove('hidden');
}

function closeKeyboard() { 
    document.getElementById('keyboard-modal').classList.add('hidden'); 
    transferState = { payer: null, payee: null }; 
    renderGameBoard(); 
}

function updateKeyboardDisplay() { 
    document.getElementById('kb-display').innerText = parseInt(currentAmountStr).toLocaleString(); 
}

function pressNum(num) { 
    if (num === 'C') { 
        currentAmountStr = "0"; 
    } else { 
        if (currentAmountStr === "0") { 
            if (num === '0' || num === '00') return; 
            currentAmountStr = num; 
        } else { 
            currentAmountStr += num; 
        } 
    } 
    updateKeyboardDisplay(); 
}

function addAmount(num) { 
    currentAmountStr = ((parseInt(currentAmountStr) || 0) + num).toString(); 
    updateKeyboardDisplay(); 
}

// 🃏 抽卡與手牌系統 (UI顯示)
function drawCardEvent(type) {
    const deck = MY_CUSTOM_DECKS[type];
    currentDrawnCard = deck[Math.floor(Math.random() * deck.length)];
    
    const modal = document.getElementById('card-modal');
    const mType = document.getElementById('card-modal-type');
    const mText = document.getElementById('card-modal-text');
    const actionZone = document.getElementById('card-action-zone');
    const actionMsg = document.getElementById('card-action-msg');
    const targetContainer = document.getElementById('card-target-players');
    const closeBtn = document.getElementById('confirm-close-btn'); 

    mText.innerHTML = currentDrawnCard.text.replace(/\n/g, '<br>');
    mType.innerText = type;
    
    if (type === "機會") {
        mType.className = "text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 rounded-full inline-block bg-amber-100 text-amber-800 border border-amber-300";
    } else {
        mType.className = "text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 rounded-full inline-block bg-blue-100 text-blue-800 border border-blue-300";
    }

    // 🎯【新增】防呆大腦：判斷這張卡片是否需要玩家進行互動（選人、扣款或觸發特效）
    const isInteractive = currentDrawnCard.keepable || 
                          currentDrawnCard.autoAction || 
                          currentDrawnCard.value !== 0;

    if (closeBtn) {
        if (isInteractive) {
            closeBtn.classList.add('hidden');    // 📥 有互動按鈕 ➔ 隱藏關閉按鈕，防止玩家賴帳不按
        } else {
            closeBtn.classList.remove('hidden'); // 📝 純文字卡片 ➔ 顯示關閉按鈕，看完了可以關掉
        }
    }
    
    if (currentDrawnCard.keepable) {
        actionZone.classList.remove('hidden');
        actionMsg.innerText = "📥 這是一張可保留的功能卡，請選擇保管玩家：";
        targetContainer.innerHTML = players.map(p => `<button onclick="assignCardToPlayer(${p.id})" class="py-2 text-xs font-medium border rounded-lg transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200">交給 ${p.name}</button>`).join('');
    } 
    else if (currentDrawnCard.autoAction === "bailout") {
        actionZone.classList.remove('hidden');
        actionMsg.innerText = "💡 這是一張條件觸發卡片：";
        targetContainer.innerHTML = `<button onclick="executeAutoAction()" class="col-span-2 py-3 text-sm font-bold border rounded-lg transition bg-amber-400 hover:bg-amber-500 text-amber-900 border-amber-500 shadow-sm">⚡ 點擊自動結算</button>`;
    } 
    else if (currentDrawnCard.autoAction === "birthday") {
        actionZone.classList.remove('hidden');
        actionMsg.innerText = "🎂 請選擇哪一位玩家是今天的壽星：";
        targetContainer.innerHTML = players.map(p => `<button onclick="executeAutoAction(${p.id})" class="py-2 text-xs font-medium border rounded-lg transition bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200">🎉 ${p.name} 是壽星</button>`).join('');
    } 
    else if (currentDrawnCard.autoAction === "financial_crisis") {
        actionZone.classList.remove('hidden');
        actionMsg.innerText = "💥 災情慘重：";
        targetContainer.innerHTML = `<button onclick="executeAutoAction()" class="col-span-2 py-3 text-sm font-bold border rounded-lg transition bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-sm">⚡ 點擊執行全體扣款 5,000</button>`;
    }
    else if (currentDrawnCard.autoAction === "asset_liquidation") {
        actionZone.classList.remove('hidden');
        actionMsg.innerText = "⚖️ 調節貧富差距：";
        targetContainer.innerHTML = `<button onclick="executeAutoAction()" class="col-span-2 py-3 text-sm font-bold border rounded-lg transition bg-indigo-900 hover:bg-indigo-800 text-white border-indigo-950 shadow-sm">⚡ 點擊自動清算資產</button>`;
    }
    else if (currentDrawnCard.autoAction === "fair_share") {
        actionZone.classList.remove('hidden');
        actionMsg.innerText = "⚖️ 財富公道伯降臨！請勾選「2位」要平分資產的玩家：";
        
        const playerCheckboxes = players.map(p => `
            <label class="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition">
                <input type="checkbox" name="fairSharePlayers" value="${p.id}" onchange="handleFairShareSelect()" class="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500">
                <span class="text-sm font-medium text-gray-700">👤 ${p.name} ($${p.money.toLocaleString()})</span>
            </label>
        `).join('');

        targetContainer.innerHTML = `
            <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                    ${playerCheckboxes}
                </div>
                
                <button id="btnFairShareSubmit" disabled class="w-full py-3 text-sm font-bold border rounded-lg transition bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed shadow-sm">
                    請先勾選 2 位玩家
                </button>
            </div>
        `;
    }
else if (currentDrawnCard.autoAction === "steal_all_cards") {
        actionZone.classList.remove('hidden');
        actionMsg.innerText = "🕵️ 商業間諜！請指定「發動者」與「奪取目標」：";
        targetContainer.innerHTML = ''; 

        const spyOptions = players.map(p => {
            const cardCount = p.inventory ? p.inventory.length : 0;
            return `<option value="${p.id}">👤 ${p.name} (持有 ${cardCount} 張牌)</option>`;
        }).join('');

        targetContainer.innerHTML = `
            <div class="grid grid-cols-3 gap-3 w-full items-stretch">
                
                <div class="col-span-2 space-y-3">
                    <div>
                        <label class="block text-sm font-bold text-gray-600 mb-1">🕵️ 發動者</label>
                        <select id="spy-stealer" class="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-purple-500 focus:border-purple-500" onchange="checkSpySelect()">
                            <option value="">選擇發動者...</option>
                            ${spyOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-600 mb-1">🎯 奪取目標</label>
                        <select id="spy-target" class="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-purple-500 focus:border-purple-500" onchange="checkSpySelect()">
                            <option value="">選擇目標...</option>
                            ${spyOptions}
                        </select>
                    </div>
                </div>
                
                <div class="col-span-1 flex">
                    <button id="btnSpySubmit" onclick="executeAutoAction()" disabled class="w-full h-full min-h-[90px] flex flex-col items-center justify-center text-center text-sm font-bold border rounded-xl transition bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed shadow-sm p-2 leading-normal">
                        請先<br>選擇<br>玩家
                    </button>
                </div>
            </div>
        `;
    }
    else if (currentDrawnCard.value !== 0) {
        actionZone.classList.remove('hidden');
        actionMsg.innerText = "💡 立即結算事件，請選擇執行玩家：";
        const isFine = currentDrawnCard.value < 0; 
        const absValue = Math.abs(currentDrawnCard.value);
        targetContainer.innerHTML = players.map(p => `<button onclick="executeCardPayout(${p.id}, ${currentDrawnCard.value}, false)" class="py-2 text-xs font-medium border rounded-lg transition ${isFine ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}">${p.name} (${isFine ? '扣款' : '領取'} $${absValue})</button>`).join('');
    }
    else { 
        actionZone.classList.add('hidden'); 
    }            
    
    modal.classList.remove('hidden');
}

function checkSpySelect() {
    const stealerId = document.getElementById('spy-stealer').value;
    const targetId = document.getElementById('spy-target').value;
    const submitBtn = document.getElementById('btnSpySubmit');

    if (stealerId && targetId && stealerId !== targetId) {
        btn.disabled = false;
        btn.className = "w-full h-full min-h-[90px] flex flex-col items-center justify-center text-center text-sm font-bold border rounded-xl transition bg-purple-600 text-white border-purple-700 hover:bg-purple-700 shadow-md p-2 leading-normal";
        btn.innerHTML = "確認<br>奪取";
    } else {
        btn.disabled = true;
        btn.className = "w-full h-full min-h-[90px] flex flex-col items-center justify-center text-center text-sm font-bold border rounded-xl transition bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed shadow-sm p-2 leading-normal";
        
        if (stealerId && targetId && stealerId === targetId) {
            btn.innerHTML = "不能<br>搶自己";
        } else {
            btn.innerHTML = "請先<br>選擇<br>玩家";
        }
    }
}

function handleFairShareSelect() {
    const checkboxes = document.querySelectorAll('input[name="fairSharePlayers"]:checked');
    const submitBtn = document.getElementById('btnFairShareSubmit');
    
    if (checkboxes.length === 2) {
        submitBtn.disabled = false;
        submitBtn.innerText = "⚡ 執行公正平分";
        submitBtn.setAttribute("onclick", "executeAutoAction()");
        submitBtn.className = "w-full py-3 text-sm font-bold border rounded-lg transition bg-teal-600 hover:bg-teal-700 text-white border-teal-700 shadow-sm";
    } else {
        submitBtn.disabled = true;
        submitBtn.removeAttribute("onclick");
        submitBtn.innerText = checkboxes.length > 2 ? "❌ 只能選擇 2 位玩家" : "請先勾選 2 位玩家";
        submitBtn.className = "w-full py-3 text-sm font-bold border rounded-lg transition bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed shadow-sm";
    }
}
