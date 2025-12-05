// Модель данных для игры с событийным движением цен
class TradingGame {
    constructor() {
        this.balance = 1000.00;
        this.initialBalance = 1000.00;
        this.positions = [];
        this.history = [];
        this.currentCoin = 'SHIBA';
        this.leverage = 5;
        this.stopLoss = 5;
        this.takeProfit = 10;
        this.events = [];
        this.eventInterval = null;
        
        // Данные по монетам с начальными ценами
        this.coins = {
            'SHIBA': {
                name: 'SHIBA',
                price: 0.000008,
                icon: 'fas fa-dog',
                color: '#FF6B6B',
                history: [],
                volume: 0, // Объем торгов
                trend: 0, // Тренд: -1 (падение), 0 (нейтрально), 1 (рост)
                volatility: 0.0001 // Базовая волатильность
            },
            'PEPE': {
                name: 'PEPE',
                price: 0.0000012,
                icon: 'fas fa-frog',
                color: '#4ECDC4',
                history: [],
                volume: 0,
                trend: 0,
                volatility: 0.0002
            },
            'BONK': {
                name: 'BONK',
                price: 0.000015,
                icon: 'fas fa-coins',
                color: '#FFD166',
                history: [],
                volume: 0,
                trend: 0,
                volatility: 0.00015
            }
        };
        
        // Инициализация истории цен
        this.initializePriceHistory();
        
        // Имитация других игроков для рейтинга
        this.players = this.generatePlayers();
        
        // Инициализация
        this.loadFromStorage();
        this.startPriceUpdates();
        this.startEventSystem();
    }
    
    // Инициализация исторических данных
    initializePriceHistory() {
        const now = Date.now();
        
        Object.keys(this.coins).forEach(coinName => {
            const coin = this.coins[coinName];
            coin.history = [];
            
            // Генерируем 200 точек данных с небольшими флуктуациями
            let currentPrice = coin.price;
            
            for (let i = 200; i >= 0; i--) {
                const time = now - (i * 60000); // 1 минута интервал
                
                // Небольшие случайные колебания
                const fluctuation = currentPrice * coin.volatility * (Math.random() - 0.5);
                currentPrice += fluctuation;
                
                // Гарантируем, что цена останется в разумных пределах
                currentPrice = Math.max(currentPrice * 0.5, Math.min(currentPrice * 1.5, currentPrice));
                
                coin.history.push({
                    time: time / 1000,
                    value: currentPrice
                });
            }
            
            // Устанавливаем текущую цену
            coin.price = currentPrice;
        });
    }
    
    // Система событий
    startEventSystem() {
        // Создаем 30 событий (15 положительных, 15 отрицательных)
        this.generateEvents();
        
        // Запускаем события каждые 1.5 минуты (90 секунд)
        this.eventInterval = setInterval(() => {
            this.processNextEvent();
        }, 90000); // 90 секунд
        
        // Первое событие через 30 секунд после запуска
        setTimeout(() => {
            this.processNextEvent();
        }, 30000);
    }
    
