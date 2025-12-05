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
    initResetButton();
    
    // Первоначальное обновление UI
    updateUI();
    updatePositionsList();
    updateHistoryList();
    
    // Обновление UI каждую секунду
    setInterval(updateUI, 1000);
    
    // Обновление списка позиций каждые 3 секунды
    setInterval(() => {
        updatePositionsList();
    }, 3000);
    
    // Инициализация уведомления о ликвидации
    initLiquidationNotification();
    
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
            
            // При переключении на портфель или историю обновляем списки
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
            
            // Показываем уведомление об изменении плеча
            showNotification(`Плечо изменено на ${leverage}x`, 'info');
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
            
            // Анимация кнопки
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
        
        // Обновляем линии на графике
        if (window.tradingChart) {
            window.tradingChart.updateOrderLines();
        }
        
        showNotification(`Стоп-лосс установлен на ${value}%`, 'info');
    });
    
    takeProfitInput.addEventListener('change', function() {
        const value = parseInt(this.value) || 10;
        if (value < 1) this.value = 1;
        if (value > 100) this.value = 100;
        
        game.takeProfit = value;
        game.saveToStorage();
        
        // Обновляем линии на графике
        if (window.tradingChart) {
            window.tradingChart.updateOrderLines();
        }
        
        showNotification(`Тейк-профит установлен на ${value}%`, 'info');
    });
    
    orderAmountInput.addEventListener('change', function() {
        const value = parseFloat(this.value) || 100;
        if (value < 1) this.value = 1;
        if (value > game.balance) {
            this.value = game.balance;
            showNotification(`Сумма не может превышать баланс ($${game.balance.toFixed(2)})`, 'error');
        }
    });
    
    orderAmountInput.addEventListener('input', function() {
        // Ограничиваем ввод только цифрами и точкой
        this.value = this.value.replace(/[^0-9.]/g, '');
        
        // Убираем лишние точки
        const dots = (this.value.match(/\./g) || []).length;
        if (dots > 1) {
            this.value = this.value.replace(/\.+$/, "");
        }
    });
}

// Инициализация кнопки сброса
function initResetButton() {
    const resetBtn = document.getElementById('resetGame');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if (confirm('Вы уверены, что хотите сбросить игру?\nВесь прогресс будет потерян!')) {
                resetGame();
            }
        });
    }
}

// Инициализация уведомления о ликвидации
function initLiquidationNotification() {
    window.showLiquidationNotification = function() {
        const notification = document.getElementById('liquidationNotification');
        notification.classList.add('active');
        
        // Показываем дополнительное уведомление
        showNotification('Позиция ликвидирована! Баланс обнулен.', 'error');
        
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
        showNotification('Введите корректную сумму!', 'error');
        return;
    }
    
    if (amount > game.balance) {
        showNotification(`Недостаточно средств! Доступно: $${game.balance.toFixed(2)}`, 'error');
        return;
    }
    
    // Получаем текущую цену перед открытием
    const currentPrice = game.coins[game.currentCoin].price;
    const leverage = game.leverage;
    const totalExposure = amount * leverage;
    
    // Проверка на ликвидность
    if (totalExposure > game.balance * 10) {
        showNotification('Слишком большая позиция для вашего баланса!', 'error');
        return;
    }
    
    // Подтверждение
    if (!confirm(`Открыть ${type} позицию?\nСумма: $${amount}\nПлечо: ${leverage}x\nОбщая экспозиция: $${totalExposure.toFixed(2)}`)) {
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
        
        // Показываем сообщение об успехе
        const coinName = game.currentCoin;
        showNotification(`${type} позиция ${coinName} на $${amount} открыта!`, 'success');
        
        // Воспроизводим звук (если нужно)
        playTradeSound();
    } else {
        showNotification('Ошибка при открытии позиции!', 'error');
    }
}

// Закрытие позиции
function closePosition(positionId) {
    const position = game.positions.find(p => p.id === positionId);
    if (!position) return;
    
    if (!confirm(`Закрыть позицию ${position.coin} ${position.type}?`)) {
        return;
    }
    
    const pnl = game.closePosition(positionId);
    
    // Обновляем UI
    updateUI();
    updatePositionsList();
    updateHistoryList();
    
    // Показываем результат
    const pnlFormatted = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
    showNotification(`Позиция закрыта. P&L: ${pnlFormatted}`, pnl >= 0 ? 'success' : 'error');
    
    // Воспроизводим звук
    playCloseSound();
}

