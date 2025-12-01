const Redis = require('ioredis');
const logger = require('./logger');

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Add password if provided
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

// Add TLS ONLY if explicitly enabled (for cloud Redis like Upstash, Redis Cloud, etc.)
// For local Redis, set REDIS_TLS=false or remove it from .env
if (process.env.REDIS_TLS === 'true') {
  logger.info('Redis TLS enabled');
  redisConfig.tls = {
    rejectUnauthorized: false,
  };
}

// Create Redis client
const redisClient = new Redis(redisConfig);

// Event handlers
redisClient.on('connect', () => {
  logger.info(`Redis client connected to ${redisConfig.host}:${redisConfig.port}`);
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
  logger.error(`Redis client error: ${err.message}`);
  // Don't exit on Redis errors, let the app handle it
});

redisClient.on('close', () => {
  logger.warn('Redis client connection closed');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.quit();
  logger.info('Redis connection closed through app termination');
});

module.exports = redisClient;

