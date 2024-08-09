const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// MySQL connection pool setup
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'sql12.freesqldatabase.com',
    user: 'sql12725007',
    password: 'kXysuqUgZc',
    database: 'sql12725007'
});

// Middleware configuration
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
}));

// File upload setup
const upload = multer({ dest: 'uploads/' });

// Root route
app.get('/', (req, res) => {
    if (!req.session.user_id) {
        res.redirect('/login');
    } else {
        res.redirect('/public');
    }
});

// Login Routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    pool.query('SELECT id, password, role FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const user = results[0];
            bcrypt.compare(password, user.password, (err, match) => {
                if (err) throw err;
                if (match) {
                    req.session.user_id = user.id;
                    req.session.role = user.role;
                    if (user.role === 'user') {
                        res.redirect('/public');
                    } else {
                        res.redirect('/admin');
                    }
                } else {
                    res.send('Invalid password.');
                }
            });
        } else {
            res.send('No user found with that username.');
        }
    });
});

// Signup Routes
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.post('/signup', upload.single('profile_pic'), (req, res) => {
    const { full_name, username, password, email } = req.body;
    const profile_pic = req.file ? req.file.path : '';

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;
        pool.query('INSERT INTO users (full_name, username, password, email, profile_pic) VALUES (?, ?, ?, ?, ?)', 
            [full_name, username, hashedPassword, email, profile_pic], 
            (err, results) => {
                if (err) throw err;
                res.send("Signup successful! You can now <a href='/login'>login</a>.");
            }
        );
    });
});

// Change Password Routes
app.get('/change_password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'change_password.html'));
});

app.post('/change_password', (req, res) => {
    const { username, old_password, new_password } = req.body;

    if (!req.session.user_id) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    pool.query('SELECT password FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const hashedPassword = results[0].password;

        bcrypt.compare(old_password, hashedPassword, (err, match) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            if (!match) return res.status(400).json({ message: 'Incorrect old password' });

            bcrypt.hash(new_password, 10, (err, hashedNewPassword) => {
                if (err) return res.status(500).json({ message: 'Server error' });

                pool.query('UPDATE users SET password = ? WHERE username = ?', [hashedNewPassword, username], (err, results) => {
                    if (err) return res.status(500).json({ message: 'Database error' });
                    res.json({ message: 'Password changed successfully!' });
                });
            });
        });
    });
});

// Game Routes
let adminControl = 'random'; // Default to 'random'

app.get('/public', (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/check', async (req, res) => {
    let win;

    if (adminControl === 'random') {
        win = Math.random() >= 0.5; // Randomly decide win or lose
    } else {
        win = adminControl === 'win';
    }

    // Log the outcome to the database
    try {
        await pool.query('INSERT INTO game_logs (outcome, timestamp) VALUES (?, NOW())', [win ? 'win' : 'lose']);
    } catch (err) {
        console.error('Database error:', err);
    }

    res.json({ win });
});

app.post('/admin', async (req, res) => {
    adminControl = req.body.mode;
    res.status(200).send();
});

app.get('/admin', (req, res) => {
    if (!req.session.user_id || req.session.role !== 'admin') {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

app.get('/admin/current', (req, res) => {
    res.json({ mode: adminControl });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
