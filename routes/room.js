const { Router, json } = require('express');
const { Pool } = require('pg');
const roomRouter = Router();

roomRouter.use(json());

// PostgreSQL Pool Configuration
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:7dsoJf6uXcQR@ep-bold-brook-a530htw6.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

// GET: Fetch all rooms
roomRouter.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM room;');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching rooms:', error.message);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// POST: Insert a new room
roomRouter.post('/', async (req, res) => {
    const { room_id } = req.body;

    if (!room_id) {
        return res.status(400).json({ error: 'room_id is required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO room (room_id) VALUES ($1) RETURNING *;',
            [room_id]
        );
        res.status(201).json(result.rows[0]); // Return the inserted room
    } catch (error) {
        console.error('Error inserting room:', error.message);
        res.status(500).json({ error: 'Failed to insert room' });
    }
});

roomRouter.patch('/:room_id/increment', async (req, res) => {
    const { room_id } = req.params;
    console.log("Member increment api is called")
    try {
        // Increment the 'Members' column by 1 for the specified room_id
        const result = await pool.query(
            'UPDATE room SET "Members" = "Members" + 1 WHERE room_id = $1 RETURNING *;',
            [room_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.status(200).json({
            message: 'Members count incremented successfully',
            updatedRoom: result.rows[0],
        });
    } catch (error) {
        console.error('Error incrementing members count:', error.message);
        res.status(500).json({ error: 'Failed to increment members count' });
    }
});

roomRouter.patch('/:room_id/decrement', async (req, res) => {
    const { room_id } = req.params;

    try {
        // Increment the 'Members' column by 1 for the specified room_id
        const result = await pool.query(
            'UPDATE room SET "Members" = "Members" - 1 WHERE room_id = $1 RETURNING *;',
            [room_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.status(200).json({
            message: 'Members count incremented successfully',
            updatedRoom: result.rows[0],
        });
    } catch (error) {
        console.error('Error decrementing members count:', error.message);
        res.status(500).json({ error: 'Failed to decrement members count' });
    }
});



roomRouter.delete('/:room_id', async (req, res) => {
    const { room_id } = req.params;

    try {
        const result = await pool.query('DELETE FROM room WHERE room_id = $1 RETURNING *;', [room_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.status(200).json({ message: 'Room deleted successfully', deletedRoom: result.rows[0] });
    } catch (error) {
        console.error('Error deleting room:', error.message);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});
module.exports = {
    roomRouter,
};
