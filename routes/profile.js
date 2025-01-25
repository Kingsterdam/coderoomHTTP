const { Router, json } = require('express');
const redisClient = require('../redisClient');
const profileRouter = Router();

profileRouter.use(json());

profileRouter.get('/:email', async (req, res) => {
    const { email } = req.params;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const allUsers = await redisClient.SMEMBERS('CodeRoomUsers');

        const matchingUser = allUsers
            .map(user => {
                try {
                    return JSON.parse(user);
                } catch {
                    return user;
                }
            })
            .find(user => user.email === email || user === email);

        if (!matchingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(matchingUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = profileRouter;
