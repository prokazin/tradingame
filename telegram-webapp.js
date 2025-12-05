// Интеграция с Telegram Web App
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, находимся ли мы в Telegram
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        
        // Инициализируем Web App
        tg.ready();
        tg.expand(); // Разворачиваем на весь экран
        
        // Устанавливаем тему Telegram
        applyTelegramTheme(tg);
        
        // Обработчик изменения темы
        tg.onEvent('themeChanged', function() {
            applyTelegramTheme(tg);
        });
        
        // Обработчик изменения viewport
        tg.onEvent('viewportChanged', function() {
            // Можно добавить адаптацию под изменение размера
        });
        
        // Получаем данные пользователя
        const user = tg.initDataUnsafe.user;
        if (user) {
            // Можно использовать данные пользователя
            console.log('Пользователь Telegram:', user);
            
            // Можно обновить имя в рейтинге
            if (game.players[game.players.length - 1]) {
                game.players[game.players.length - 1].name = user.first_name || 'Игрок';
            }
        }
        
        // Настраиваем кнопку назад
        tg.BackButton.isVisible = false;
        
        // Закрытие приложения
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                tg.close();
            }
        });
        
        // Добавляем кнопку выхода
        addTelegramExitButton(tg);
    } else {
        // Если не в Telegram, показываем обычную версию
        console.log('Запущено вне Telegram');
    }
});

// Применение темы Telegram
function applyTelegramTheme(tg) {
    const theme = tg.colorScheme;
    const bgColor = theme === 'dark' ? '#0f2027' : '#ffffff';
    const textColor = theme === 'dark' ? '#ffffff' : '#000000';
    
    document.body.style.background = theme === 'dark' 
        ? 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)'
        : 'linear-gradient(135deg, #f5f7fa, #c3cfe2)';
    
    document.body.style.color = textColor;
    
    // Обновляем контейнер
    const container = document.querySelector('.container');
    if (container) {
        container.style.background = theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)';
        container.style.color = textColor;
    }
}

// Добавление кнопки выхода для Telegram
function addTelegramExitButton(tg) {
    const exitButton = document.createElement('button');
    exitButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выход';
    exitButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(255, 59, 48, 0.2);
        color: #ff3b30;
        border: 1px solid #ff3b30;
        border-radius: 20px;
        padding: 10px 15px;
        font-size: 14px;
        cursor: pointer;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    exitButton.addEventListener('click', function() {
        tg.close();
    });
    
    document.body.appendChild(exitButton);
}

// Функция для отправки данных в Telegram (если нужно)
function sendDataToTelegram(data) {
    if (window.Telegram && Telegram.WebApp) {
        // Отправляем данные в Telegram
        Telegram.WebApp.sendData(JSON.stringify(data));
        return true;
    }
    return false;
}
