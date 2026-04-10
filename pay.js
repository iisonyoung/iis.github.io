document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let payTransactions = [];
    let payBalance = 1000.00;
    let investProfit = 12.5; // Mock starting profit
    let currentFilter = 'all'; // 'all', 'income', 'expense'

    function getPayStoreSnapshot() {
        const raw = typeof window.getAppState === 'function' ? window.getAppState('pay') : null;
        return raw && typeof raw === 'object' ? raw : {};
    }

    function applyPaySnapshot(data = {}) {
        payTransactions = Array.isArray(data.transactions) ? data.transactions : [];
        const nextBalance = parseFloat(data.balance);
        payBalance = Number.isFinite(nextBalance) ? nextBalance : 1000.00;
    }

    applyPaySnapshot(getPayStoreSnapshot());

    function getPayBalance() {
        return payBalance;
    }

    function ensureOfficialAccounts() {
        if (!window.imData || !window.imData.friends || !window.imApp) return {};

        let officialPayment = window.imData.friends.find(f => f.id === 'official_pay');
        if (!officialPayment) {
            officialPayment = window.imApp.normalizeFriendData({
                id: 'official_pay',
                type: 'official',
                nickname: 'Payment',
                realName: 'Payment',
                signature: '你的资产小管家',
                avatarUrl: 'https://i.imgur.com/Kz4Y6kE.png',
                messages: []
            });
            window.imData.friends.unshift(officialPayment);
        } else {
            officialPayment.nickname = 'Payment';
            officialPayment.realName = 'Payment';
            officialPayment.type = 'official';
            officialPayment.signature = officialPayment.signature || '你的资产小管家';
            officialPayment.avatarUrl = officialPayment.avatarUrl || 'https://i.imgur.com/Kz4Y6kE.png';
            officialPayment.messages = officialPayment.messages || [];
        }

        let officialLineteam = window.imData.friends.find(f => f.id === 'official_linetteam');
        if (!officialLineteam) {
            officialLineteam = window.imApp.normalizeFriendData({
                id: 'official_linetteam',
                type: 'official',
                nickname: 'Lineteam',
                realName: 'Lineteam',
                signature: 'LINE Team Official',
                avatarUrl: 'https://i.imgur.com/Kz4Y6kE.png',
                messages: []
            });
            window.imData.friends.unshift(officialLineteam);
        } else {
            officialLineteam.nickname = 'Lineteam';
            officialLineteam.realName = 'Lineteam';
            officialLineteam.type = 'official';
            officialLineteam.signature = officialLineteam.signature || 'LINE Team Official';
            officialLineteam.avatarUrl = officialLineteam.avatarUrl || 'https://i.imgur.com/Kz4Y6kE.png';
            officialLineteam.messages = officialLineteam.messages || [];
        }

        if (window.imApp.saveFriends) window.imApp.saveFriends();
        return { officialPayment, officialLineteam };
    }

    window.getPayBalance = getPayBalance;

    // Global API to add transactions
    window.addPayTransaction = function(amount, title, type = 'income') {
        const safeAmount = Number(amount);
        if (!Number.isFinite(safeAmount) || safeAmount <= 0) return false;

        if (type === 'income') {
            payBalance += safeAmount;
        } else {
            payBalance -= safeAmount;
        }

        // --- 同步到 Payment 官方账号聊天列表 ---
        if (window.imData && window.imData.friends && window.imApp) {
            const { officialPayment } = ensureOfficialAccounts();
            if (officialPayment) {
                const now = Date.now();
                const payMsg = {
                    id: 'pay_' + now,
                    role: 'assistant',
                    type: 'pay_transfer',
                    payKind: type === 'income' ? 'char_received' : 'char_to_user_claimed',
                    amount: safeAmount,
                    description: title || '交易凭证',
                    targetName: 'Payment',
                    cardTitle: type === 'income' ? '收款通知' : '支付凭证',
                    payStatus: 'completed',
                    content: `[交易记录] ${title} ¥${safeAmount.toFixed(2)}`,
                    timestamp: now
                };
                officialPayment.messages = officialPayment.messages || [];
                officialPayment.messages.push(payMsg);
                if (window.imApp.saveFriends) window.imApp.saveFriends();
                if (window.imChat && window.imChat.updateChatsView) window.imChat.updateChatsView();
            }
        }
        // ----------------------------------------------------

        const newTx = {
            id: Date.now(),
            title: title || '未知交易',
            amount: type === 'income' ? safeAmount : -safeAmount,
            time: Date.now(),
            icon: type === 'income' ? 'fa-arrow-down' : 'fa-shopping-bag',
            color: type === 'income' ? '#333' : '#666' // Dark grey colors for monochrome theme
        };
        payTransactions.unshift(newTx);
        savePayData();
        renderPayUI();

        if (window.showToast) {
            window.showToast(type === 'income' ? `已到账 ￥${safeAmount.toFixed(2)}` : `已支付 ￥${safeAmount.toFixed(2)}`);
        }

        return true;
    };

    function savePayData() {
        if (typeof window.setAppState === 'function') {
            window.setAppState('pay', {
                transactions: payTransactions,
                balance: payBalance
            });
            return;
        }

        if (window.saveGlobalData) {
            window.saveGlobalData();
        }
    }

    // --- DOM Elements ---
    const payAppBtn = document.getElementById('app-pay-btn'); // 更新为包裹整个图标的父元素 ID
    const payView = document.getElementById('pay-view');
    const payBackBtn = document.getElementById('pay-back-btn');
    
    // Tabs
    const segmentBtns = document.querySelectorAll('.pay-segment-btn');
    const tabs = document.querySelectorAll('.pay-tab');
    const filterBtns = document.querySelectorAll('.pay-filter-btn');
    
    // UI Elements
    const totalAmountEl = document.getElementById('pay-total-amount');
    const billListEl = document.getElementById('pay-bill-list');
    const investAmountEl = document.getElementById('pay-invest-amount');
    const investProfitEl = document.getElementById('pay-invest-profit');
    const marketNewsEl = document.getElementById('pay-market-news');

    // Modals
    const btnScan = document.getElementById('pay-action-scan');
    const scanModal = document.getElementById('pay-scan-modal');
    const scanClose = document.getElementById('pay-scan-close');
    
    const btnCards = document.getElementById('pay-action-cards');
    const cardsSheet = document.getElementById('pay-cards-sheet');

    // --- App Launch/Close ---
    if (payAppBtn && payView) {
        payAppBtn.addEventListener('click', (e) => {
            if (window.isJiggleMode || window.preventAppClick) { e.preventDefault(); e.stopPropagation(); return; }
            e.stopPropagation(); // 防止冒泡导致其他逻辑影响
            if (window.syncUIs) window.syncUIs();
            payView.classList.add('active');
            renderPayUI();
            randomizeMarket();
        });
    }

    if (payBackBtn && payView) {
        payBackBtn.addEventListener('click', () => {
            payView.classList.remove('active');
        });
    }

    // --- Tab Switching ---
    segmentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            segmentBtns.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetTab = document.getElementById(targetId);
            if(targetTab) targetTab.classList.add('active');
        });
    });

    // --- Filter Switching ---
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderPayUI();
        });
    });

    // --- Rendering Logic ---
    function renderPayUI() {
        // Calculate Total
        const total = getPayBalance();
        
        if (totalAmountEl) totalAmountEl.textContent = total.toFixed(2);
        if (investAmountEl) investAmountEl.textContent = (total * 0.4).toFixed(2); // Mock invest portion
        
        if (investProfitEl) {
            investProfitEl.textContent = (investProfit >= 0 ? '+' : '') + investProfit.toFixed(2);
            investProfitEl.className = investProfit >= 0 ? 'pay-positive' : 'pay-negative';
        }

        // Filter Transactions
        let filteredTxs = payTransactions;
        if (currentFilter === 'income') {
            filteredTxs = payTransactions.filter(tx => tx.amount > 0);
        } else if (currentFilter === 'expense') {
            filteredTxs = payTransactions.filter(tx => tx.amount < 0);
        }

        // Render List
        if (billListEl) {
            billListEl.innerHTML = '';
            if (filteredTxs.length === 0) {
                billListEl.innerHTML = '<div class="pay-empty-state">暂无交易记录</div>';
            } else {
                filteredTxs.forEach(tx => {
                    const el = document.createElement('div');
                    el.className = 'pay-bill-item';
                    
                    const date = new Date(tx.time);
                    const timeStr = `${date.getMonth()+1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    
                    const amountStr = (tx.amount > 0 ? '+' : '') + tx.amount.toFixed(2);
                    const amountClass = tx.amount > 0 ? 'pay-positive' : '';

                    el.innerHTML = `
                        <div class="pay-bill-icon">
                            <i class="fas ${tx.icon}"></i>
                        </div>
                        <div class="pay-bill-info">
                            <div class="pay-bill-title">${tx.title}</div>
                            <div class="pay-bill-time">${timeStr}</div>
                        </div>
                        <div class="pay-bill-amount ${amountClass}">${amountStr}</div>
                    `;
                    billListEl.appendChild(el);
                });
            }
        }
    }

    // --- Randomize Market News for Liveliness ---
    function randomizeMarket() {
        const news = [
            "市场行情波动较大，请谨慎投资。",
            "今日科技板块领涨，注意风险控制。",
            "央行发布新政策，货币基金收益率小幅下调。",
            "海外资产表现强劲，可适当关注。",
            "大盘持续震荡，定投也许是好选择。"
        ];
        if (marketNewsEl) {
            marketNewsEl.textContent = news[Math.floor(Math.random() * news.length)];
        }

        // Randomly fluctuate profit slightly
        investProfit += (Math.random() * 10) - 4; // -4 to +6
        if (investProfitEl) {
            investProfitEl.textContent = (investProfit >= 0 ? '+' : '') + investProfit.toFixed(2);
            investProfitEl.className = investProfit >= 0 ? 'pay-positive' : 'pay-negative';
        }
    }

    // --- Modals Logic ---
    if (btnScan && scanModal) {
        btnScan.addEventListener('click', () => {
            scanModal.classList.add('active');
        });
    }

    if (scanClose && scanModal) {
        scanClose.addEventListener('click', () => {
            scanModal.classList.remove('active');
        });
    }

    if (btnCards && cardsSheet) {
        btnCards.addEventListener('click', () => {
            if (window.openView) window.openView(cardsSheet);
            else cardsSheet.classList.add('active');
        });
    }

    if (cardsSheet) {
        cardsSheet.addEventListener('mousedown', (e) => {
            if (e.target === cardsSheet) {
                if (window.closeView) window.closeView(cardsSheet);
                else cardsSheet.classList.remove('active');
            }
        });
    }

    // Initialize mock click for transfer to show liveliness
    const btnTransfer = document.getElementById('pay-action-transfer');
    
    // Official Accounts settings
    const officialAccountsBtn = document.getElementById('official-accounts-btn');
    const officialAccountsSheet = document.getElementById('official-accounts-sheet');

    ensureOfficialAccounts();

    if (officialAccountsBtn && officialAccountsSheet) {
        officialAccountsBtn.addEventListener('click', () => {
            ensureOfficialAccounts();
            if (window.openView) window.openView(officialAccountsSheet);
            else officialAccountsSheet.style.display = 'flex';
        });
    }
    
    if (officialAccountsSheet) {
        officialAccountsSheet.addEventListener('click', (e) => {
            if (e.target === officialAccountsSheet) {
                if (window.closeView) window.closeView(officialAccountsSheet);
                else officialAccountsSheet.style.display = 'none';
            }
        });
    }
    if (btnTransfer) {
        btnTransfer.addEventListener('click', () => {
            if (window.showCustomModal) {
                window.showCustomModal({
                    type: 'prompt',
                    title: '转账给好友',
                    placeholder: '输入转账金额',
                    confirmText: '转账',
                    onConfirm: (val) => {
                        const amount = parseFloat(val);
                        if (!isNaN(amount) && amount > 0) {
                            window.addPayTransaction(amount, '转账给好友', 'expense');
                        } else {
                            if (window.showToast) window.showToast('金额无效');
                        }
                    }
                });
            }
        });
    }
});
