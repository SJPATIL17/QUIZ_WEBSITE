const Redis = require('ioredis');

let redisClient = null;

const connectRedis = () => {
  if (redisClient) return redisClient;

  redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisClient.on('connect', () => console.log('✅ Redis Connected'));
  redisClient.on('error', (err) => console.error('❌ Redis Error:', err.message));

  return redisClient;
};

const getRedis = () => {
  if (!redisClient) return connectRedis();
  return redisClient;
};

module.exports = { connectRedis, getRedis };
