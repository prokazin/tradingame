// Основная логика интерфейса
document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация трейдинг симулятора...');
    
    // Инициализация всех компонентов
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
    updatePositionsList();
    updateHistoryList();
    
    // Обновление UI каждую секунду
    setInterval(updateUI, 1000);
    
    // Обновление списка позиций каждые 2 секунды
    setInterval(() => {
        updatePositionsList();
    }, 2000);
    
    // Инициализация уведомления о ликвидации
    initLiquidationNotification();
    
    // Инициализация уведомлений о событиях
    initEventNotifications();
    
    // Запускаем отслеживание времени событий
    startEventTimer();
    
    console.log('Трейдинг симулятор успешно загружен! Событийная система активна.');
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
            
            // Показываем уведомление о смене монеты
            showNotification(`Выбрана монета: ${coin}`, 'info');
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
            
            // Показываем уведомление
            showNotification(`Таймфрейм изменен на ${timeframe}`, 'info');
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
            showNotification(`Плечо изменено на ${leverage}x. Риски увеличены!`, 'warning');
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
            
            // Показываем уведомление
            showNotification(`Сумма установлена: $${amount}`, 'info');
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

// Инициализация уведомления о ликвидации
function initLiquidationNotification() {
    window.showLiquidationNotification = function() {
        const notification = document.getElementById('liquidationNotification');
        notification.classList.add('active');
        
        // Показываем дополнительное уведомление
        showNotification('⚠️ Позиция ликвидирована! Баланс обнулен.', 'error');
        
        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            notification.classList.remove('active');
        }, 5000);
        
        // Воспроизводим звук ликвидации
        playLiquidationSound();
    };
}

// Инициализация уведомлений о событиях
function initEventNotifications() {
    window.showEventNotification = function(event) {
        const isPositive = event.type === 'POSITIVE';
        const icon = isPositive ? '📈' : '📉';
        const title = isPositive ? 'Рост рынка!' : 'Падение рынка!';
        const color = isPositive ? '#4cd964' : '#ff3b30';
        const impactPercent = (event.impact * 100).toFixed(2);
        
        // Создаем уведомление о событии
        const notification = document.createElement('div');
        notification.className = 'event-notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            max-width: 320px;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border-left: 4px solid ${color};
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="font-size: 28px;">${icon}</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px; color: ${color}">
                        ${title}
                    </div>
                    <div style="font-size: 14px; line-height: 1.4; margin-bottom: 8px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px;">
                        ${event.message}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; opacity: 0.9;">
                        <span><i class="fas fa-coins"></i> ${event.coin}</span>
                        <span><i class="fas fa-chart-line"></i> ${impactPercent}%</span>
                        <span><i class="fas fa-clock"></i> ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое скрытие через 10 секунд
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 10000);
        
        // Воспроизводим звук события
        playEventSound(isPositive);
    };
}