    generateEvents() {
        const eventTypes = [
            {
                type: 'POSITIVE',
                messages: [
                    '📈 Крупный инвестор купил монету!',
                    '🚀 Проект анонсировал партнерство!',
                    '💎 Листинг на новой бирже!',
                    '🔥 Взрывной рост интереса!',
                    '🌟 Важная технологическая новость!',
                    '📰 Положительные новости в СМИ!',
                    '🤝 Крупное сотрудничество!',
                    '🎯 Достигнута важная веха!',
                    '💼 Институциональные инвесторы вошли!',
                    '⚡ Улучшение технологии сети!',
                    '🌍 Глобальное расширение!',
                    '🏆 Проект получил награду!',
                    '🔝 Вошел в топ рейтингов!',
                    '💫 Сообщество активно растет!',
                    '🚪 Открытие новых рынков!'
                ],
                impact: 0.02 // +2% к цене
            },
            {
                type: 'NEGATIVE',
                messages: [
                    '📉 Крупный инвестор продал монету!',
                    '⚠️ Технические проблемы сети!',
                    '🔻 Проект потерял партнера!',
                    '💔 Негативные новости в СМИ!',
                    '🚫 Проблемы с регулированием!',
                    '📉 Паника на рынке!',
                    '👎 Критика от экспертов!',
                    '💸 Финансовые проблемы проекта!',
                    '🔽 Делистинг с биржи!',
                    '⚠️ Взлом или безопасность!',
                    '📛 Юридические проблемы!',
                    '💔 Сообщество недовольно!',
                    '📉 Падение торговых объемов!',
                    '🚷 Ограничения в использовании!',
                    '🔻 Технологические сложности!'
                ],
                impact: -0.02 // -2% к цене
            }
        ];
        
        this.events = [];
        
        // Создаем 15 положительных событий
        for (let i = 0; i < 15; i++) {
            const eventType = eventTypes[0];
            const message = eventType.messages[Math.floor(Math.random() * eventType.messages.length)];
            
            this.events.push({
                type: 'POSITIVE',
                message: message,
                impact: eventType.impact + (Math.random() * 0.01 - 0.005), // ±0.5% вариация
                coin: this.getRandomCoin(),
                timestamp: Date.now() + (i * 90000) // Распределяем по времени
            });
        }
        
        // Создаем 15 отрицательных событий
        for (let i = 0; i < 15; i++) {
            const eventType = eventTypes[1];
            const message = eventType.messages[Math.floor(Math.random() * eventType.messages.length)];
            
            this.events.push({
                type: 'NEGATIVE',
                message: message,
                impact: eventType.impact + (Math.random() * 0.01 - 0.005), // ±0.5% вариация
                coin: this.getRandomCoin(),
                timestamp: Date.now() + ((15 + i) * 90000) // Распределяем после положительных
            });
        }
        
        // Перемешиваем события
        this.events = this.shuffleArray(this.events);
    }
    
    processNextEvent() {
        if (this.events.length === 0) {
            this.generateEvents(); // Регенерируем события если закончились
        }
        
        const event = this.events.shift();
        const coin = this.coins[event.coin];
        
        // Применяем влияние события к цене
        const oldPrice = coin.price;
        const newPrice = oldPrice * (1 + event.impact);
        
        // Обновляем цену и историю
        coin.price = newPrice;
        coin.history.push({
            time: Date.now() / 1000,
            value: newPrice
        });
        
        // Удаляем старые данные
        if (coin.history.length > 500) {
            coin.history.shift();
        }
        
        // Обновляем тренд монеты
        coin.trend = event.impact > 0 ? 1 : -1;
        
        // Показываем уведомление
        if (window.showEventNotification) {
            window.showEventNotification(event);
        }
        
        // Проверяем позиции на ликвидацию и тейк-профит/стоп-лосс
        this.checkPositions();
        
        // Сохраняем состояние
        this.saveToStorage();
        
        // Обновляем UI
        if (window.updatePrices) window.updatePrices();
        if (window.updatePositions) window.updatePositions();
        
        console.log(`Событие: ${event.message} | Монета: ${event.coin} | Влияние: ${(event.impact * 100).toFixed(2)}%`);
    }
    
