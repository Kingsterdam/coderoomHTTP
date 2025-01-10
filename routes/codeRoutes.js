const express = require('express');
const redisClient = require('../redisClient');
const router = express.Router();

router.get('/fetch/:roomId/:editorId/:language', async (req, res) => {
    const { roomId, editorId, language } = req.params;
    try {
        const code = await redisClient.get(`code:${roomId}:${editorId}:${language}`);
        res.status(code ? 200 : 404).send({ code: code || '' });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.post('/save', async (req, res) => {
    const { roomId, editorId, language, code } = req.body;
    try {
        await redisClient.set(`code:${roomId}:${editorId}:${language}`, code);
        res.status(200).send({ message: 'Code saved successfully!' });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});



module.exports = router;