// Запуск таймера событий
function startEventTimer() {
    let nextEventTime = 90; // Первое событие через 90 секунд
    const eventTimerElement = document.createElement('div');
    eventTimerElement.id = 'eventTimer';
    eventTimerElement.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 999;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(5px);
    `;
    
    eventTimerElement.innerHTML = `
        <i class="fas fa-clock"></i>
        <span>След. событие: <span id="nextEventTime">${nextEventTime}</span>с</span>
    `;
    
    document.body.appendChild(eventTimerElement);
    
    // Обновляем таймер каждую секунду
    setInterval(() => {
        if (nextEventTime > 0) {
            nextEventTime--;
            document.getElementById('nextEventTime').textContent = nextEventTime;
            
            // Мигание в последние 10 секунд
            if (nextEventTime <= 10) {
                eventTimerElement.style.animation = nextEventTime % 2 === 0 ? 'pulse 0.5s' : 'none';
            }
        } else {
            nextEventTime = 90; // Сбрасываем таймер
        }
    }, 1000);
}

// Открытие позиции
function openPosition(type) {
    const amountInput = document.getElementById('orderAmount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        showNotification('❌ Введите корректную сумму!', 'error');
        return;
    }
    
    if (amount > game.balance) {
        showNotification(`❌ Недостаточно средств! Доступно: $${game.balance.toFixed(2)}`, 'error');
        return;
    }
    
    // Получаем текущую цену перед открытием
    const currentPrice = game.coins[game.currentCoin].price;
    const leverage = game.leverage;
    const totalExposure = amount * leverage;
    
    // Проверка на ликвидность
    if (totalExposure > game.balance * 10) {
        showNotification('❌ Слишком большая позиция для вашего баланса!', 'error');
        return;
    }
    
    // Подтверждение
    const confirmationMessage = `Открыть ${type} позицию?\n\n` +
                               `Монета: ${game.currentCoin}\n` +
                               `Сумма: $${amount}\n` +
                               `Плечо: ${leverage}x\n` +
                               `Экспозиция: $${totalExposure.toFixed(2)}\n` +
                               `Текущая цена: $${currentPrice.toFixed(8)}`;
    
    if (!confirm(confirmationMessage)) {
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
        const impactText = type === 'LONG' ? 'увеличилась' : 'уменьшилась';
        const impactIcon = type === 'LONG' ? '📈' : '📉';
        
        showNotification(`${impactIcon} ${type} позиция ${coinName} открыта!\n` +
                        `Сумма: $${amount} | Плечо: ${leverage}x\n` +
                        `Цена ${impactText} из-за вашей сделки`, 'success');
        
        // Воспроизводим звук
        playTradeSound();
        
        // Обновляем график
        if (window.tradingChart) {
            setTimeout(() => {
                window.tradingChart.updateChartData();
                window.tradingChart.updateOrderLines();
            }, 100);
        }
    } else {
        showNotification('❌ Ошибка при открытии позиции!', 'error');
    }
}

// Закрытие позиции
function closePosition(positionId) {
    const position = game.positions.find(p => p.id === positionId);
    if (!position) return;
    
    const currentPrice = game.coins[position.coin].price;
    const pnl = (position.type === 'LONG') 
        ? (currentPrice - position.entryPrice) * position.amount * position.leverage
        : (position.entryPrice - currentPrice) * position.amount * position.leverage;
    
    const confirmationMessage = `Закрыть позицию?\n\n` +
                               `Монета: ${position.coin}\n` +
                               `Тип: ${position.type}\n` +
                               `Вход: $${position.entryPrice.toFixed(8)}\n` +
                               `Текущая: $${currentPrice.toFixed(8)}\n` +
                               `P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
    
    if (!confirm(confirmationMessage)) {
        return;
    }
    
    const closedPnl = game.closePosition(positionId);
    
    // Обновляем UI
    updateUI();
    updatePositionsList();
    updateHistoryList();
    
    // Показываем результат
    const pnlFormatted = closedPnl >= 0 ? `+$${closedPnl.toFixed(2)}` : `-$${Math.abs(closedPnl).toFixed(2)}`;
    const pnlPercent = ((closedPnl / (position.amount * position.leverage)) * 100).toFixed(2);
    
    showNotification(`💰 Позиция закрыта!\n` +
                    `P&L: ${pnlFormatted} (${pnlPercent}%)\n` +
                    `Монета: ${position.coin} ${position.type}`, 
                    closedPnl >= 0 ? 'success' : 'error');
    
    // Воспроизводим звук
    playCloseSound();
    
    // Обновляем график
    if (window.tradingChart) {
        setTimeout(() => {
            window.tradingChart.updateChartData();
        }, 100);
    }
}

