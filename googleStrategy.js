const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:7dsoJf6uXcQR@ep-bold-brook-a530htw6.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

// First, drop the existing table if it exists and create a new one with correct types
const recreateUsersTable = async () => {
    const dropTableQuery = `DROP TABLE IF EXISTS users;`;
    
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            google_id VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255),
            profile_picture_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    try {
        
        // Then create the new table
        await pool.query(createTableQuery);
        console.log('Created new users table with correct types');
    } catch (error) {
        console.error('Error recreating users table:', error);
        throw error;
    }
};

// Initialize the table
recreateUsersTable().catch(console.error);

// Function to upsert user data
const upsertUser = async (profile) => {
    const {
        id: googleId,
        emails,
        displayName,
        photos
    } = profile;

    const email = emails[0].value;
    const profilePictureUrl = photos[0]?.value || null;

    const upsertQuery = `
        INSERT INTO users (google_id, email, display_name, profile_picture_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (google_id) 
        DO UPDATE SET 
            email = EXCLUDED.email,
            display_name = EXCLUDED.display_name,
            profile_picture_url = EXCLUDED.profile_picture_url,
            last_login = CURRENT_TIMESTAMP
        RETURNING *;
    `;

    try {
        const result = await pool.query(upsertQuery, [
            googleId.toString(), // Convert to string explicitly
            email,
            displayName,
            profilePictureUrl
        ]);
        return result.rows[0];
    } catch (error) {
        console.error('Error upserting user:', error);
        throw error;
    }
};

// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user.id); // Using the database ID
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google Strategy with database integration
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const user = await upsertUser(profile);
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

module.exports = passport;