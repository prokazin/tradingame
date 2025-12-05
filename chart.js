// Управление графиком Lightweight Charts (работает в России)
class TradingChart {
    constructor() {
        this.chart = null;
        this.candleSeries = null;
        this.lineSeries = null;
        this.currentTimeframe = '1m';
        this.markers = [];
        this.entryLine = null;
        this.stopLossLine = null;
        this.takeProfitLine = null;
        this.lastUpdateTime = 0;
        this.updateInterval = 2000; // Обновление каждые 2 секунды
        
        this.initChart();
        this.startAutoUpdate();
    }
    
    initChart() {
        const chartContainer = document.getElementById('chart');
        if (!chartContainer) {
            console.error('Chart container not found');
            return;
        }
        
        try {
            // Создаем график с темной темой
            this.chart = LightweightCharts.createChart(chartContainer, {
                width: chartContainer.clientWidth,
                height: 220,
                layout: {
                    backgroundColor: 'transparent',
                    textColor: '#D9D9D9',
                    fontSize: 12,
                    fontFamily: 'Arial, sans-serif'
                },
                grid: {
                    vertLines: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        style: 1
                    },
                    horzLines: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        style: 1
                    }
                },
                rightPriceScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.1
                    },
                    entireTextOnly: true
                },
                timeScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    timeVisible: true,
                    secondsVisible: false,
                    fixLeftEdge: true,
                    fixRightEdge: true,
                    tickMarkFormatter: (time) => {
                        const date = new Date(time * 1000);
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        return `${hours}:${minutes}`;
                    }
                },
                crosshair: {
                    mode: LightweightCharts.CrosshairMode.Normal,
                    vertLine: {
                        color: 'rgba(255, 255, 255, 0.3)',
                        width: 1,
                        style: 1
                    },
                    horzLine: {
                        color: 'rgba(255, 255, 255, 0.3)',
                        width: 1,
                        style: 1
                    }
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: true
                },
                handleScale: {
                    axisPressedMouseMove: true,
                    mouseWheel: true,
                    pinch: true
                }
            });
            
            // Создаем свечной ряд
            this.candleSeries = this.chart.addCandlestickSeries({
                upColor: '#26a69a',
                downColor: '#ef5350',
                borderDownColor: '#ef5350',
                borderUpColor: '#26a69a',
                wickDownColor: '#ef5350',
                wickUpColor: '#26a69a',
                priceFormat: {
                    type: 'price',
                    precision: 8,
                    minMove: 0.00000001
                }
            });
            
            // Создаем линейный ряд для линий
            this.lineSeries = this.chart.addLineSeries({
                color: 'rgba(56, 128, 255, 0.5)',
                lineWidth: 1,
                lineStyle: 2,
                priceFormat: {
                    type: 'price',
                    precision: 8,
                    minMove: 0.00000001
                }
            });
            
            // Обновляем график при изменении размера окна
            window.addEventListener('resize', () => {
                this.chart.applyOptions({
                    width: chartContainer.clientWidth
                });
            });
            
            // Загружаем начальные данные
            this.updateChartData();
            
            console.log('Chart initialized successfully');
            
        } catch (error) {
            console.error('Error initializing chart:', error);
            // Резервный вариант - простой текст
            chartContainer.innerHTML = `
                <div style="color: white; text-align: center; padding: 20px;">
                    <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 10px;"></i>
                    <h3>График недоступен</h3>
                    <p>Используется симуляция данных</p>
                </div>
            `;
        }
    }
    
    startAutoUpdate() {
        setInterval(() => {
            this.updateChartData();
        }, this.updateInterval);
    }
    
    updateChartData() {
        if (!game || !game.coins[game.currentCoin]) {
            console.log('Game data not ready yet');
            return;
        }
        
        try {
            const coin = game.coins[game.currentCoin];
            const history = coin.history;
            
            if (!history || history.length === 0) {
                console.log('No history data available');
                return;
            }
            
            // Преобразуем исторические данные в свечи
            const candles = this.createCandlesFromHistory(history, this.currentTimeframe);
            
            if (candles.length === 0) {
                console.log('No candle data generated');
                return;
            }
            
            // Устанавливаем данные
            this.candleSeries.setData(candles);
            
            // Обновляем маркеры позиций
            this.updatePositionMarkers();
            
            // Обновляем линии ордеров
            this.updateOrderLines();
            
            // Автомасштабирование
            this.chart.timeScale().fitContent();
            
            // Добавляем свежую свечу
            this.addNewCandle();
            
        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }
    
    createCandlesFromHistory(history, timeframe) {
        if (!history || history.length < 2) return [];
        
        const timeframeMs = this.getTimeframeMs(timeframe);
        const candles = [];
        let currentCandle = null;
        let candleStartTime = Math.floor(history[0].time);
        
        history.forEach(point => {
            const pointTime = point.time * 1000; // В миллисекундах
            
            // Если это начало новой свечи
            if (!currentCandle || pointTime >= candleStartTime + timeframeMs) {
                // Закрываем предыдущую свечу
                if (currentCandle) {
                    currentCandle.close = currentCandle.close || currentCandle.low;
                    candles.push(currentCandle);
                }
                
                // Начинаем новую свечу
                candleStartTime = pointTime - (pointTime % timeframeMs);
                currentCandle = {
                    time: candleStartTime / 1000,
                    open: point.value,
                    high: point.value,
                    low: point.value,
                    close: point.value
                };
            } else {
                // Обновляем текущую свечу
                if (point.value > currentCandle.high) currentCandle.high = point.value;
                if (point.value < currentCandle.low) currentCandle.low = point.value;
                currentCandle.close = point.value;
            }
        });
        
        // Добавляем последнюю свечу
        if (currentCandle) {
            candles.push(currentCandle);
        }
        
        // Ограничиваем количество свечей для производительности
        return candles.slice(-100); // Последние 100 свечей
    }
    
    addNewCandle() {
        if (!game || !game.coins[game.currentCoin]) return;
        
        const coin = game.coins[game.currentCoin];
        const currentPrice = coin.price;
        const now = Date.now();
        const timeframeMs = this.getTimeframeMs(this.currentTimeframe);
        const candleStartTime = Math.floor(now / timeframeMs) * timeframeMs / 1000;
        
        // Получаем последнюю свечу
        const data = this.candleSeries.data();
        let lastCandle = data[data.length - 1];
        
        if (!lastCandle || lastCandle.time < candleStartTime) {
            // Новая свеча
            const newCandle = {
                time: candleStartTime,
                open: currentPrice,
                high: currentPrice,
                low: currentPrice,
                close: currentPrice
            };
            
            // Если есть данные, обновляем, иначе добавляем новую
            if (data.length > 0) {
                this.candleSeries.update(newCandle);
            } else {
                this.candleSeries.setData([newCandle]);
            }
        } else {
            // Обновляем существующую свечу
            lastCandle = {
                ...lastCandle,
                high: Math.max(lastCandle.high, currentPrice),
                low: Math.min(lastCandle.low, currentPrice),
                close: currentPrice
            };
            this.candleSeries.update(lastCandle);
        }
    }
    
    getTimeframeMs(timeframe) {
        switch(timeframe) {
            case '1m': return 60 * 1000;
            case '5m': return 5 * 60 * 1000;
            case '15m': return 15 * 60 * 1000;
            case '1h': return 60 * 60 * 1000;
            case '4h': return 4 * 60 * 60 * 1000;
            case '1d': return 24 * 60 * 60 * 1000;
            default: return 60 * 1000;
        }
    }
    
    updatePositionMarkers() {
        if (!this.candleSeries) return;
        
        // Очищаем старые маркеры
        this.markers.forEach(markerId => {
            try {
                this.candleSeries.removePriceLine(markerId);
            } catch (e) {
                // Игнорируем ошибки при удалении несуществующих линий
            }
        });
        this.markers = [];
        
        // Добавляем маркеры для текущих позиций
        const positions = game.positions.filter(p => p.coin === game.currentCoin);
        
        positions.forEach((position, index) => {
            try {
                // Линия цены входа
                const entryLine = this.candleSeries.createPriceLine({
                    price: position.entryPrice,
                    color: position.type === 'LONG' ? '#26a69a' : '#ef5350',
                    lineWidth: 2,
                    lineStyle: position.type === 'LONG' ? 0 : 2,
                    axisLabelVisible: true,
                    title: `${position.type} @ ${position.entryPrice.toFixed(8)}`
                });
                this.markers.push(entryLine);
                
                // Линия стоп-лосса
                if (position.stopLoss) {
                    const stopLossLine = this.candleSeries.createPriceLine({
                        price: position.stopLoss,
                        color: '#ff9500',
                        lineWidth: 1,
                        lineStyle: 2,
                        axisLabelVisible: true,
                        title: `SL: ${position.stopLoss.toFixed(8)}`
                    });
                    this.markers.push(stopLossLine);
                }
                
                // Линия тейк-профита
                if (position.takeProfit) {
                    const takeProfitLine = this.candleSeries.createPriceLine({
                        price: position.takeProfit,
                        color: '#26a69a',
                        lineWidth: 1,
                        lineStyle: 2,
                        axisLabelVisible: true,
                        title: `TP: ${position.takeProfit.toFixed(8)}`
                    });
                    this.markers.push(takeProfitLine);
                }
            } catch (error) {
                console.error('Error adding position marker:', error);
            }
        });
    }
    
    updateOrderLines() {
        if (!this.lineSeries || !game || !game.coins[game.currentCoin]) return;
        
        // Очищаем старые линии
        if (this.entryLine) {
            try { this.lineSeries.removePriceLine(this.entryLine); } catch(e) {}
        }
        if (this.stopLossLine) {
            try { this.lineSeries.removePriceLine(this.stopLossLine); } catch(e) {}
        }
        if (this.takeProfitLine) {
            try { this.lineSeries.removePriceLine(this.takeProfitLine); } catch(e) {}
        }
        
        const currentPrice = game.coins[game.currentCoin].price;
        const stopLossPercent = game.stopLoss;
        const takeProfitPercent = game.takeProfit;
        
        try {
            // Линия текущей цены
            this.entryLine = this.lineSeries.createPriceLine({
                price: currentPrice,
                color: 'rgba(56, 128, 255, 0.8)',
                lineWidth: 2,
                lineStyle: 0,
                axisLabelVisible: true,
                title: `Текущая: ${currentPrice.toFixed(8)}`
            });
            
            // Линия стоп-лосса
            const stopLossPrice = currentPrice * (1 - stopLossPercent / 100);
            this.stopLossLine = this.lineSeries.createPriceLine({
                price: stopLossPrice,
                color: 'rgba(255, 149, 0, 0.8)',
                lineWidth: 1,
                lineStyle: 2,
                axisLabelVisible: true,
                title: `Стоп-лосс: ${stopLossPrice.toFixed(8)}`
            });
            
            // Линия тейк-профита
            const takeProfitPrice = currentPrice * (1 + takeProfitPercent / 100);
            this.takeProfitLine = this.lineSeries.createPriceLine({
                price: takeProfitPrice,
                color: 'rgba(76, 217, 100, 0.8)',
                lineWidth: 1,
                lineStyle: 2,
                axisLabelVisible: true,
                title: `Тейк-профит: ${takeProfitPrice.toFixed(8)}`
            });
        } catch (error) {
            console.error('Error updating order lines:', error);
        }
    }
    
    setTimeframe(timeframe) {
        this.currentTimeframe = timeframe;
        this.updateChartData();
    }
    
    setCoin(coinName) {
        this.updateChartData();
    }
    
    // Метод для добавления маркера сделки
    addTradeMarker(time, price, type) {
        if (!this.candleSeries) return;
        
        try {
            const marker = {
                time: time,
                position: 'inBar',
                color: type === 'LONG' ? '#26a69a' : '#ef5350',
                shape: type === 'LONG' ? 'arrowUp' : 'arrowDown',
                text: type === 'LONG' ? 'L' : 'S'
            };
            
            // Для Lightweight Charts нужен другой подход с маркерами
            // Вместо этого добавим ценовую линию
            const priceLine = this.candleSeries.createPriceLine({
                price: price,
                color: type === 'LONG' ? 'rgba(76, 217, 100, 0.5)' : 'rgba(255, 59, 48, 0.5)',
                lineWidth: 1,
                lineStyle: 0,
                axisLabelVisible: false
            });
            
            this.markers.push(priceLine);
            
            // Автоматически удалим через 30 секунд
            setTimeout(() => {
                try {
                    this.candleSeries.removePriceLine(priceLine);
                    const index = this.markers.indexOf(priceLine);
                    if (index > -1) this.markers.splice(index, 1);
                } catch(e) {}
            }, 30000);
            
        } catch (error) {
            console.error('Error adding trade marker:', error);
        }
    }
}

