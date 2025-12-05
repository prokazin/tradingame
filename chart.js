// Управление графиком
class TradingChart {
    constructor() {
        this.chart = null;
        this.candleSeries = null;
        this.lineSeries = null;
        this.markers = [];
        
        this.initChart();
    }
    
    initChart() {
        const chartContainer = document.getElementById('chart');
        if (!chartContainer) return;
        
        try {
            // Создаем график
            this.chart = LightweightCharts.createChart(chartContainer, {
                width: chartContainer.clientWidth,
                height: chartContainer.clientHeight,
                layout: {
                    backgroundColor: 'transparent',
                    textColor: '#D9D9D9',
                },
                grid: {
                    vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                    horzLines: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                rightPriceScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                timeScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    timeVisible: true,
                    secondsVisible: true,
                },
                crosshair: {
                    mode: LightweightCharts.CrosshairMode.Normal,
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
            });
            
            // Обновление при изменении размера
            window.addEventListener('resize', () => {
                this.chart.applyOptions({
                    width: chartContainer.clientWidth,
                    height: chartContainer.clientHeight
                });
            });
            
            // Запускаем обновление
            this.updateChartData();
            setInterval(() => this.updateChartData(), 1000);
            
        } catch (error) {
            console.error('Ошибка инициализации графика:', error);
        }
    }
    
    updateChartData() {
        if (!game || !game.currentCoin || !game.coins[game.currentCoin]) return;
        
        const coin = game.coins[game.currentCoin];
        const history = coin.history;
        
        if (!history || history.length === 0) return;
        
        try {
            // Получаем последние 60 точек (60 секунд)
            const recentHistory = history.slice(-60);
            
            // Создаем свечи (каждая секунда)
            const candles = [];
            for (let i = 0; i < recentHistory.length; i++) {
                const point = recentHistory[i];
                candles.push({
                    time: point.time,
                    open: point.value,
                    high: point.value,
                    low: point.value,
                    close: point.value
                });
            }
            
            // Обновляем данные
            this.candleSeries.setData(candles);
            
            // Добавляем маркеры позиций
            this.updatePositionMarkers();
            
            // Автомасштабирование
            this.chart.timeScale().fitContent();
            
        } catch (error) {
            console.error('Ошибка обновления графика:', error);
        }
    }
    
    updatePositionMarkers() {
        if (!this.candleSeries) return;
        
        // Очищаем старые маркеры
        this.markers.forEach(marker => {
            try { this.candleSeries.removePriceLine(marker); } catch(e) {}
        });
        this.markers = [];
        
        if (!game || !game.positions) return;
        
        const positions = game.positions.filter(p => p.coin === game.currentCoin);
        
        positions.forEach(position => {
            try {
                // Цена входа
                const entryLine = this.candleSeries.createPriceLine({
                    price: position.entryPrice,
                    color: position.type === 'LONG' ? '#26a69a' : '#ef5350',
                    lineWidth: 2,
                    lineStyle: 0,
                    title: `${position.type} @ ${position.entryPrice.toFixed(8)}`
                });
                this.markers.push(entryLine);
                
                // Стоп-лосс
                if (position.stopLoss) {
                    const stopLossLine = this.candleSeries.createPriceLine({
                        price: position.stopLoss,
                        color: '#ff9500',
                        lineWidth: 1,
                        lineStyle: 2,
                        title: `SL: ${position.stopLoss.toFixed(8)}`
                    });
                    this.markers.push(stopLossLine);
                }
                
                // Тейк-профит
                if (position.takeProfit) {
                    const takeProfitLine = this.candleSeries.createPriceLine({
                        price: position.takeProfit,
                        color: '#26a69a',
                        lineWidth: 1,
                        lineStyle: 2,
                        title: `TP: ${position.takeProfit.toFixed(8)}`
                    });
                    this.markers.push(takeProfitLine);
                }
                
                // Ликвидация
                if (position.liquidationPrice) {
                    const liquidationLine = this.candleSeries.createPriceLine({
                        price: position.liquidationPrice,
                        color: '#ff3b30',
                        lineWidth: 1,
                        lineStyle: 3,
                        title: `Ликв: ${position.liquidationPrice.toFixed(8)}`
                    });
                    this.markers.push(liquidationLine);
                }
                
            } catch (error) {
                console.error('Ошибка добавления маркера:', error);
            }
        });
    }
    
    setCoin(coinName) {
        this.updateChartData();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof LightweightCharts !== 'undefined') {
            window.tradingChart = new TradingChart();
        }
    }, 500);
});

// Глобальные функции
window.updateChart = function() {
    if (window.tradingChart) {
        window.tradingChart.updateChartData();
    }
};

window.updatePrices = function() {
    if (!game || !game.coins) return;
    
    Object.keys(game.coins).forEach(coinName => {
        const priceElement = document.getElementById(`price-${coinName.toLowerCase()}`);
        if (priceElement && game.coins[coinName]) {
            priceElement.textContent = `$${game.coins[coinName].price.toFixed(8)}`;
        }
    });
    
    if (window.tradingChart) {
        window.tradingChart.updateChartData();
    }
};

window.addTradeMarker = function(type, price) {
    if (window.tradingChart && window.tradingChart.candleSeries) {
        try {
            const marker = window.tradingChart.candleSeries.createPriceLine({
                price: price,
                color: type === 'LONG' ? 'rgba(76, 217, 100, 0.5)' : 'rgba(255, 59, 48, 0.5)',
                lineWidth: 1,
                lineStyle: 0
            });
            
            window.tradingChart.markers.push(marker);
            
            setTimeout(() => {
                try {
                    window.tradingChart.candleSeries.removePriceLine(marker);
                    const index = window.tradingChart.markers.indexOf(marker);
                    if (index > -1) window.tradingChart.markers.splice(index, 1);
                } catch(e) {}
            }, 10000);
            
        } catch (error) {
            console.error('Ошибка добавления маркера сделки:', error);
        }
    }
};
