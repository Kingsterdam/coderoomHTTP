
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

require('dotenv').config();

const app = express();

app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        }
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use('/auth', authRoutes);
app.use('/code', codeRoutes);
app.use('/send-invite', inviteRoutes);

const PORT = 9090;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

process.on('SIGINT', async () => {
    await redisClient.quit();
    console.log('Redis client disconnected');
    process.exit(0);
});
