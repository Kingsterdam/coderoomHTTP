const { Router, json } = require('express');
const { Pool } = require('pg');
const messageRouter = Router();

messageRouter.use(json());

// PostgreSQL Pool Configuration
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:7dsoJf6uXcQR@ep-bold-brook-a530htw6.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

messageRouter.get('/test', (req, res) => {
    res.json({ message: 'Message router is working' });
});

// Add logging middleware
messageRouter.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// POST: Store a new message
messageRouter.post('/', async (req, res) => {
    const { room_id, message_type, username, message_text, user_email } = req.body;

    // Validate required fields
    if (!room_id || !message_type || !username) {
        return res.status(400).json({ 
            error: 'room_id, message_type, and username are required' 
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO messages 
            (room_id, message_type, username, message_text, user_email) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *;`,
            [room_id, message_type, username, message_text, user_email]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error storing message:', error.message);
        res.status(500).json({ error: 'Failed to store message' });
    }
});


// GET: Fetch all messages for a specific room
messageRouter.get('/room/:room_id', async (req, res) => {
    const { room_id } = req.params;
    
    try {
        const result = await pool.query(
            'SELECT * FROM messages WHERE room_id = $1 ORDER BY sent_at ASC;',
            [room_id]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching messages:', error.message);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// GET: Fetch messages within a date range for a room
messageRouter.get('/room/:room_id/date-range', async (req, res) => {
    const { room_id } = req.params;
    const { start_date, end_date } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM messages 
            WHERE room_id = $1 
            AND sent_at BETWEEN $2 AND $3 
            ORDER BY sent_at ASC;`,
            [room_id, start_date, end_date]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching messages by date range:', error.message);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// DELETE: Delete a specific message
messageRouter.delete('/:message_id', async (req, res) => {
    const { message_id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM messages WHERE message_id = $1 RETURNING *;',
            [message_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.status(200).json({ 
            message: 'Message deleted successfully', 
            deletedMessage: result.rows[0] 
        });
    } catch (error) {
        console.error('Error deleting message:', error.message);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// GET: Get latest messages for a room (with limit)
messageRouter.get('/room/:room_id/latest', async (req, res) => {
    const { room_id } = req.params;
    const limit = parseInt(req.query.limit) || 50; // Default to 50 messages

    try {
        const result = await pool.query(
            `SELECT * FROM messages 
            WHERE room_id = $1 
            ORDER BY sent_at DESC 
            LIMIT $2;`,
            [room_id, limit]
        );
        res.status(200).json(result.rows.reverse()); // Reverse to get chronological order
    } catch (error) {
        console.error('Error fetching latest messages:', error.message);
        res.status(500).json({ error: 'Failed to fetch latest messages' });
    }
});

module.exports = {
    messageRouter,
};