// Обновление всего UI
function updateUI() {
    // Обновляем баланс
    const balanceElement = document.getElementById('balance');
    const pnlElement = document.getElementById('pnl');
    
    if (balanceElement) {
        const formattedBalance = game.balance.toFixed(2);
        balanceElement.textContent = `$${formattedBalance}`;
        
        // Добавляем анимацию если баланс изменился
        const currentBalance = parseFloat(formattedBalance);
        const lastBalance = parseFloat(balanceElement.dataset.lastBalance || '1000.00');
        
        if (Math.abs(currentBalance - lastBalance) > 0.01) {
            balanceElement.classList.add('balance-updated');
            setTimeout(() => {
                balanceElement.classList.remove('balance-updated');
            }, 1000);
            balanceElement.dataset.lastBalance = currentBalance;
            
            // Определяем тип изменения
            const changeType = currentBalance > lastBalance ? 'increase' : 'decrease';
            balanceElement.dataset.change = changeType;
        }
    }
    
    // Обновляем P&L
    const totalPnl = game.calculateTotalPNL();
    if (pnlElement) {
        const pnlText = totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`;
        pnlElement.textContent = pnlText;
        pnlElement.className = totalPnl >= 0 ? 'pnl-amount pnl-positive' : 'pnl-amount pnl-negative';
        
        // Анимация изменения P&L
        const lastPnl = parseFloat(pnlElement.dataset.lastPnl || '0');
        if (Math.abs(totalPnl - lastPnl) > 0.01) {
            pnlElement.classList.add('pnl-updated');
            setTimeout(() => {
                pnlElement.classList.remove('pnl-updated');
            }, 500);
            pnlElement.dataset.lastPnl = totalPnl;
        }
    }
    
    // Обновляем цены монет
    updateCoinPrices();
    
    // Обновляем доступную сумму для торговли
    updateAvailableAmount();
    
    // Обновляем индикатор тренда
    updateTrendIndicator();
}

// Обновление цен монет
function updateCoinPrices() {
    const currentCoin = game.currentCoin;
    
    Object.keys(game.coins).forEach(coinName => {
        const coin = game.coins[coinName];
        const coinPrice = coin.price;
        
        // Находим элемент цены для этой монеты
        const priceElement = document.getElementById(`price-${coinName.toLowerCase()}`);
        if (priceElement) {
            const oldPrice = parseFloat(priceElement.dataset.lastPrice || '0');
            
            // Обновляем только если цена изменилась
            if (Math.abs(coinPrice - oldPrice) > coinPrice * 0.000001) {
                priceElement.textContent = `$${coinPrice.toFixed(8)}`;
                priceElement.dataset.lastPrice = coinPrice;
                
                // Анимация изменения цены
                const changeType = coinPrice > oldPrice ? 'up' : 'down';
                priceElement.dataset.change = changeType;
                priceElement.classList.add('price-update');
                
                setTimeout(() => {
                    priceElement.classList.remove('price-update');
                }, 500);
                
                // Если это выбранная монета, обновляем график
                if (coinName === currentCoin && window.tradingChart) {
                    window.tradingChart.addNewCandle();
                }
            }
        }
        
        // Обновляем визуальное отображение тренда на кнопках
        const coinButton = document.querySelector(`.coin-btn[data-coin="${coinName}"]`);
        if (coinButton) {
            // Очищаем предыдущие классы тренда
            coinButton.classList.remove('trend-up', 'trend-down');
            
            // Добавляем новый класс тренда
            if (coin.trend > 0.05) {
                coinButton.classList.add('trend-up');
            } else if (coin.trend < -0.05) {
                coinButton.classList.add('trend-down');
            }
            
            // Устанавливаем активную кнопку
            if (coinName === currentCoin) {
                coinButton.classList.add('active');
            } else {
                coinButton.classList.remove('active');
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
        
        // Обновляем подсказку
        const amountHint = orderAmountInput.parentElement.querySelector('.amount-hint');
        if (!amountHint) {
            const hint = document.createElement('div');
            hint.className = 'amount-hint';
            hint.style.cssText = 'font-size: 12px; opacity: 0.7; margin-top: 5px;';
            hint.textContent = `Макс: $${maxAmount.toFixed(2)}`;
            orderAmountInput.parentElement.appendChild(hint);
        } else {
            amountHint.textContent = `Макс: $${maxAmount.toFixed(2)}`;
        }
        
        // Если текущее значение больше доступного, уменьшаем его
        const currentValue = parseFloat(orderAmountInput.value) || 100;
        if (currentValue > maxAmount) {
            orderAmountInput.value = maxAmount;
            showNotification(`Сумма уменьшена до $${maxAmount.toFixed(2)} (максимум)`, 'warning');
        }
    }
}

// Обновление индикатора тренда
function updateTrendIndicator() {
    const currentCoin = game.currentCoin;
    const coin = game.coins[currentCoin];
    
    if (!coin) return;
    
    // Создаем или обновляем индикатор тренда
    let trendIndicator = document.getElementById('trendIndicator');
    if (!trendIndicator) {
        trendIndicator = document.createElement('div');
        trendIndicator.id = 'trendIndicator';
        trendIndicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.5);
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 5px;
            z-index: 10;
        `;
        document.querySelector('.chart-container').appendChild(trendIndicator);
    }
    
    let trendText = 'Нейтрально';
    let trendColor = '#888';
    let trendIcon = '➖';
    
    if (coin.trend > 0.1) {
        trendText = `Сильный рост ${(coin.trend * 100).toFixed(1)}%`;
        trendColor = '#4cd964';
        trendIcon = '📈';
    } else if (coin.trend > 0.05) {
        trendText = `Рост ${(coin.trend * 100).toFixed(1)}%`;
        trendColor = '#4cd964';
        trendIcon = '📈';
    } else if (coin.trend > 0.01) {
        trendText = `Слабый рост ${(coin.trend * 100).toFixed(1)}%`;
        trendColor = '#4cd964';
        trendIcon = '↗️';
    } else if (coin.trend < -0.1) {
        trendText = `Сильное падение ${(coin.trend * 100).toFixed(1)}%`;
        trendColor = '#ff3b30';
        trendIcon = '📉';
    } else if (coin.trend < -0.05) {
        trendText = `Падение ${(coin.trend * 100).toFixed(1)}%`;
        trendColor = '#ff3b30';
        trendIcon = '📉';
    } else if (coin.trend < -0.01) {
        trendText = `Слабое падение ${(coin.trend * 100).toFixed(1)}%`;
        trendColor = '#ff3b30';
        trendIcon = '↘️';
    }
    
    trendIndicator.innerHTML = `
        <span style="color: ${trendColor}">${trendIcon}</span>
        <span style="color: ${trendColor}">${trendText}</span>
    `;
    trendIndicator.style.border = `1px solid ${trendColor}`;
}

