// Основная логика интерфейса
document.addEventListener('DOMContentLoaded', function() {
    console.log('Загрузка трейдинг симулятора...');
    
    // Инициализация
    initTabs();
    initCoinSelector();
    initLeverageButtons();
    initTradeButtons();
    initQuickAmounts();
    initModal();
    initInputHandlers();
    
    // Первоначальное обновление
    updateUI();
    updatePositionsList();
    updateHistoryList();
    
    // Обновление UI каждую секунду
    setInterval(updateUI, 1000);
    
    // Обновление списка позиций каждые 2 секунды
    setInterval(() => {
        updatePositionsList();
    }, 2000);
    
    console.log('Трейдинг симулятор загружен!');
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
            
            // Обновляем данные при переключении
            if (tabId === 'portfolio') {
                updatePositionsList();
            } else if (tabId === 'history') {
                updateHistoryList();
            }
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
            
            updateUI();
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
            
            // Устанавливаем плечо
            game.leverage = leverage;
            game.saveToStorage();
            
            alert(`Плечо изменено на ${leverage}x`);
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
            
            // Анимация
            this.classList.add('quick-btn-active');
            setTimeout(() => {
                this.classList.remove('quick-btn-active');
            }, 300);
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
    const orderAmountInput = document.getElementById('orderAmount');
    
    stopLossInput.addEventListener('change', function() {
        const value = parseInt(this.value) || 5;
        if (value < 1) this.value = 1;
        if (value > 50) this.value = 50;
        
        game.stopLoss = value;
        game.saveToStorage();
        
        // Обновляем маркеры на графике
        if (window.tradingChart) {
            setTimeout(() => {
                window.tradingChart.updatePositionMarkers();
            }, 100);
        }
        
        alert(`Стоп-лосс установлен на ${value}%`);
    });
    
    takeProfitInput.addEventListener('change', function() {
        const value = parseInt(this.value) || 10;
        if (value < 1) this.value = 1;
        if (value > 100) this.value = 100;
        
        game.takeProfit = value;
        game.saveToStorage();
        
        // Обновляем маркеры на графике
        if (window.tradingChart) {
            setTimeout(() => {
                window.tradingChart.updatePositionMarkers();
            }, 100);
        }
        
        alert(`Тейк-профит установлен на ${value}%`);
    });
    
    orderAmountInput.addEventListener('change', function() {
        const value = parseFloat(this.value) || 100;
        if (value < 1) this.value = 1;
        if (value > game.balance) {
            this.value = game.balance;
            alert(`Сумма не может превышать баланс ($${game.balance.toFixed(2)})`);
        }
    });
}

// Функция для уведомления о ликвидации
window.showLiquidationNotification = function() {
    const notification = document.getElementById('liquidationNotification');
    if (notification) {
        notification.classList.add('active');
        setTimeout(() => {
            notification.classList.remove('active');
        }, 5000);
    }
};

// Открытие позиции
function openPosition(type) {
    const amountInput = document.getElementById('orderAmount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        alert('Введите корректную сумму!');
        return;
    }
    
    if (amount > game.balance) {
        alert(`Недостаточно средств! Доступно: $${game.balance.toFixed(2)}`);
        return;
    }
    
    const currentPrice = game.coins[game.currentCoin].price;
    const leverage = game.leverage;
    const totalExposure = amount * leverage;
    
    if (totalExposure > game.balance * 10) {
        alert('Слишком большая позиция!');
        return;
    }
    
    const confirmation = `Открыть ${type} позицию?\n\n` +
                        `Монета: ${game.currentCoin}\n` +
                        `Сумма: $${amount}\n` +
                        `Плечо: ${leverage}x\n` +
                        `Экспозиция: $${totalExposure.toFixed(2)}\n` +
                        `Цена: $${currentPrice.toFixed(8)}\n` +
                        `Стоп-лосс: ${game.stopLoss}%\n` +
                        `Тейк-профит: ${game.takeProfit}%`;
    
    if (!confirm(confirmation)) {
        return;
    }
    
    const success = game.openPosition(type, amount);
    
    if (success) {
        // Добавляем маркер на график
        if (window.addTradeMarker) {
            window.addTradeMarker(type, currentPrice);
        }
        
        // Обновляем UI
        updateUI();
        updatePositionsList();
        updateHistoryList();
        
        alert(`${type} позиция открыта!\nСумма: $${amount}\nПлечо: ${leverage}x`);
        
        // Обновляем график
        if (window.tradingChart) {
            setTimeout(() => {
                window.tradingChart.updatePositionMarkers();
            }, 100);
        }
    } else {
        alert('Ошибка при открытии позиции!');
    }
}

// Закрытие позиции
function closePosition(positionId) {
    const position = game.positions.find(p => p.id === positionId);
    if (!position) return;
    
    const currentPrice = game.coins[position.coin].price;
    const leverage = position.leverage;
    const pnl = position.type === 'LONG' 
        ? (currentPrice - position.entryPrice) * position.amount * leverage
        : (position.entryPrice - currentPrice) * position.amount * leverage;
    
    const confirmation = `Закрыть позицию?\n\n` +
                        `Монета: ${position.coin}\n` +
                        `Тип: ${position.type}\n` +
                        `Вход: $${position.entryPrice.toFixed(8)}\n` +
                        `Текущая: $${currentPrice.toFixed(8)}\n` +
                        `P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
    
    if (!confirm(confirmation)) {
        return;
    }
    
    const closedPnl = game.closePosition(positionId);
    
    // Обновляем UI
    updateUI();
    updatePositionsList();
    updateHistoryList();
    
    const pnlFormatted = closedPnl >= 0 ? `+$${closedPnl.toFixed(2)}` : `-$${Math.abs(closedPnl).toFixed(2)}`;
    alert(`Позиция закрыта!\nP&L: ${pnlFormatted}`);
    
    // Обновляем график
    if (window.tradingChart) {
        setTimeout(() => {
            window.tradingChart.updatePositionMarkers();
        }, 100);
    }
}

// Обновление UI
function updateUI() {
    // Обновляем баланс
    const balanceElement = document.getElementById('balance');
    const pnlElement = document.getElementById('pnl');
    
    if (balanceElement) {
        const formattedBalance = game.balance.toFixed(2);
        balanceElement.textContent = `$${formattedBalance}`;
    }
    
    // Обновляем P&L
    const totalPnl = game.calculateTotalPNL();
    if (pnlElement) {
        const pnlText = totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`;
        pnlElement.textContent = pnlText;
        pnlElement.className = totalPnl >= 0 ? 'pnl-amount pnl-positive' : 'pnl-amount pnl-negative';
    }
    
    // Обновляем цены
    updateCoinPrices();
    
    // Обновляем доступную сумму
    updateAvailableAmount();
}