// Инициализация графика после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing chart...');
    
    // Ждем немного чтобы игра инициализировалась
    setTimeout(() => {
        if (typeof LightweightCharts !== 'undefined') {
            window.tradingChart = new TradingChart();
            console.log('Trading chart initialized');
        } else {
            console.error('LightweightCharts library not loaded');
            // Показываем простой график как запасной вариант
            createSimpleChart();
        }
    }, 500);
});

// Простой запасной график на Canvas
function createSimpleChart() {
    const chartContainer = document.getElementById('chart');
    if (!chartContainer) return;
    
    chartContainer.innerHTML = `
        <div style="position: relative; width: 100%; height: 220px;">
            <canvas id="simpleChart" style="width: 100%; height: 100%;"></canvas>
            <div style="position: absolute; top: 10px; left: 10px; color: white; font-size: 12px;">
                <i class="fas fa-info-circle"></i> Используется упрощенный график
            </div>
        </div>
    `;
    
    // Можно добавить простую реализацию на Canvas если нужно
}

// Глобальные функции для обновления
window.updateChart = function() {
    if (window.tradingChart) {
        window.tradingChart.updateChartData();
    }
};

window.updatePrices = function() {
    // Обновление отображения цен
    if (!game || !game.coins) return;
    
    Object.keys(game.coins).forEach(coinName => {
        const priceElement = document.getElementById(`price-${coinName.toLowerCase()}`);
        if (priceElement && game.coins[coinName]) {
            const price = game.coins[coinName].price;
            priceElement.textContent = `$${price.toFixed(8)}`;
            
            // Добавляем анимацию изменения цены
            priceElement.classList.add('price-update');
            setTimeout(() => {
                priceElement.classList.remove('price-update');
            }, 500);
        }
    });
    
    // Обновляем график
    if (window.tradingChart) {
        window.tradingChart.updateChartData();
    }
};

// Функция для добавления маркера сделки
window.addTradeMarker = function(type, price) {
    if (window.tradingChart) {
        const now = Date.now() / 1000;
        window.tradingChart.addTradeMarker(now, price, type);
    }
};
