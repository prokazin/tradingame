// Основная логика интерфейса
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация
    initTabs();
    initCoinSelector();
    initTimeframeButtons();
    initLeverageButtons();
    initTradeButtons();
    initQuickAmounts();
    initModal();
    initInputHandlers();
    
    // Первоначальное обновление UI
    updateUI();
    
    // Обновление UI каждую секунду
    setInterval(updateUI, 1000);
    
    // Инициализация уведомления о ликвидации
    initLiquidationNotification();
});

// Инициализация вкладок
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Обновляем активные кнопки
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем активную вкладку
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `${tabId}-tab`) {
                    pane.classList.add('active');
                }
            });
        });
    });
}

// Инициализация выбора монеты
function initCoinSelector() {
    const coinButtons = document.querySelectorAll('.coin-btn');
    
    coinButtons.forEach(button => {
        button.addEventListener('click', function() {
            const coin = this.getAttribute('data-coin');
            
            // Обновляем активную кнопку
            coinButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Устанавливаем монету в игре
            game.currentCoin = coin;
            game.saveToStorage();
            
            // Обновляем график
            if (window.tradingChart) {
                window.tradingChart.setCoin(coin);
            }
            
            // Обновляем UI
            updateUI();
        });
    });
}

// Инициализация кнопок таймфрейма
function initTimeframeButtons() {
    const timeframeButtons = document.querySelectorAll('.timeframe-btn');
    
    timeframeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const timeframe = this.getAttribute('data-tf');
            
            // Обновляем активную кнопку
            timeframeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Обновляем график
            if (window.tradingChart) {
                window.tradingChart.setTimeframe(timeframe);
            }
        });
    });
}

// Инициализация кнопок плеча
function initLeverageButtons() {
    const leverageButtons = document.querySelectorAll('.leverage-btn');
    
    leverageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const leverage = parseInt(this.getAttribute('data-leverage'));
            
            // Обновляем активную кнопку
            leverageButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Устанавливаем плечо в игре
            game.leverage = leverage;
            game.saveToStorage();
        });
    });
}

// Инициализация кнопок торговли
function initTradeButtons() {
    const btnLong = document.getElementById('btnLong');
    const btnShort = document.getElementById('btnShort');
    
    btnLong.addEventListener('click', function() {
        openPosition('LONG');
    });
    
    btnShort.addEventListener('click', function() {
        openPosition('SHORT');
    });
}

// Инициализация быстрых сумм
function initQuickAmounts() {
    const quickButtons = document.querySelectorAll('.quick-btn');
    
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            document.getElementById('orderAmount').value = amount;
        });
    });
}

// Инициализация модального окна
function initModal() {
    const modal = document.getElementById('ratingModal');
    const showButton = document.getElementById('showRating');
    const closeButton = document.querySelector('.modal-close');
    
    showButton.addEventListener('click', function() {
        updateRatingTable();
        modal.classList.add('active');
    });
    
    closeButton.addEventListener('click', function() {
        modal.classList.remove('active');
    });
    
    // Закрытие при клике вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Инициализация обработчиков ввода
function initInputHandlers() {
    const stopLossInput = document.getElementById('stopLoss');
    const takeProfitInput = document.getElementById('takeProfit');
    
    stopLossInput.addEventListener('change', function() {
        game.stopLoss = parseInt(this.value) || 5;
        game.saveToStorage();
        
        // Обновляем линии на графике
        if (window.tradingChart) {
            window.tradingChart.updateOrderLines();
        }
    });
    
    takeProfitInput.addEventListener('change', function() {
        game.takeProfit = parseInt(this.value) || 10;
        game.saveToStorage();
        
        // Обновляем линии на графике
        if (window.tradingChart) {
            window.tradingChart.updateOrderLines();
        }
    });
}

// Инициализация уведомления о ликвидации
function initLiquidationNotification() {
    window.showLiquidationNotification = function() {
        const notification = document.getElementById('liquidationNotification');
        notification.classList.add('active');
        
        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            notification.classList.remove('active');
        }, 5000);
    };
}

// Открытие позиции
function openPosition(type) {
    const amountInput = document.getElementById('orderAmount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        alert('Введите корректную сумму!');
        return;
    }
    
    if (amount > game.balance) {
        alert('Недостаточно средств!');
        return;
    }
    
    const success = game.openPosition(type, amount);
    
    if (success) {
        // Обновляем UI
        updateUI();
        updatePositionsList();
        updateHistoryList();
        
        // Показываем сообщение об успехе
        alert(`Позиция ${type} на $${amount} открыта!`);
    }
}

// Закрытие позиции
function closePosition(positionId) {
    const pnl = game.closePosition(positionId);
    
    // Обновляем UI
    updateUI();
    updatePositionsList();
    updateHistoryList();
    
    // Показываем результат
    const pnlFormatted = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
    alert(`Позиция закрыта. P&L: ${pnlFormatted}`);
}