// Обновление цен монет
function updateCoinPrices() {
    Object.keys(game.coins).forEach(coinName => {
        const coin = game.coins[coinName];
        const priceElement = document.getElementById(`price-${coinName.toLowerCase()}`);
        
        if (priceElement) {
            const oldPrice = parseFloat(priceElement.dataset.lastPrice || '0');
            const newPrice = coin.price;
            
            if (Math.abs(newPrice - oldPrice) > 0) {
                priceElement.textContent = `$${newPrice.toFixed(8)}`;
                priceElement.dataset.lastPrice = newPrice;
                
                // Анимация
                priceElement.classList.add('price-update');
                setTimeout(() => {
                    priceElement.classList.remove('price-update');
                }, 500);
            }
        }
    });
}

// Обновление доступной суммы
function updateAvailableAmount() {
    const orderAmountInput = document.getElementById('orderAmount');
    if (orderAmountInput) {
        const maxAmount = Math.min(game.balance, 1000);
        orderAmountInput.max = maxAmount;
        
        const currentValue = parseFloat(orderAmountInput.value) || 100;
        if (currentValue > maxAmount) {
            orderAmountInput.value = maxAmount;
        }
    }
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
        if (!coin) return;
        
        const currentPrice = coin.price;
        
        // Расчет P&L
        let currentPnl, pnlPercent;
        if (position.type === 'LONG') {
            currentPnl = (currentPrice - position.entryPrice) * position.amount * position.leverage;
            pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice * 100);
        } else {
            currentPnl = (position.entryPrice - currentPrice) * position.amount * position.leverage;
            pnlPercent = ((position.entryPrice - currentPrice) / position.entryPrice * 100);
        }
        
        // Расчет до ликвидации
        let liquidationDistance;
        if (position.type === 'LONG') {
            liquidationDistance = ((position.entryPrice - position.liquidationPrice) / position.entryPrice * 100);
        } else {
            liquidationDistance = ((position.liquidationPrice - position.entryPrice) / position.entryPrice * 100);
        }
        
        const pnlClass = currentPnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlText = currentPnl >= 0 ? `+$${currentPnl.toFixed(2)}` : `-$${Math.abs(currentPnl).toFixed(2)}`;
        const pnlPercentText = pnlPercent >= 0 ? `+${pnlPercent.toFixed(2)}%` : `${pnlPercent.toFixed(2)}%`;
        
        // Время
        const time = new Date(position.timestamp);
        const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        
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
                    <div>Изменение: ${pnlPercentText}</div>
                    <div>Открыта: ${timeString}</div>
                    <div>До ликв.: ${liquidationDistance.toFixed(2)}%</div>
                </div>
                <div class="position-actions">
                    <button class="close-position-btn" onclick="closePosition(${position.id})">
                        <i class="fas fa-times-circle"></i> Закрыть сделку
                    </button>
                </div>
            </div>
        `;
    });
    
    positionsList.innerHTML = html;
};

// Обновление истории
window.updateHistoryList = function() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (game.history.length === 0) {
        historyList.innerHTML = '<div class="no-history">История сделок пуста</div>';
        return;
    }
    
    let html = '';
    
    game.history.slice(0, 20).forEach(trade => {
        const pnlClass = trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlText = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
        
        let actionText;
        switch(trade.action) {
            case 'OPEN': actionText = 'Открытие'; break;
            case 'CLOSE': actionText = 'Закрытие'; break;
            case 'STOP_LOSS': actionText = 'Стоп-лосс'; break;
            case 'TAKE_PROFIT': actionText = 'Тейк-профит'; break;
            case 'LIQUIDATED': actionText = 'Ликвидация'; break;
            default: actionText = 'Сделка';
        }
        
        const time = new Date(trade.timestamp);
        const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        
        html += `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-type">
                        ${actionText} 
                        <span class="${trade.type === 'LONG' ? 'type-long' : 'type-short'}">
                            ${trade.type}
                        </span>
                    </div>
                    <div class="history-pnl ${pnlClass}">${pnlText}</div>
                </div>
                <div class="history-details">
                    <div><i class="${game.coins[trade.coin]?.icon || 'fas fa-coins'}"></i> ${trade.coin}</div>
                    <div><i class="fas fa-clock"></i> ${timeString}</div>
                    <div>Вход: $${trade.entryPrice?.toFixed(8) || '0.00000000'}</div>
                    <div>Выход: $${trade.exitPrice?.toFixed(8) || '-'}</div>
                    <div>$${trade.amount}</div>
                    <div>${trade.leverage}x</div>
                </div>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
};

// Обновление рейтинга
function updateRatingTable() {
    const tableBody = document.getElementById('ratingTableBody');
    if (!tableBody) return;
    
    game.players = game.generatePlayers();
    
    let html = '';
    
    game.players.forEach((player, index) => {
        const isCurrentPlayer = player.id === 0;
        const pnlClass = player.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlText = player.pnl >= 0 ? `+$${player.pnl.toFixed(2)}` : `-$${Math.abs(player.pnl).toFixed(2)}`;
        
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        
        html += `
            <tr style="${isCurrentPlayer ? 'background: rgba(56, 128, 255, 0.2); font-weight: bold;' : ''}">
                <td>${medal} ${index + 1}</td>
                <td>${player.name} ${isCurrentPlayer ? '(Вы)' : ''}</td>
                <td>$${player.balance.toFixed(2)}</td>
                <td class="${pnlClass}">${pnlText}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Экспорт функций
window.closePosition = closePosition;