// Обновление всего UI
function updateUI() {
    // Обновляем баланс
    const balanceElement = document.getElementById('balance');
    const pnlElement = document.getElementById('pnl');
    
    if (balanceElement) {
        balanceElement.textContent = `$${game.balance.toFixed(2)}`;
        
        // Добавляем анимацию если баланс изменился
        const currentBalance = parseFloat(game.balance.toFixed(2));
        const lastBalance = parseFloat(balanceElement.dataset.lastBalance || '1000.00');
        
        if (currentBalance !== lastBalance) {
            balanceElement.classList.add('balance-updated');
            setTimeout(() => {
                balanceElement.classList.remove('balance-updated');
            }, 1000);
            balanceElement.dataset.lastBalance = currentBalance;
        }
    }
    
    // Обновляем P&L
    const totalPnl = game.calculateTotalPNL();
    if (pnlElement) {
        pnlElement.textContent = totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`;
        pnlElement.className = totalPnl >= 0 ? 'pnl-amount pnl-positive' : 'pnl-amount pnl-negative';
    }
    
    // Обновляем текущую цену выбранной монеты
    const currentCoin = game.currentCoin;
    if (game.coins[currentCoin]) {
        const coinPrice = game.coins[currentCoin].price;
        
        // Обновляем кнопки выбранной монеты
        document.querySelectorAll('.coin-btn').forEach(btn => {
            if (btn.getAttribute('data-coin') === currentCoin) {
                btn.classList.add('active');
                // Обновляем цену на активной кнопке
                const priceSpan = btn.querySelector('.coin-price');
                if (priceSpan) {
                    const oldPrice = parseFloat(priceSpan.dataset.lastPrice || '0');
                    if (Math.abs(coinPrice - oldPrice) > coinPrice * 0.0001) {
                        priceSpan.textContent = `$${coinPrice.toFixed(8)}`;
                        priceSpan.classList.add('price-update');
                        setTimeout(() => {
                            priceSpan.classList.remove('price-update');
                        }, 500);
                        priceSpan.dataset.lastPrice = coinPrice;
                    }
                }
            } else {
                btn.classList.remove('active');
                // Обновляем цены на неактивных кнопках
                const priceSpan = btn.querySelector('.coin-price');
                if (priceSpan) {
                    const coinName = btn.getAttribute('data-coin');
                    const price = game.coins[coinName]?.price;
                    if (price) {
                        priceSpan.textContent = `$${price.toFixed(8)}`;
                    }
                }
            }
        });
    }
    
    // Обновляем максимальную доступную сумму для ввода
    const orderAmountInput = document.getElementById('orderAmount');
    if (orderAmountInput) {
        const maxAmount = Math.min(game.balance, 1000);
        orderAmountInput.max = maxAmount;
        
        // Если текущее значение больше доступного, уменьшаем его
        if (parseFloat(orderAmountInput.value) > maxAmount) {
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
    
    // Сортируем позиции по времени (новые сверху)
    const sortedPositions = [...game.positions].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedPositions.forEach(position => {
        const coin = game.coins[position.coin];
        if (!coin) return;
        
        const currentPrice = coin.price;
        
        // Расчет текущего P&L
        let currentPnl;
        let pnlPercent;
        
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
        
        // Время открытия
        const openTime = new Date(position.timestamp);
        const timeString = `${openTime.getHours().toString().padStart(2, '0')}:${openTime.getMinutes().toString().padStart(2, '0')}`;
        
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
                    <div><i class="fas fa-sign-in-alt"></i> Вход: $${position.entryPrice.toFixed(8)}</div>
                    <div><i class="fas fa-dollar-sign"></i> Текущая: $${currentPrice.toFixed(8)}</div>
                    <div><i class="fas fa-money-bill-wave"></i> Объем: $${position.amount}</div>
                    <div><i class="fas fa-percentage"></i> Изменение: ${pnlPercentText}</div>
                    <div><i class="fas fa-clock"></i> Открыта: ${timeString}</div>
                    <div><i class="fas fa-exclamation-triangle"></i> До ликв.: ${liquidationDistance.toFixed(2)}%</div>
                </div>
                <button class="btn-close" onclick="closePosition(${position.id})" style="
                    margin-top: 10px;
                    width: 100%;
                    padding: 10px;
                    background: rgba(255, 59, 48, 0.2);
                    color: #ff3b30;
                    border: 1px solid #ff3b30;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255, 59, 48, 0.4)';" 
                   onmouseout="this.style.background='rgba(255, 59, 48, 0.2)';">
                    <i class="fas fa-times-circle"></i> Закрыть позицию
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
    
    // Показываем последние 20 сделок
    game.history.slice(0, 20).forEach(trade => {
        const pnlClass = trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlText = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
        
        let actionText, actionIcon, actionClass;
        
        switch(trade.action) {
            case 'OPEN':
                actionText = 'Открытие';
                actionIcon = 'fa-door-open';
                actionClass = 'info';
                break;
            case 'CLOSE':
                actionText = 'Закрытие';
                actionIcon = 'fa-door-closed';
                actionClass = trade.pnl >= 0 ? 'success' : 'error';
                break;
            case 'LIQUIDATED':
                actionText = 'Ликвидация';
                actionIcon = 'fa-skull-crossbones';
                actionClass = 'error';
                break;
            default:
                actionText = 'Сделка';
                actionIcon = 'fa-exchange-alt';
                actionClass = 'info';
        }
        
        const time = new Date(trade.timestamp);
        const timeString = `${time.getDate().toString().padStart(2, '0')}.${(time.getMonth() + 1).toString().padStart(2, '0')} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        
        html += `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-type">
                        <i class="fas ${actionIcon} ${actionClass === 'success' ? 'type-long' : actionClass === 'error' ? 'type-short' : ''}"></i>
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
                    <div><i class="fas fa-sign-in-alt"></i> Вход: $${trade.entryPrice?.toFixed(8) || '0.00000000'}</div>
                    <div><i class="fas fa-sign-out-alt"></i> Выход: $${trade.exitPrice?.toFixed(8) || '-'}</div>
                    <div><i class="fas fa-money-bill-wave"></i> $${trade.amount}</div>
                    <div><i class="fas fa-expand-arrows-alt"></i> ${trade.leverage}x</div>
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
        const pnlClass = player.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlText = player.pnl >= 0 ? `+$${player.pnl.toFixed(2)}` : `-$${Math.abs(player.pnl).toFixed(2)}`;
        
        // Медальки для первых трех мест
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        
        html += `
            <tr style="${isCurrentPlayer ? 'background: rgba(56, 128, 255, 0.2); font-weight: bold;' : ''}">
                <td>${medal} ${index + 1}</td>
                <td>${player.name} ${isCurrentPlayer ? '<span style="color: #3880ff;">(Вы)</span>' : ''}</td>
                <td>$${player.balance.toFixed(2)}</td>
                <td class="${pnlClass}">${pnlText}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Функция сброса игры
function resetGame() {
    game.resetGame();
    updateUI();
    updatePositionsList();
    updateHistoryList();
    
    // Показываем уведомление
    showNotification('Игра сброшена! Начальный баланс: $1000', 'info');
    
    // Обновляем график
    if (window.tradingChart) {
        window.tradingChart.updateChartData();
    }
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.custom-notification');
    oldNotifications.forEach(n => {
        if (n.parentNode) n.parentNode.removeChild(n);
    });
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(76, 217, 100, 0.95)' : 
                    type === 'error' ? 'rgba(255, 59, 48, 0.95)' : 
                    'rgba(56, 128, 255, 0.95)'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border-left: 4px solid ${type === 'success' ? '#4cd964' : 
                           type === 'error' ? '#ff3b30' : '#3880ff'};
    `;
    
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <i class="fas ${icon}" style="font-size: 20px; margin-top: 2px;"></i>
            <div style="flex: 1;">
                <div style="font-weight: bold; margin-bottom: 5px; font-size: 15px;">
                    ${type === 'success' ? 'Успешно!' : 
                      type === 'error' ? 'Ошибка!' : 'Информация'}
                </div>
                <div style="font-size: 14px; line-height: 1.4;">${message}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 4 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Звуковые эффекты (опционально)
function playTradeSound() {
    // Простой звук через Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Если Audio API не поддерживается, просто игнорируем
    }
}

function playCloseSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
        // Игнорируем ошибки
    }
}

// Добавляем стили для анимаций
(function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .balance-updated {
            animation: pulseBalance 1s ease-in-out;
        }
        
        @keyframes pulseBalance {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .quick-btn-active {
            background: rgba(56, 128, 255, 0.5) !important;
            transform: scale(0.95);
        }
    `;
    document.head.appendChild(style);
})();

// Экспортируем функции для глобального использования
window.closePosition = closePosition;
window.resetGame = resetGame;
window.showNotification = showNotification;
