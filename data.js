// Модель данных для игры
class TradingGame {
    constructor() {
        this.balance = 1000.00;
        this.initialBalance = 1000.00;
        this.positions = [];
        this.history = [];
        this.orders = [];
        this.currentCoin = 'SHIBA';
        this.leverage = 5;
        this.stopLoss = 5;
        this.takeProfit = 10;
        
        // Данные по монетам
        this.coins = {
            'SHIBA': {
                name: 'SHIBA',
                price: 0.000008,
                icon: 'fas fa-dog',
                color: '#FF6B6B',
                history: this.generatePriceHistory(0.000008, 0.000005, 0.000012)
            },
            'PEPE': {
                name: 'PEPE',
                price: 0.0000012,
                icon: 'fas fa-frog',
                color: '#4ECDC4',
                history: this.generatePriceHistory(0.0000012, 0.0000008, 0.0000018)
            },
            'BONK': {
                name: 'BONK',
                price: 0.000015,
                icon: 'fas fa-coins',
                color: '#FFD166',
                history: this.generatePriceHistory(0.000015, 0.000010, 0.000022)
            }
        };
        
        // Имитация других игроков для рейтинга
        this.players = this.generatePlayers();
        
        // Инициализация
        this.loadFromStorage();
        this.startPriceUpdates();
    }
    
    // Генерация исторических данных
    generatePriceHistory(initialPrice, minPrice, maxPrice) {
        const history = [];
        let currentPrice = initialPrice;
        const now = Date.now();
        
        for (let i = 200; i >= 0; i--) {
            const time = now - (i * 60000); // 1 минута интервал
            // Случайное движение цены
            const change = (Math.random() - 0.5) * 0.001 * currentPrice;
            currentPrice += change;
            
            // Ограничение цены в разумных пределах
            if (currentPrice < minPrice) currentPrice = minPrice * (1 + Math.random() * 0.1);
            if (currentPrice > maxPrice) currentPrice = maxPrice * (1 - Math.random() * 0.1);
            
            history.push({
                time: time / 1000, // В секундах для TradingView
                value: currentPrice
            });
        }
        
        return history;
    }
    
    // Обновление цен в реальном времени
    startPriceUpdates() {
        setInterval(() => {
            Object.keys(this.coins).forEach(coinName => {
                const coin = this.coins[coinName];
                const lastPrice = coin.history[coin.history.length - 1].value;
                
                // Генерация нового значения цены
                const volatility = 0.0002; // 0.02% волатильность
                const change = lastPrice * volatility * (Math.random() - 0.5);
                let newPrice = lastPrice + change;
                
                // Ограничение цены
                const minPrice = coinName === 'SHIBA' ? 0.000005 : 
                                coinName === 'PEPE' ? 0.0000008 : 0.000010;
                const maxPrice = coinName === 'SHIBA' ? 0.000012 : 
                                coinName === 'PEPE' ? 0.0000018 : 0.000022;
                
                if (newPrice < minPrice) newPrice = minPrice * (1 + Math.random() * 0.05);
                if (newPrice > maxPrice) newPrice = maxPrice * (1 - Math.random() * 0.05);
                
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
            });
            
            // Проверка позиций на ликвидацию и тейк-профит/стоп-лосс
            this.checkPositions();
            
            // Сохранение состояния
            this.saveToStorage();
            
            // Обновление UI
            if (window.updatePrices) window.updatePrices();
            if (window.updatePositions) window.updatePositions();
            
        }, 5000); // Обновление каждые 5 секунд
    }
    
    // Открытие позиции
    openPosition(type, amount) {
        const coin = this.coins[this.currentCoin];
        const entryPrice = coin.price;
        const leverageAmount = amount * this.leverage;
        
        // Проверка на достаточность средств
        if (leverageAmount > this.balance) {
            alert('Недостаточно средств для открытия позиции с таким плечом!');
            return false;
        }
        
        // Расчет стоп-лосса и тейк-профита в абсолютных значениях
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
            currentPrice: entryPrice,
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
    
    // Расчет цены ликвидации
    calculateLiquidationPrice(type, entryPrice, leverage) {
        // Простая формула ликвидации при потере 100% залога
        if (type === 'LONG') {
            return entryPrice * (1 - 1 / leverage);
        } else {
            return entryPrice * (1 + 1 / leverage);
        }
    }
    
    // Закрытие позиции
    closePosition(positionId) {
        const positionIndex = this.positions.findIndex(p => p.id === positionId);
        if (positionIndex === -1) return;
        
        const position = this.positions[positionIndex];
        const coin = this.coins[position.coin];
        const exitPrice = coin.price;
        
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
                this.positions = [];
                
                // Показываем уведомление
                if (window.showLiquidationNotification) {
                    window.showLiquidationNotification();
                }
                
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
    
    // Генерация данных игроков для рейтинга
    generatePlayers() {
        const players = [
            { id: 1, name: 'Трейдер Макс', balance: 2450.50, pnl: 1450.50 },
            { id: 2, name: 'Крипто Волк', balance: 1890.75, pnl: 890.75 },
            { id: 3, name: 'Биткоин Джо', balance: 1567.30, pnl: 567.30 },
            { id: 4, name: 'Сатоши Накамото', balance: 1320.10, pnl: 320.10 },
            { id: 5, name: 'Аноним', balance: 1125.80, pnl: 125.80 },
            { id: 6, name: 'Новичок', balance: 950.40, pnl: -49.60 },
            { id: 7, name: 'Лузер', balance: 650.20, pnl: -349.80 }
        ];
        
        // Добавляем текущего игрока
        players.push({
            id: 0,
            name: 'Вы',
            balance: this.balance,
            pnl: this.calculateTotalPNL()
        });
        
        // Сортируем по балансу
        return players.sort((a, b) => b.balance - a.balance);
    }
    
    // Сохранение в localStorage
    saveToStorage() {
        const gameData = {
            balance: this.balance,
            positions: this.positions,
            history: this.history.slice(0, 50), // Сохраняем последние 50 сделок
            currentCoin: this.currentCoin,
            leverage: this.leverage,
            stopLoss: this.stopLoss,
            takeProfit: this.takeProfit
        };
        
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
        this.saveToStorage();
    }
}

// Создаем глобальный экземпляр игры
window.game = new TradingGame();
