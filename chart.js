// Управление графиком TradingView
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
        
        this.initChart();
    }
    
    initChart() {
        const chartContainer = document.getElementById('chart');
        if (!chartContainer) return;
        
        // Создаем график
        this.chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 220,
            layout: {
                backgroundColor: 'transparent',
                textColor: '#D9D9D9',
            },
            grid: {
                vertLines: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                horzLines: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
        });
        
        // Создаем свечной ряд
        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#4cd964',
            downColor: '#ff3b30',
            borderDownColor: '#ff3b30',
            borderUpColor: '#4cd964',
            wickDownColor: '#ff3b30',
            wickUpColor: '#4cd964',
        });
        
        // Создаем линейный ряд для дополнительных линий
        this.lineSeries = this.chart.addLineSeries({
            color: 'rgba(56, 128, 255, 0.5)',
            lineWidth: 1,
            lineStyle: 2, // Пунктир
        });
        
        // Обновляем график при изменении размера окна
        window.addEventListener('resize', () => {
            this.chart.applyOptions({
                width: chartContainer.clientWidth,
            });
        });
        
        // Загружаем данные
        this.updateChart();
    }
    
    updateChart() {
        if (!game || !game.coins[game.currentCoin]) return;
        
        const coin = game.coins[game.currentCoin];
        const history = coin.history;
        
        // Преобразуем данные в формат свечей
        const candles = this.createCandlesFromHistory(history, this.currentTimeframe);
        
        // Устанавливаем данные
        this.candleSeries.setData(candles);
        
        // Добавляем маркеры для открытых позиций
        this.updatePositionMarkers();
        
        // Добавляем линии стоп-лосса и тейк-профита
        this.updateOrderLines();
        
        // Масштабируем график
        this.chart.timeScale().fitContent();
    }
    
    createCandlesFromHistory(history, timeframe) {
        if (history.length === 0) return [];
        
        const timeframeMs = this.getTimeframeMs(timeframe);
        const candles = [];
        let currentCandle = null;
        let candleStartTime = null;
        
        history.forEach(point => {
            const pointTime = point.time * 1000; // В миллисекундах
            
            if (!candleStartTime || pointTime >= candleStartTime + timeframeMs) {
                // Закрываем предыдущую свечу
                if (currentCandle) {
                    currentCandle.close = currentCandle.low; // Временно
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
                currentCandle.high = Math.max(currentCandle.high, point.value);
                currentCandle.low = Math.min(currentCandle.low, point.value);
                currentCandle.close = point.value;
            }
        });
        
        // Добавляем последнюю свечу
        if (currentCandle) {
            candles.push(currentCandle);
        }
        
        return candles;
    }
    
    getTimeframeMs(timeframe) {
        switch(timeframe) {
            case '1m': return 60000;
            case '5m': return 300000;
            case '15m': return 900000;
            case '1h': return 3600000;
            default: return 60000;
        }
    }
    
    updatePositionMarkers() {
        // Очищаем старые маркеры
        this.markers.forEach(marker => {
            this.candleSeries.removePriceLine(marker);
        });
        this.markers = [];
        
        // Добавляем маркеры для текущих позиций по выбранной монете
        const positions = game.positions.filter(p => p.coin === game.currentCoin);
        
        positions.forEach(position => {
            const color = position.type === 'LONG' ? '#4cd964' : '#ff3b30';
            const lineStyle = position.type === 'LONG' ? 0 : 2; // 0 = сплошная, 2 = пунктир
            
            // Линия цены входа
            const entryLine = {
                price: position.entryPrice,
                color: color,
                lineWidth: 2,
                lineStyle: lineStyle,
                axisLabelVisible: true,
                title: `${position.type} @ ${position.entryPrice.toFixed(8)}`
            };
            
            this.markers.push(entryLine);
            this.candleSeries.createPriceLine(entryLine);
            
            // Линия стоп-лосса
            if (position.stopLoss) {
                const stopLossLine = {
                    price: position.stopLoss,
                    color: '#ff9500',
                    lineWidth: 1,
                    lineStyle: 2, // Пунктир
                    axisLabelVisible: true,
                    title: `SL: ${position.stopLoss.toFixed(8)}`
                };
                
                this.markers.push(stopLossLine);
                this.candleSeries.createPriceLine(stopLossLine);
            }
            
            // Линия тейк-профита
            if (position.takeProfit) {
                const takeProfitLine = {
                    price: position.takeProfit,
                    color: '#4cd964',
                    lineWidth: 1,
                    lineStyle: 2, // Пунктир
                    axisLabelVisible: true,
                    title: `TP: ${position.takeProfit.toFixed(8)}`
                };
                
                this.markers.push(takeProfitLine);
                this.candleSeries.createPriceLine(takeProfitLine);
            }
        });
    }
    
    updateOrderLines() {
        // Очищаем старые линии
        if (this.entryLine) {
            this.lineSeries.removePriceLine(this.entryLine);
        }
        if (this.stopLossLine) {
            this.lineSeries.removePriceLine(this.stopLossLine);
        }
        if (this.takeProfitLine) {
            this.lineSeries.removePriceLine(this.takeProfitLine);
        }
        
        // Добавляем линии для планируемой сделки
        const currentPrice = game.coins[game.currentCoin].price;
        const stopLossPercent = game.stopLoss;
        const takeProfitPercent = game.takeProfit;
        
        // Цена входа (текущая цена)
        this.entryLine = this.lineSeries.createPriceLine({
            price: currentPrice,
            color: 'rgba(56, 128, 255, 0.8)',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: 'Текущая цена'
        });
        
        // Стоп-лосс
        const stopLossPrice = currentPrice * (1 - stopLossPercent / 100);
        this.stopLossLine = this.lineSeries.createPriceLine({
            price: stopLossPrice,
            color: 'rgba(255, 149, 0, 0.8)',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `Стоп-лосс: -${stopLossPercent}%`
        });
        
        // Тейк-профит
        const takeProfitPrice = currentPrice * (1 + takeProfitPercent / 100);
        this.takeProfitLine = this.lineSeries.createPriceLine({
            price: takeProfitPrice,
            color: 'rgba(76, 217, 100, 0.8)',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `Тейк-профит: +${takeProfitPercent}%`
        });
    }
    
    // Обновить таймфрейм
    setTimeframe(timeframe) {
        this.currentTimeframe = timeframe;
        this.updateChart();
    }
    
    // Обновить монету
    setCoin(coinName) {
        this.updateChart();
    }
}

// Инициализация графика после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    window.tradingChart = new TradingChart();
});

// Глобальные функции для обновления
window.updateChart = function() {
    if (window.tradingChart) {
        window.tradingChart.updateChart();
    }
};

window.updatePrices = function() {
    // Обновление отображения цен
    Object.keys(game.coins).forEach(coinName => {
        const priceElement = document.getElementById(`price-${coinName.toLowerCase()}`);
        if (priceElement) {
            const price = game.coins[coinName].price;
            priceElement.textContent = `$${price.toFixed(8)}`;
        }
    });
    
    // Обновление графика
    if (window.tradingChart) {
        window.tradingChart.updateChart();
    }
};