    // Обновление цен в реальном времени с влиянием объемов торгов
    startPriceUpdates() {
        setInterval(() => {
            Object.keys(this.coins).forEach(coinName => {
                const coin = this.coins[coinName];
                const lastPrice = coin.price;
                
                // Базовое движение цены (небольшие флуктуации)
                let priceChange = 0;
                
                // Влияние объема торгов
                if (coin.volume > 0) {
                    // Чем больше объем, тем сильнее движение
                    const volumeImpact = coin.volume * 0.000001;
                    priceChange += volumeImpact * (coin.trend >= 0 ? 1 : -1);
                }
                
                // Случайные флуктуации
                const randomFluctuation = lastPrice * coin.volatility * (Math.random() - 0.5) * 0.5;
                priceChange += randomFluctuation;
                
                // Постепенное возвращение тренда к нейтральному
                coin.trend *= 0.95;
                if (Math.abs(coin.trend) < 0.01) coin.trend = 0;
                
                let newPrice = lastPrice + priceChange;
                
                // Гарантируем, что цена не уйдет в ноль или бесконечность
                newPrice = Math.max(newPrice * 0.999, Math.min(newPrice * 1.001, newPrice));
                
                // Обновление цены
                coin.price = newPrice;
                coin.history.push({
                    time: Date.now() / 1000,
                    value: newPrice
                });
                
                // Удаление старых данных
                if (coin.history.length > 500) {
                    coin.history.shift();
                }
                
                // Постепенно уменьшаем объем торгов
                coin.volume *= 0.9;
            });
            
            // Проверка позиций
            this.checkPositions();
            
            // Сохранение состояния
            this.saveToStorage();
            
            // Обновление UI
            if (window.updatePrices) window.updatePrices();
            if (window.updatePositions) window.updatePositions();
            
        }, 5000); // Обновление каждые 5 секунд
    }
    
    // Открытие позиции влияет на цену
    openPosition(type, amount) {
        const coin = this.coins[this.currentCoin];
        const entryPrice = coin.price;
        const leverageAmount = amount * this.leverage;
        
        // Проверка на достаточность средств
        if (leverageAmount > this.balance) {
            return false;
        }
        
        // Влияние на цену при открытии позиции
        const volumeImpact = amount * 0.000001; // Влияние объема торгов
        coin.volume += amount * 0.01; // Увеличиваем объем торгов
        
        if (type === 'LONG') {
            // При покупке цена немного растет
            coin.price = entryPrice * (1 + volumeImpact);
            coin.trend = Math.min(coin.trend + 0.1, 1); // Усиливаем тренд вверх
        } else {
            // При продаже цена немного падает
            coin.price = entryPrice * (1 - volumeImpact);
            coin.trend = Math.max(coin.trend - 0.1, -1); // Усиливаем тренд вниз
        }
        
        // Расчет стоп-лосса и тейк-профита
        const stopLossPrice = type === 'LONG' 
            ? entryPrice * (1 - this.stopLoss / 100)
            : entryPrice * (1 + this.stopLoss / 100);
            
        const takeProfitPrice = type === 'LONG'
            ? entryPrice * (1 + this.takeProfit / 100)
            : entryPrice * (1 - this.takeProfit / 100);
        
        const position = {
            id: Date.now(),
            coin: this.currentCoin,
            type: type,
            entryPrice: entryPrice,
            amount: amount,
            leverage: this.leverage,
            currentPrice: coin.price,
            stopLoss: stopLossPrice,
            takeProfit: takeProfitPrice,
            timestamp: Date.now(),
            liquidationPrice: this.calculateLiquidationPrice(type, entryPrice, this.leverage)
        };
        
        this.positions.push(position);
        this.balance -= leverageAmount; // Резервируем средства
        
        // Добавляем в историю
        this.history.unshift({
            id: position.id,
            coin: this.currentCoin,
            type: type,
            entryPrice: entryPrice,
            amount: amount,
            leverage: this.leverage,
            timestamp: Date.now(),
            action: 'OPEN',
            pnl: 0
        });
        
        this.saveToStorage();
        return true;
    }
    
