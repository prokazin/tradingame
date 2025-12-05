// Управление графиком Lightweight Charts с обновлением каждую секунду
class TradingChart {
    constructor() {
        this.chart = null;
        this.candleSeries = null;
        this.lineSeries = null;
        this.markers = [];
        this.updateInterval = null;
        this.currentCoin = null;
        
        this.initChart();
        this.startRealTimeUpdates();
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
                height: chartContainer.clientHeight,
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
                    secondsVisible: true,
                    fixLeftEdge: true,
                    fixRightEdge: false,
                    tickMarkFormatter: (time) => {
                        const date = new Date(time * 1000);
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        const seconds = date.getSeconds().toString().padStart(2, '0');
                        return `${hours}:${minutes}:${seconds}`;
                    },
                    barSpacing: 2
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
                    vertTouchDrag: false
                },
                handleScale: {
                    axisPressedMouseMove: false,
                    mouseWheel: true,
                    pinch: false
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
            
            // Обновляем график при изменении размера окна
            window.addEventListener('resize', () => {
                this.chart.applyOptions({
                    width: chartContainer.clientWidth,
                    height: chartContainer.clientHeight
                });
            });
            
            // Загружаем начальные данные
            this.updateChartData();
            
            console.log('Chart initialized successfully');
            
        } catch (error) {
            console.error('Error initializing chart:', error);
        }
    }
    
    startRealTimeUpdates() {
        // Обновляем график каждую секунду
        this.updateInterval = setInterval(() => {
            this.updateChartData();
        }, 1000); // 1 секунда
    }
    
    updateChartData() {
        if (!game || !game.coins || !game.currentCoin) {
            return;
        }
        
        const coin = game.coins[game.currentCoin];
        
        if (!coin || !coin.history || coin.history.length === 0) {
            return;
        }
        
        try {
            // Получаем последние 60 точек (1 минута)
            const recentHistory = coin.history.slice(-60);
            
            // Преобразуем в свечи (каждая точка = 1 секунда)
            const candles = this.createCandlesFromHistory(recentHistory, 1000); // 1 секунда
            
            // Обновляем данные графика
            this.candleSeries.setData(candles);
            
            // Добавляем маркеры для открытых позиций
            this.updatePositionMarkers();
            
            // Автомасштабирование
            this.chart.timeScale().fitContent();
            
        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }
    
    createCandlesFromHistory(history, intervalMs) {
        if (!history || history.length < 2) return [];
        
        const candles = [];
        let currentCandle = null;
        let candleStartTime = 0;
        
        // Сортируем по времени
        const sortedHistory = [...history].sort((a, b) => a.time - b.time);
        
        sortedHistory.forEach((point, index) => {
            const pointTime = point.time * 1000; // В миллисекундах
            
            // Если это начало новой свечи
            if (!currentCandle || pointTime >= candleStartTime + intervalMs) {
                // Закрываем предыдущую свечу
                if (currentCandle) {
                    currentCandle.close = currentCandle.close || currentCandle.low;
                    candles.push(currentCandle);
                }
                
                // Начинаем новую свечу
                candleStartTime = Math.floor(pointTime / intervalMs) * intervalMs;
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
            
            // Если это последняя точка, закрываем свечу
            if (index === sortedHistory.length - 1 && currentCandle) {
                candles.push(currentCandle);
            }
        });
        
        return candles;
    }
    
    updatePositionMarkers() {
        if (!this.candleSeries) return;
        
        // Очищаем старые маркеры
        this.markers.forEach(markerId => {
            try {
                this.candleSeries.removePriceLine(markerId);
            } catch (e) {}
        });
        this.markers = [];
        
        // Добавляем маркеры для текущих позиций
        if (!game || !game.positions) return;
        
        const positions = game.positions.filter(p => p.coin === game.currentCoin);
        
        positions.forEach((position) => {
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
                
                // Линия ликвидации
                const liquidationLine = this.candleSeries.createPriceLine({
                    price: position.liquidationPrice,
                    color: '#ff3b30',
                    lineWidth: 1,
                    lineStyle: 3, // Точечная линия
                    axisLabelVisible: true,
                    title: `Ликв: ${position.liquidationPrice.toFixed(8)}`
                });
                this.markers.push(liquidationLine);
                
            } catch (error) {
                console.error('Error adding position marker:', error);
            }
        });
    }
    
    setCoin(coinName) {
        this.currentCoin = coinName;
        this.updateChartData();
    }
    
    // Деструктор для очистки интервала
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Инициализация графика после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing chart...');
    
    // Ждем немного чтобы игра инициализировалась
    setTimeout(() => {
        if (typeof LightweightCharts !== 'undefined') {
            window.tradingChart = new TradingChart();
            console.log('Real-time chart initialized (1 second updates)');
        } else {
            console.error('LightweightCharts library not loaded');
        }
    }, 500);
});

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
            const oldPrice = parseFloat(priceElement.dataset.lastPrice || '0');
            
            // Обновляем только если цена изменилась
            if (Math.abs(price - oldPrice) > 0) {
                priceElement.textContent = `$${price.toFixed(8)}`;
                priceElement.dataset.lastPrice = price;
                
                // Анимация изменения цены
                priceElement.classList.add('price-update');
                setTimeout(() => {
                    priceElement.classList.remove('price-update');
                }, 500);
            }
        }
    });
    
    // Обновляем график
    if (window.tradingChart) {
        window.tradingChart.updateChartData();
    }
};

// Функция для добавления маркера сделки
window.addTradeMarker = function(type, price) {
    if (window.tradingChart && window.tradingChart.candleSeries) {
        try {
            const marker = window.tradingChart.candleSeries.createPriceLine({
                price: price,
                color: type === 'LONG' ? 'rgba(76, 217, 100, 0.5)' : 'rgba(255, 59, 48, 0.5)',
                lineWidth: 1,
                lineStyle: 0,
                axisLabelVisible: false
            });
            
            window.tradingChart.markers.push(marker);
            
            // Автоматически удалим через 10 секунд
            setTimeout(() => {
                try {
                    window.tradingChart.candleSeries.removePriceLine(marker);
                    const index = window.tradingChart.markers.indexOf(marker);
                    if (index > -1) window.tradingChart.markers.splice(index, 1);
                } catch(e) {}
            }, 10000);
            
        } catch (error) {
            console.error('Error adding trade marker:', error);
        }
    }
};
