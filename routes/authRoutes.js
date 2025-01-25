const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const session = require('express-session');  // Changed from cookie-session
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const redis = require('redis');
const redisClient = require('../redisClient');
require('dotenv').config();
const passport = require('../googleStrategy');
const router = express.Router();

const removeUserFromCodeRoom = async (email) => {
    if (!email) {
        throw new Error('Email is required to remove a user');
    }

    try {
        // Get all users from the Redis set
        const users = await redisClient.sMembers('CodeRoomUsers');

        for (const userStr of users) {
            try {
                const user = JSON.parse(userStr); // Attempt to parse JSON string

                if (user.email === email) {
                    console.log(user)
                    // Remove the matching user from the Redis set
                    await redisClient.sRem('CodeRoomUsers', userStr);
                    console.log(`User with email ${email} removed from CodeRoomUsers`);
                    return;
                }
            } catch (parseError) {
                console.warn(`Skipping invalid entry in CodeRoomUsers: ${userStr}`);
            }
        }

        console.log(`No user with email ${email} found in CodeRoomUsers`);
    } catch (error) {
        console.error('Error removing user from CodeRoomUsers:', error);
    }
};




// Middleware to validate session and authenticate user
function authenticateSession(req, res, next) {
    if (req.isAuthenticated()) {
        // If the session is valid and the user is authenticated
        return next();
    }
    // If session is invalid or user is not authenticated, return error
    res.status(401).json({ error: 'Not authenticated' });
}

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/auth/failure',
    successRedirect: 'http://localhost:3000',
}));
router.get('/logout', async (req, res) => {
    const email = req.user._json.email
    console.log("request: ", email)
    req.logout(async (err) => {
        if (err) return res.status(500).send({ error: err });
        res.clearCookie('connect.sid');
        await removeUserFromCodeRoom(email)
        res.status(200).send({ message: 'Logged out successfully' });
    });
});
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.send({ user: req.user });
    } else {
        res.status(401).send({ error: 'Not authenticated' });
    }
});

module.exports = router;