    // Закрытие позиции также влияет на цену
    closePosition(positionId) {
        const positionIndex = this.positions.findIndex(p => p.id === positionId);
        if (positionIndex === -1) return 0;
        
        const position = this.positions[positionIndex];
        const coin = this.coins[position.coin];
        const exitPrice = coin.price;
        
        // Влияние на цену при закрытии позиции
        const volumeImpact = position.amount * 0.000001;
        coin.volume += position.amount * 0.01;
        
        if (position.type === 'LONG') {
            // При закрытии лонга (продажа) цена немного падает
            coin.price = exitPrice * (1 - volumeImpact * 0.5);
            coin.trend = Math.max(coin.trend - 0.05, -1);
        } else {
            // При закрытии шорта (покупка) цена немного растет
            coin.price = exitPrice * (1 + volumeImpact * 0.5);
            coin.trend = Math.min(coin.trend + 0.05, 1);
        }
        
        // Расчет P&L
        let pnl;
        if (position.type === 'LONG') {
            pnl = (exitPrice - position.entryPrice) * position.amount * position.leverage;
        } else {
            pnl = (position.entryPrice - exitPrice) * position.amount * position.leverage;
        }
        
        // Возвращаем залог и добавляем/вычитаем P&L
        this.balance += (position.amount * position.leverage) + pnl;
        
        // Добавляем в историю
        this.history.unshift({
            id: position.id,
            coin: position.coin,
            type: position.type,
            entryPrice: position.entryPrice,
            exitPrice: exitPrice,
            amount: position.amount,
            leverage: position.leverage,
            timestamp: Date.now(),
            action: 'CLOSE',
            pnl: pnl
        });
        
        // Удаляем позицию
        this.positions.splice(positionIndex, 1);
        this.saveToStorage();
        
        return pnl;
    }
    
    // Расчет цены ликвидации
    calculateLiquidationPrice(type, entryPrice, leverage) {
        // Простая формула ликвидации при потере 100% залога
        if (type === 'LONG') {
            return entryPrice * (1 - 1 / leverage);
        } else {
            return entryPrice * (1 + 1 / leverage);
        }
    }
    
    // Проверка позиций на ликвидацию и срабатывание ордеров
    checkPositions() {
        for (let i = this.positions.length - 1; i >= 0; i--) {
            const position = this.positions[i];
            const coin = this.coins[position.coin];
            const currentPrice = coin.price;
            
            // Обновляем текущую цену в позиции
            position.currentPrice = currentPrice;
            
            // Проверка на ликвидацию
            if ((position.type === 'LONG' && currentPrice <= position.liquidationPrice) ||
                (position.type === 'SHORT' && currentPrice >= position.liquidationPrice)) {
                
                // Ликвидация!
                this.balance = 0;
                
                // Добавляем в историю
                this.history.unshift({
                    id: position.id,
                    coin: position.coin,
                    type: position.type,
                    entryPrice: position.entryPrice,
                    exitPrice: currentPrice,
                    amount: position.amount,
                    leverage: position.leverage,
                    timestamp: Date.now(),
                    action: 'LIQUIDATED',
                    pnl: -(position.amount * position.leverage)
                });
                
                // Удаляем все позиции
                this.positions = [];
                
                // Показываем уведомление
                if (window.showLiquidationNotification) {
                    window.showLiquidationNotification();
                }
                
                continue;
            }
            
            // Проверка стоп-лосса
            if ((position.type === 'LONG' && currentPrice <= position.stopLoss) ||
                (position.type === 'SHORT' && currentPrice >= position.stopLoss)) {
                this.closePosition(position.id);
                continue;
            }
            
            // Проверка тейк-профита
            if ((position.type === 'LONG' && currentPrice >= position.takeProfit) ||
                (position.type === 'SHORT' && currentPrice <= position.takeProfit)) {
                this.closePosition(position.id);
            }
        }
    }
    
    // Расчет общего P&L
    calculateTotalPNL() {
        let totalPnl = 0;
        
        // P&L из истории
        this.history.forEach(trade => {
            if (trade.action === 'CLOSE' || trade.action === 'LIQUIDATED') {
                totalPnl += trade.pnl;
            }
        });
        
        // Текущий P&L открытых позиций
        this.positions.forEach(position => {
            const coin = this.coins[position.coin];
            let pnl;
            
            if (position.type === 'LONG') {
                pnl = (coin.price - position.entryPrice) * position.amount * position.leverage;
            } else {
                pnl = (position.entryPrice - coin.price) * position.amount * position.leverage;
            }
            
            totalPnl += pnl;
        });
        
        return totalPnl;
    }
    
