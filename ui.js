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
