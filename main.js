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
