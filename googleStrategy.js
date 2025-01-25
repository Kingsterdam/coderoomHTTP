const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const { Pool } = require('pg');
const redisClient = require('./redisClient');
// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user.id); // Using the database ID
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
    done(null, user);
});

// PostgreSQL Pool Configuration
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:7dsoJf6uXcQR@ep-bold-brook-a530htw6.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

const addUserToCodeRoom = async (profile) => {
    if (!profile || !profile.id || !profile.emails || !profile.displayName || !profile.photos) {
        throw new Error('Invalid profile data');
    }

    const user = {
        google_id: profile.id,
        email: profile.emails[0].value,
        display_name: profile.displayName,
        profile_picture_url: profile.photos[0].value,
    };

    const str = JSON.stringify(user); // Properly serialize the object
    try {
        await redisClient.sAdd('CodeRoomUsers', str); // Add JSON string to Redis set
        console.log(`User ${str} added to CodeRoomUsers`);
    } catch (error) {
        console.error('Error adding user to CodeRoomUsers:', error);
    }
};


const pushToDB = async (profile) => {
    const google_id = profile.id;
    const email = profile.emails[0].value;
    const display_name = profile.displayName;
    const profile_picture_url = profile.photos[0].value;
    try {
        const result = await pool.query(
            `
            INSERT INTO users (google_id, email, display_name, profile_picture_url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (google_id) 
            DO UPDATE SET 
                email = EXCLUDED.email,
                display_name = EXCLUDED.display_name,
                profile_picture_url = EXCLUDED.profile_picture_url
            RETURNING *;
            `,
            [google_id, email, display_name, profile_picture_url]
        );
        return result.rows[0]; // Return the inserted user
    } catch (error) {
        console.error(error);
        throw error; // Rethrow the error for the caller to handle
    }
};


passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            // Save user info or handle login
            console.log(profile)
            await pushToDB(profile)
            await addUserToCodeRoom(profile)
            return done(null, profile);
        }
    )
);

module.exports = passport;