const { createClient } = require('redis');
const redis = require('redis');

const redisClient = createClient({
    url: 'redis://localhost:6379'
});

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis successfully');
    } catch (err) {
        console.error('Redis connection error:', err);
        process.exit(1);
    }
})();

// Add error handling for Redis
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
    console.log('Redis Client Ready');
});

redisClient.on('end', () => {
    console.log('Redis Client Connection Ended');
});

module.exports = redisClient;