    // Генерация данных игроков для рейтинга (по балансу)
    generatePlayers() {
        const players = [
            { id: 1, name: 'Крипто Волк', balance: 3250.50, pnl: 2250.50 },
            { id: 2, name: 'Трейдер Макс', balance: 2890.75, pnl: 1890.75 },
            { id: 3, name: 'Биткоин Джо', balance: 2567.30, pnl: 1567.30 },
            { id: 4, name: 'Дельта Про', balance: 2320.10, pnl: 1320.10 },
            { id: 5, name: 'Аноним', balance: 2125.80, pnl: 1125.80 },
            { id: 6, name: 'Скальпер', balance: 1950.40, pnl: 950.40 },
            { id: 7, name: 'Холдер', balance: 1750.20, pnl: 750.20 },
            { id: 8, name: 'Новичок', balance: 1520.60, pnl: 520.60 },
            { id: 9, name: 'Скептик', balance: 1280.90, pnl: 280.90 },
            { id: 10, name: 'Лузер', balance: 650.20, pnl: -349.80 }
        ];
        
        // Добавляем текущего игрока
        players.push({
            id: 0,
            name: 'Вы',
            balance: this.balance,
            pnl: this.calculateTotalPNL()
        });
        
        // Сортируем по балансу (по убыванию)
        return players.sort((a, b) => b.balance - a.balance);
    }
    
    // Вспомогательные методы
    getRandomCoin() {
        const coins = Object.keys(this.coins);
        return coins[Math.floor(Math.random() * coins.length)];
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    // Сохранение в localStorage
    saveToStorage() {
        const gameData = {
            balance: this.balance,
            positions: this.positions,
            history: this.history.slice(0, 50),
            currentCoin: this.currentCoin,
            leverage: this.leverage,
            stopLoss: this.stopLoss,
            takeProfit: this.takeProfit,
            coins: {} // Сохраняем только текущие цены
        };
        
        // Сохраняем текущие цены монет
        Object.keys(this.coins).forEach(coinName => {
            gameData.coins[coinName] = {
                price: this.coins[coinName].price,
                volume: this.coins[coinName].volume,
                trend: this.coins[coinName].trend
            };
        });
        
        localStorage.setItem('tradingGameData', JSON.stringify(gameData));
    }
    
    // Загрузка из localStorage
    loadFromStorage() {
        const savedData = localStorage.getItem('tradingGameData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.balance = data.balance || 1000.00;
                this.positions = data.positions || [];
                this.history = data.history || [];
                this.currentCoin = data.currentCoin || 'SHIBA';
                this.leverage = data.leverage || 5;
                this.stopLoss = data.stopLoss || 5;
                this.takeProfit = data.takeProfit || 10;
                
                // Восстанавливаем цены монет
                if (data.coins) {
                    Object.keys(data.coins).forEach(coinName => {
                        if (this.coins[coinName]) {
                            this.coins[coinName].price = data.coins[coinName].price || this.coins[coinName].price;
                            this.coins[coinName].volume = data.coins[coinName].volume || 0;
                            this.coins[coinName].trend = data.coins[coinName].trend || 0;
                        }
                    });
                }
            } catch (e) {
                console.error('Ошибка загрузки данных:', e);
            }
        }
    }
    
    // Сброс игры
    resetGame() {
        this.balance = 1000.00;
        this.positions = [];
        this.history = [];
        
        // Сбрасываем цены монет к начальным
        Object.keys(this.coins).forEach(coinName => {
            this.coins[coinName].price = coinName === 'SHIBA' ? 0.000008 :
                                       coinName === 'PEPE' ? 0.0000012 : 0.000015;
            this.coins[coinName].volume = 0;
            this.coins[coinName].trend = 0;
        });
        
        this.saveToStorage();
    }
}

// Создаем глобальный экземпляр игры
window.game = new TradingGame();
