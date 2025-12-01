const redisClient = require('../config/redis');
const logger = require('../config/logger');

class CacheService {
  /**
   * Set cache with expiration
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = 3600) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await redisClient.setex(key, ttl, stringValue);
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error(`Cache set error: ${error.message}`);
    }
  }

  /**
   * Get cache value
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete cache key
   * @param {string} key - Cache key
   */
  async delete(key) {
    try {
      await redisClient.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error: ${error.message}`);
    }
  }

  /**
   * Delete multiple cache keys by pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   */
  async deletePattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Cache pattern deleted: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error: ${error.message}`);
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key) {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error: ${error.message}`);
      return -2;
    }
  }

  /**
   * Increment a counter
   * @param {string} key - Cache key
   * @param {number} increment - Amount to increment (default 1)
   * @returns {Promise<number>} New value
   */
  async increment(key, increment = 1) {
    try {
      return await redisClient.incrby(key, increment);
    } catch (error) {
      logger.error(`Cache increment error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      await redisClient.flushdb();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error(`Cache clear error: ${error.message}`);
    }
  }
}

module.exports = new CacheService();
