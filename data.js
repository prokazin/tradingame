// Модель данных для игры с простой и понятной логикой
class TradingGame {
    constructor() {
        this.balance = 1000.00;
        this.positions = [];
        this.history = [];
        this.currentCoin = 'SHIBA';
        this.leverage = 5;
        this.stopLoss = 5; // %
        this.takeProfit = 10; // %
        
        // Данные по монетам
        this.coins = {
            'SHIBA': {
                name: 'SHIBA',
                price: 0.000008,
                icon: 'fas fa-dog',
                color: '#FF6B6B',
                history: []
            },
            'PEPE': {
                name: 'PEPE',
                price: 0.0000012,
                icon: 'fas fa-frog',
                color: '#4ECDC4',
                history: []
            },
            'BONK': {
                name: 'BONK',
                price: 0.000015,
                icon: 'fas fa-coins',
                color: '#FFD166',
                history: []
            }
        };
        
        // Инициализация истории
        this.initializeHistory();
        
        // Загрузка сохраненных данных
        this.loadFromStorage();
        
        // Запуск обновления цен
        this.startPriceUpdates();
    }
    
    // Инициализация истории цен
    initializeHistory() {
        const now = Date.now();
        
        Object.keys(this.coins).forEach(coinName => {
            const coin = this.coins[coinName];
            coin.history = [];
            
            let currentPrice = coin.price;
            
            // Генерируем историю на 60 секунд назад
            for (let i = 60; i >= 0; i--) {
                const time = now - (i * 1000); // 1 секунда интервал
                
                // Случайное изменение цены
                const changePercent = (Math.random() - 0.5) * 0.002; // ±0.1%
                currentPrice = currentPrice * (1 + changePercent);
                
                // Сохраняем
                coin.history.push({
                    time: time / 1000,
                    value: currentPrice
                });
            }
            
            // Обновляем текущую цену
            coin.price = currentPrice;
        });
    }
    
    // Обновление цен каждую секунду
    startPriceUpdates() {
        setInterval(() => {
            Object.keys(this.coins).forEach(coinName => {
                const coin = this.coins[coinName];
                const lastPrice = coin.price;
                
                // Случайное изменение
                const changePercent = (Math.random() - 0.5) * 0.002; // ±0.1%
                let newPrice = lastPrice * (1 + changePercent);
                
                // Сохраняем новую цену
                coin.price = newPrice;
                
                // Добавляем в историю
                coin.history.push({
                    time: Date.now() / 1000,
                    value: newPrice
                });
                
                // Удаляем старые данные (храним последние 300 точек)
                if (coin.history.length > 300) {
                    coin.history.shift();
                }
            });
            
            // Проверяем позиции на стоп-лосс/тейк-профит/ликвидацию
            this.checkPositions();
            
            // Сохраняем
            this.saveToStorage();
            
            // Обновляем UI
            if (window.updatePrices) window.updatePrices();
            
        }, 1000); // Каждую секунду
    }
    
    // Открытие позиции
    openPosition(type, amount) {
        const coin = this.coins[this.currentCoin];
        const entryPrice = coin.price;
        const leverageAmount = amount * this.leverage;
        
        // Проверка на достаточность средств
        if (leverageAmount > this.balance) {
            console.error('Недостаточно средств');
            return false;
        }
        
        // Расчет цен стоп-лосса и тейк-профита
        let stopLossPrice, takeProfitPrice;
        
        if (type === 'LONG') {
            stopLossPrice = entryPrice * (1 - this.stopLoss / 100);
            takeProfitPrice = entryPrice * (1 + this.takeProfit / 100);
        } else { // SHORT
            stopLossPrice = entryPrice * (1 + this.stopLoss / 100);
            takeProfitPrice = entryPrice * (1 - this.takeProfit / 100);
        }
        
        // Расчет цены ликвидации
        const liquidationPrice = this.calculateLiquidationPrice(type, entryPrice, this.leverage);
        
        // Создаем позицию
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
            liquidationPrice: liquidationPrice,
            timestamp: Date.now()
        };
        
        // Резервируем средства
        this.balance -= leverageAmount;
        this.positions.push(position);
        
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
    
    // Закрытие позиции
    closePosition(positionId) {
        const positionIndex = this.positions.findIndex(p => p.id === positionId);
        if (positionIndex === -1) return 0;
        
        const position = this.positions[positionIndex];
        const coin = this.coins[position.coin];
        const exitPrice = coin.price;
        
        // Расчет P&L
        let pnl;
        if (position.type === 'LONG') {
            pnl = (exitPrice - position.entryPrice) * position.amount * position.leverage;
        } else { // SHORT
            pnl = (position.entryPrice - exitPrice) * position.amount * position.leverage;
        }
        
        // Возвращаем залог и добавляем P&L
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
        // Ликвидация происходит при потере 100% залога
        if (type === 'LONG') {
            return entryPrice * (1 - 1 / leverage);
        } else { // SHORT
            return entryPrice * (1 + 1 / leverage);
        }
    }
    
