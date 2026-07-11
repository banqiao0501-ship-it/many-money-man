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
