
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const redisClient = require('./redisClient');
const authRoutes = require('./routes/authRoutes');
const codeRoutes = require('./routes/codeRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const session = require('express-session');
require('./googleStrategy');
const passport = require('passport');
const { roomRouter } = require('./routes/room');
const { messageRouter } = require('./routes/messageRouter');

const { Pool } = require('pg');
const profileRouter = require('./routes/profile');

require('dotenv').config();

const app = express();
app.set('strict routing', true);
// Database Configuration
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:7dsoJf6uXcQR@ep-bold-brook-a530htw6.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',  // `true` for production, `false` for development
            httpOnly: true, // Ensures cookie is not accessible via JavaScript (helps prevent XSS attacks)
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        }
    })
);

// Test Database Connection
pool.connect()
    .then(client => {
        console.log('Connected to PostgreSQL');
        client.release();
    })
    .catch(err => console.error('Database connection error:', err.stack));

// Example Query (Optional, for Testing)
app.get('/api/v1/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()'); // Example query to test connection
        res.status(200).json({ message: 'Database connected successfully', time: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Database query error', error: error.message });
    }
});

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use('/auth', authRoutes);
app.use('/code', codeRoutes);
app.use('/send-invite', inviteRoutes);
app.use('/api/messages', messageRouter);
app.use('/api/v1/room', roomRouter);
app.use('/profile', profileRouter)


// Add this after all your routes in server.js
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = 9090;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

process.on('SIGINT', async () => {
    await redisClient.quit();
    console.log('Redis client disconnected');
    process.exit(0);
});