    // Проверка позиций
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
                
                console.log('Ликвидация позиции', position);
                this.processLiquidation(position, i);
                continue;
            }
            
            // Проверка стоп-лосса
            if ((position.type === 'LONG' && currentPrice <= position.stopLoss) ||
                (position.type === 'SHORT' && currentPrice >= position.stopLoss)) {
                
                console.log('Сработал стоп-лосс', position);
                this.processStopLoss(position, i);
                continue;
            }
            
            // Проверка тейк-профита
            if ((position.type === 'LONG' && currentPrice >= position.takeProfit) ||
                (position.type === 'SHORT' && currentPrice <= position.takeProfit)) {
                
                console.log('Сработал тейк-профит', position);
                this.processTakeProfit(position, i);
                continue;
            }
        }
    }
    
    // Обработка ликвидации
    processLiquidation(position, index) {
        const coin = this.coins[position.coin];
        const exitPrice = coin.price;
        
        // При ликвидации теряем весь залог
        const loss = -(position.amount * position.leverage);
        
        // Возвращаем 0 (все потеряно)
        this.balance += 0;
        
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
            action: 'LIQUIDATED',
            pnl: loss
        });
        
        // Удаляем позицию
        this.positions.splice(index, 1);
        
        // Показываем уведомление
        if (window.showLiquidationNotification) {
            window.showLiquidationNotification();
        }
    }
    
    // Обработка стоп-лосса
    processStopLoss(position, index) {
        const coin = this.coins[position.coin];
        const exitPrice = coin.price;
        
        // Расчет P&L
        let pnl;
        if (position.type === 'LONG') {
            pnl = (exitPrice - position.entryPrice) * position.amount * position.leverage;
        } else { // SHORT
            pnl = (position.entryPrice - exitPrice) * position.amount * position.leverage;
        }
        
        // Возвращаем средства
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
            action: 'STOP_LOSS',
            pnl: pnl
        });
        
        // Удаляем позицию
        this.positions.splice(index, 1);
    }
    
    // Обработка тейк-профита
    processTakeProfit(position, index) {
        const coin = this.coins[position.coin];
        const exitPrice = coin.price;
        
        // Расчет P&L
        let pnl;
        if (position.type === 'LONG') {
            pnl = (exitPrice - position.entryPrice) * position.amount * position.leverage;
        } else { // SHORT
            pnl = (position.entryPrice - exitPrice) * position.amount * position.leverage;
        }
        
        // Возвращаем средства
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
            action: 'TAKE_PROFIT',
            pnl: pnl
        });
        
        // Удаляем позицию
        this.positions.splice(index, 1);
    }
    
    // Расчет общего P&L
    calculateTotalPNL() {
        let totalPnl = 0;
        
        // P&L из истории закрытых позиций
        this.history.forEach(trade => {
            if (trade.action === 'CLOSE' || trade.action === 'STOP_LOSS' || 
                trade.action === 'TAKE_PROFIT' || trade.action === 'LIQUIDATED') {
                totalPnl += trade.pnl;
            }
        });
        
        // Текущий P&L открытых позиций
        this.positions.forEach(position => {
            const coin = this.coins[position.coin];
            let pnl;
            
            if (position.type === 'LONG') {
                pnl = (coin.price - position.entryPrice) * position.amount * position.leverage;
            } else { // SHORT
                pnl = (position.entryPrice - coin.price) * position.amount * position.leverage;
            }
            
            totalPnl += pnl;
        });
        
        return totalPnl;
    }
    
    // Генерация рейтинга игроков
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
        
        // Сортируем по балансу
        return players.sort((a, b) => b.balance - a.balance);
    }
    
    // Сохранение
    saveToStorage() {
        const gameData = {
            balance: this.balance,
            positions: this.positions,
            history: this.history.slice(0, 50),
            currentCoin: this.currentCoin,
            leverage: this.leverage,
            stopLoss: this.stopLoss,
            takeProfit: this.takeProfit,
            coins: {}
        };
        
        // Сохраняем текущие цены
        Object.keys(this.coins).forEach(coinName => {
            gameData.coins[coinName] = {
                price: this.coins[coinName].price
            };
        });
        
        localStorage.setItem('tradingGameData', JSON.stringify(gameData));
    }
    
    // Загрузка
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
                
                // Восстанавливаем цены
                if (data.coins) {
                    Object.keys(data.coins).forEach(coinName => {
                        if (this.coins[coinName]) {
                            this.coins[coinName].price = data.coins[coinName].price || this.coins[coinName].price;
                        }
                    });
                }
            } catch (e) {
                console.error('Ошибка загрузки:', e);
            }
        }
    }
}

// Создаем глобальный экземпляр игры
window.game = new TradingGame();