// Обновление списка позиций
window.updatePositionsList = function() {
    const positionsList = document.getElementById('positionsList');
    if (!positionsList) return;
    
    if (game.positions.length === 0) {
        positionsList.innerHTML = `
            <div class="no-positions">
                <i class="fas fa-wallet" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                <div style="font-size: 16px; margin-bottom: 10px;">Нет открытых позиций</div>
                <div style="font-size: 14px; opacity: 0.6;">Откройте позицию на вкладке "Торговля"</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Сортируем позиции по времени (новые сверху)
    const sortedPositions = [...game.positions].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedPositions.forEach((position, index) => {
        const coin = game.coins[position.coin];
        if (!coin) return;
        
        const currentPrice = coin.price;
        
        // Расчет текущего P&L
        let currentPnl, pnlPercent, pnlPerUnit;
        
        if (position.type === 'LONG') {
            currentPnl = (currentPrice - position.entryPrice) * position.amount * position.leverage;
            pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice * 100);
            pnlPerUnit = currentPrice - position.entryPrice;
        } else {
            currentPnl = (position.entryPrice - currentPrice) * position.amount * position.leverage;
            pnlPercent = ((position.entryPrice - currentPrice) / position.entryPrice * 100);
            pnlPerUnit = position.entryPrice - currentPrice;
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
        const pnlPerUnitText = pnlPerUnit >= 0 ? `+$${pnlPerUnit.toFixed(8)}` : `-$${Math.abs(pnlPerUnit).toFixed(8)}`;
        
        // Время открытия
        const openTime = new Date(position.timestamp);
        const timeString = `${openTime.getHours().toString().padStart(2, '0')}:${openTime.getMinutes().toString().padStart(2, '0')}`;
        
        // Определяем состояние позиции
        let positionStatus = 'normal';
        let statusText = 'Активна';
        let statusColor = '#888';
        
        if (liquidationDistance < 5) {
            positionStatus = 'danger';
            statusText = 'Риск ликвидации!';
            statusColor = '#ff3b30';
        } else if (Math.abs(pnlPercent) > 8) {
            positionStatus = 'warning';
            statusText = 'Высокая волатильность';
            statusColor = '#ff9500';
        } else if (pnlPercent > 5) {
            positionStatus = 'success';
            statusText = 'В плюсе';
            statusColor = '#4cd964';
        }
        
        html += `
            <div class="position-item ${position.type === 'LONG' ? 'position-long' : 'position-short'}">
                <div class="position-header">
                    <div class="position-coin">
                        <i class="${coin.icon}" style="color: ${coin.color};"></i> 
                        <strong>${position.coin}</strong>
                        <span class="position-type ${position.type === 'LONG' ? 'type-long' : 'type-short'}">
                            ${position.type} ${position.leverage}x
                        </span>
                        <span class="position-status" style="
                            font-size: 11px;
                            padding: 2px 8px;
                            border-radius: 10px;
                            background: ${statusColor}20;
                            color: ${statusColor};
                            border: 1px solid ${statusColor}40;
                        ">
                            ${statusText}
                        </span>
                    </div>
                    <div class="position-pnl ${pnlClass}">${pnlText}</div>
                </div>
                <div class="position-details">
                    <div><i class="fas fa-sign-in-alt"></i> <span class="detail-label">Вход:</span> $${position.entryPrice.toFixed(8)}</div>
                    <div><i class="fas fa-dollar-sign"></i> <span class="detail-label">Текущая:</span> $${currentPrice.toFixed(8)}</div>
                    <div><i class="fas fa-chart-line"></i> <span class="detail-label">Изменение:</span> ${pnlPercentText}</div>
                    <div><i class="fas fa-money-bill-wave"></i> <span class="detail-label">Объем:</span> $${position.amount}</div>
                    <div><i class="fas fa-coins"></i> <span class="detail-label">За единицу:</span> ${pnlPerUnitText}</div>
                    <div><i class="fas fa-clock"></i> <span class="detail-label">Открыта:</span> ${timeString}</div>
                    <div><i class="fas fa-exclamation-triangle"></i> <span class="detail-label">До ликв.:</span> ${liquidationDistance.toFixed(2)}%</div>
                </div>
                <button class="btn-close" onclick="closePosition(${position.id})" style="
                    margin-top: 12px;
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, rgba(255, 59, 48, 0.2), rgba(255, 149, 0, 0.2));
                    color: #ff3b30;
                    border: 1px solid #ff3b30;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(255, 59, 48, 0.3)';" 
                   onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
                    <i class="fas fa-times-circle"></i> Закрыть позицию
                </button>
            </div>
        `;
    });
    
    positionsList.innerHTML = html;
    
    // Добавляем заголовок с количеством позиций
    const positionsHeader = positionsList.previousElementSibling;
    if (positionsHeader && positionsHeader.tagName === 'H3') {
        positionsHeader.innerHTML = `<i class="fas fa-wallet"></i> Ваши позиции <span style="font-size: 14px; opacity: 0.7;">(${game.positions.length})</span>`;
    }
};

// Обновление списка истории
window.updateHistoryList = function() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (game.history.length === 0) {
        historyList.innerHTML = `
            <div class="no-history">
                <i class="fas fa-history" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                <div style="font-size: 16px; margin-bottom: 10px;">История сделок пуста</div>
                <div style="font-size: 14px; opacity: 0.6;">Здесь будут отображаться ваши сделки</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Показываем последние 20 сделок
    game.history.slice(0, 20).forEach((trade, index) => {
        const pnlClass = trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
        const pnlText = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
        const pnlPercent = trade.entryPrice ? ((trade.pnl / (trade.amount * trade.leverage)) * 100).toFixed(2) : '0.00';
        
        let actionText, actionIcon, actionColor, actionBg;
        
        switch(trade.action) {
            case 'OPEN':
                actionText = 'Открытие';
                actionIcon = 'fa-door-open';
                actionColor = '#3880ff';
                actionBg = 'rgba(56, 128, 255, 0.1)';
                break;
            case 'CLOSE':
                actionText = 'Закрытие';
                actionIcon = 'fa-door-closed';
                actionColor = trade.pnl >= 0 ? '#4cd964' : '#ff3b30';
                actionBg = trade.pnl >= 0 ? 'rgba(76, 217, 100, 0.1)' : 'rgba(255, 59, 48, 0.1)';
                break;
            case 'LIQUIDATED':
                actionText = 'Ликвидация';
                actionIcon = 'fa-skull-crossbones';
                actionColor = '#ff3b30';
                actionBg = 'rgba(255, 59, 48, 0.1)';
                break;
            default:
                actionText = 'Сделка';
                actionIcon = 'fa-exchange-alt';
                actionColor = '#888';
                actionBg = 'rgba(136, 136, 136, 0.1)';
        }
        
        const time = new Date(trade.timestamp);
        const timeString = `${time.getDate().toString().padStart(2, '0')}.${(time.getMonth() + 1).toString().padStart(2, '0')} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        const coinIcon = game.coins[trade.coin]?.icon || 'fas fa-coins';
        const coinColor = game.coins[trade.coin]?.color || '#888';
        
        html += `
            <div class="history-item" style="border-left-color: ${actionColor};">
                <div class="history-header">
                    <div class="history-type" style="display: flex; align-items: center; gap: 8px;">
                        <div style="
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            background: ${actionBg};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: ${actionColor};
                        ">
                            <i class="fas ${actionIcon}"></i>
                        </div>
                        <div>
                            <div style="font-weight: bold; font-size: 14px;">${actionText}</div>
                            <div style="font-size: 12px; opacity: 0.7;">
                                <span class="${trade.type === 'LONG' ? 'type-long' : 'type-short'}" style="font-size: 11px;">
                                    ${trade.type} ${trade.leverage}x
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="history-pnl ${pnlClass}" style="font-size: 16px;">${pnlText}</div>
                </div>
                <div class="history-details" style="grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 12px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="${coinIcon}" style="color: ${coinColor};"></i>
                        <span>${trade.coin}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-clock"></i>
                        <span>${timeString}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>$${trade.entryPrice?.toFixed(8) || '0.00000000'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>${trade.exitPrice ? `$${trade.exitPrice.toFixed(8)}` : '-'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>$${trade.amount}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-percentage"></i>
                        <span>${pnlPercent}%</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
    
    // Добавляем заголовок с количеством сделок
    const historyHeader = historyList.previousElementSibling;
    if (historyHeader && historyHeader.tagName === 'H3') {
        const totalTrades = game.history.length;
        const profitableTrades = game.history.filter(t => t.pnl > 0).length;
        const successRate = totalTrades > 0 ? Math.round((profitableTrades / totalTrades) * 100) : 0;
        
        historyHeader.innerHTML = `
            <i class="fas fa-history"></i> История сделок 
            <span style="font-size: 14px; opacity: 0.7;">
                (${totalTrades} сделок, ${successRate}% успешных)
            </span>
        `;
    }
};

// Обновление таблицы рейтинга (по балансу)
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
        let medalColor = '';
        if (index === 0) {
            medal = '🥇';
            medalColor = '#FFD700';
        } else if (index === 1) {
            medal = '🥈';
            medalColor = '#C0C0C0';
        } else if (index === 2) {
            medal = '🥉';
            medalColor = '#CD7F32';
        }
        
        // Определяем изменение позиции
        let positionChange = '';
        const lastPosition = player.lastPosition || index + 1;
        if (lastPosition < index + 1) {
            positionChange = `<span style="color: #ff3b30; font-size: 12px;">▼ ${lastPosition - (index + 1)}</span>`;
        } else if (lastPosition > index + 1) {
            positionChange = `<span style="color: #4cd964; font-size: 12px;">▲ ${(index + 1) - lastPosition}</span>`;
        }
        
        html += `
            <tr style="
                ${isCurrentPlayer ? 'background: linear-gradient(135deg, rgba(56, 128, 255, 0.2), rgba(56, 128, 255, 0.1)) !important;' : ''}
                ${index < 3 ? 'border-left: 3px solid ' + medalColor + ';' : ''}
            ">
                <td style="font-weight: bold; ${index < 3 ? 'color: ' + medalColor + ';' : ''}">
                    ${medal} ${index + 1}
                    ${positionChange}
                </td>
                <td style="${isCurrentPlayer ? 'font-weight: bold;' : ''}">
                    ${player.name} ${isCurrentPlayer ? '<span style="color: #3880ff;">(Вы)</span>' : ''}
                </td>
                <td style="font-weight: bold; color: #4cd964;">$${player.balance.toFixed(2)}</td>
                <td class="${pnlClass}" style="font-weight: bold;">${pnlText}</td>
            </tr>
        `;
        
        // Сохраняем текущую позицию для следующего сравнения
        player.lastPosition = index + 1;
    });
    
    tableBody.innerHTML = html;
    
    // Добавляем статистику в заголовок модального окна
    const modalHeader = document.querySelector('.modal-header h3');
    if (modalHeader) {
        const totalPlayers = game.players.length;
        const topBalance = game.players[0]?.balance || 0;
        const averageBalance = game.players.reduce((sum, p) => sum + p.balance, 0) / totalPlayers;
        
        modalHeader.innerHTML = `
            <i class="fas fa-trophy"></i> Рейтинг игроков
            <div style="font-size: 12px; font-weight: normal; opacity: 0.8; margin-top: 5px;">
                Всего игроков: ${totalPlayers} | Топ: $${topBalance.toFixed(2)} | Среднее: $${averageBalance.toFixed(2)}
            </div>
        `;
    }
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.custom-notification');
    oldNotifications.forEach(n => {
        if (n.parentNode) n.parentNode.removeChild(n);
    });
    
    // Определяем параметры уведомления
    let icon, title, color, bgColor;
    
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            title = 'Успешно!';
            color = '#4cd964';
            bgColor = 'rgba(76, 217, 100, 0.95)';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            title = 'Ошибка!';
            color = '#ff3b30';
            bgColor = 'rgba(255, 59, 48, 0.95)';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            title = 'Внимание!';
            color = '#ff9500';
            bgColor = 'rgba(255, 149, 0, 0.95)';
            break;
        default:
            icon = 'fa-info-circle';
            title = 'Информация';
            color = '#3880ff';
            bgColor = 'rgba(56, 128, 255, 0.95)';
    }
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        backdrop-filter: blur(10px);
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        z-index: 10000;
        max-width: 350px;
        animation: slideInRight 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        border-left: 4px solid ${color};
        border: 1px solid ${color}40;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <i class="fas ${icon}" style="font-size: 22px; margin-top: 2px; color: ${color};"></i>
            <div style="flex: 1;">
                <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px; color: ${color}">
                    ${title}
                </div>
                <div style="font-size: 14px; line-height: 1.4; white-space: pre-line; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 6px;">
                    ${message}
                </div>
                <div style="margin-top: 8px; font-size: 11px; opacity: 0.8; text-align: right;">
                    ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
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

// Звуковые эффекты
function playTradeSound() {
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
        // Если Audio API не поддерживается, игнорируем
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

function playEventSound(isPositive) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Создаем основной осциллятор
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (isPositive) {
            // Восходящий звук для позитивных событий
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.2);
        } else {
            // Нисходящий звук для негативных событий
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.2);
        }
        
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        // Игнорируем ошибки
    }
}

function playLiquidationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Создаем резкий нисходящий звук для ликвидации
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
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
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .balance-updated {
            animation: pulseBalance 1s ease-in-out;
        }
        
        @keyframes pulseBalance {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .pnl-updated {
            animation: pulsePnl 0.5s ease-in-out;
        }
        
        @keyframes pulsePnl {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        .quick-btn-active {
            background: rgba(56, 128, 255, 0.5) !important;
            transform: scale(0.95);
            box-shadow: 0 0 10px rgba(56, 128, 255, 0.5) !important;
        }
        
        .coin-btn.trend-up {
            border-color: #4cd964 !important;
            box-shadow: 0 0 15px rgba(76, 217, 100, 0.3) !important;
            background: rgba(76, 217, 100, 0.1) !important;
        }
        
        .coin-btn.trend-down {
            border-color: #ff3b30 !important;
            box-shadow: 0 0 15px rgba(255, 59, 48, 0.3) !important;
            background: rgba(255, 59, 48, 0.1) !important;
        }
        
        .price-update {
            animation: priceFlash 0.5s ease-in-out;
        }
        
        @keyframes priceFlash {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
        
        .detail-label {
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
        }
    `;
    document.head.appendChild(style);
})();

// Экспортируем функции для глобального использования
window.closePosition = closePosition;
window.showNotification = showNotification;
window.updatePositionsList = updatePositionsList;
window.updateHistoryList = updateHistoryList;

// Функция для ручного обновления графика (для отладки)
window.refreshChart = function() {
    if (window.tradingChart) {
        window.tradingChart.updateChartData();
        showNotification('График обновлен', 'info');
    }
};

console.log('Script.js полностью загружен и готов к работе!');