// Обновление всего UI
function updateUI() {
    // Обновляем баланс
    const balanceElement = document.getElementById('balance');
    const pnlElement = document.getElementById('pnl');
    
    if (balanceElement) {
        balanceElement.textContent = `$${game.balance.toFixed(2)}`;
    }
    
    // Обновляем P&L
    const totalPnl = game.calculateTotalPNL();
    if (pnlElement) {
        pnlElement.textContent = totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`;
        pnlElement.className = totalPnl >= 0 ? 'pnl-amount pnl-positive' : 'pnl-amount pnl-negative';
    }
    
    // Обновляем текущую цену выбранной монеты
    const currentCoin = game.currentCoin;
    const coinPrice = game.coins[currentCoin].price;
    
    // Обновляем кнопки выбранной монеты
    document.querySelectorAll('.coin-btn').forEach(btn => {
        if (btn.getAttribute('data-coin') === currentCoin) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Обновление списка позиций
window.updatePositionsList = function() {
    const positionsList = document.getElementById('positionsList');
    if (!positionsList) return;
    
    if (game.positions.length === 0) {
        positionsList.innerHTML = '<div class="no-positions">У вас нет открытых позиций</div>';
        return;
    }
    
    let html = '';
    
    game.positions.forEach(position => {
        const coin = game.coins[position.coin];
        const currentPrice = coin.price;
        
        // Расчет текущего P&L
        let currentPnl;
        if (position.type === 'LONG') {
            currentPnl = (currentPrice - position.entryPrice) * position.amount * position.leverage;
        } else {
            currentPnl = (position.entryPrice - currentPrice) * position.amount * position.leverage;
        }
        
        // Расчет процента изменения
        const pnlPercent = position.type === 'LONG' 
            ? ((currentPrice - position.entryPrice) / position.entryPrice * 100)
            : ((position.entryPrice - currentPrice) / position.entryPrice * 100);
        
        const pnlClass = currentPnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlText = currentPnl >= 0 ? `+$${currentPnl.toFixed(2)}` : `-$${Math.abs(currentPnl).toFixed(2)}`;
        
        html += `
            <div class="position-item ${position.type === 'LONG' ? 'position-long' : 'position-short'}">
                <div class="position-header">
                    <div class="position-coin">
                        <i class="${coin.icon}"></i> ${position.coin}
                        <span class="position-type ${position.type === 'LONG' ? 'type-long' : 'type-short'}">
                            ${position.type} ${position.leverage}x
                        </span>
                    </div>
                    <div class="position-pnl ${pnlClass}">${pnlText}</div>
                </div>
                <div class="position-details">
                    <div>Вход: $${position.entryPrice.toFixed(8)}</div>
                    <div>Текущая: $${currentPrice.toFixed(8)}</div>
                    <div>Объем: $${position.amount}</div>
                    <div>Изменение: ${pnlPercent.toFixed(2)}%</div>
                </div>
                <button class="btn-close" onclick="closePosition(${position.id})" style="
                    margin-top: 10px;
                    width: 100%;
                    padding: 8px;
                    background: rgba(255, 59, 48, 0.2);
                    color: #ff3b30;
                    border: 1px solid #ff3b30;
                    border-radius: 6px;
                    cursor: pointer;
                ">
                    Закрыть позицию
                </button>
            </div>
        `;
    });
    
    positionsList.innerHTML = html;
};

// Обновление списка истории
window.updateHistoryList = function() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (game.history.length === 0) {
        historyList.innerHTML = '<div class="no-history">История сделок пуста</div>';
        return;
    }
    
    let html = '';
    
    game.history.slice(0, 20).forEach(trade => { // Показываем последние 20 сделок
        const pnlClass = trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlText = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
        const actionText = trade.action === 'OPEN' ? 'Открытие' : 
                          trade.action === 'CLOSE' ? 'Закрытие' : 'Ликвидация';
        
        html += `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-type">
                        ${actionText} <span class="${trade.type === 'LONG' ? 'type-long' : 'type-short'}">${trade.type}</span>
                    </div>
                    <div class="history-pnl ${pnlClass}">${pnlText}</div>
                </div>
                <div class="history-details">
                    <div><i class="${game.coins[trade.coin]?.icon || 'fas fa-coins'}"></i> ${trade.coin}</div>
                    <div>${new Date(trade.timestamp).toLocaleTimeString()}</div>
                    <div>Вход: $${trade.entryPrice?.toFixed(8) || '0'}</div>
                    <div>Выход: $${trade.exitPrice?.toFixed(8) || '-'}</div>
                    <div>Объем: $${trade.amount}</div>
                    <div>Плечо: ${trade.leverage}x</div>
                </div>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
};

// Обновление таблицы рейтинга
function updateRatingTable() {
    const tableBody = document.getElementById('ratingTableBody');
    if (!tableBody) return;
    
    // Обновляем данные игроков
    game.players = game.generatePlayers();
    
    let html = '';
    
    game.players.forEach((player, index) => {
        const isCurrentPlayer = player.id === 0;
        const rowClass = isCurrentPlayer ? 'current-player' : '';
        const pnlClass = player.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlText = player.pnl >= 0 ? `+$${player.pnl.toFixed(2)}` : `-$${Math.abs(player.pnl).toFixed(2)}`;
        
        html += `
            <tr class="${rowClass}" style="${isCurrentPlayer ? 'background: rgba(56, 128, 255, 0.2); font-weight: bold;' : ''}">
                <td>${index + 1}</td>
                <td>${player.name} ${isCurrentPlayer ? '(Вы)' : ''}</td>
                <td>$${player.balance.toFixed(2)}</td>
                <td class="${pnlClass}">${pnlText}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Функция сброса игры (для разработки)
function resetGame() {
    if (confirm('Вы уверены, что хотите сбросить игру? Весь прогресс будет потерян!')) {
        game.resetGame();
        updateUI();
        updatePositionsList();
        updateHistoryList();
        alert('Игра сброшена! Начальный баланс: $1000');
    }
}

// Добавляем кнопку сброса в консоль для разработки
console.log('Для сброса игры используйте resetGame()');
