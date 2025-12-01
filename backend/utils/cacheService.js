const redisClient = require('../config/redis');
const logger = require('../config/logger');

class CacheService {
  /**
   * Set cache value with TTL
   * Uses modern Redis syntax: SET key value EX ttl
   */
  async set(key, value, ttl = 3600) {
    try {
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);

      await redisClient.set(key, stringValue, "EX", ttl);
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error(`Cache set error: ${error.message}`);
    }
  }

  /**
   * Store JSON value safely
   */
  async setJSON(key, object, ttl = 3600) {
    try {
      await redisClient.set(key, JSON.stringify(object), "EX", ttl);
      logger.debug(`Cache (JSON) set: ${key}`);
    } catch (error) {
      logger.error(`Cache JSON set error: ${error.message}`);
    }
  }

  /**
   * Get cache value (auto-JSON parse)
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
   * Delete a single key
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
   * SAFELY scan keys (replaces KEYS command)
   */
  async scanKeys(pattern) {
    let cursor = "0";
    let keys = [];

    try {
      do {
        const reply = await redisClient.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = reply[0];
        keys.push(...reply[1]);
      } while (cursor !== "0");

      return keys;
    } catch (error) {
      logger.error(`Cache SCAN error: ${error.message}`);
      return [];
    }
  }

  /**
   * Delete multiple keys safely using SCAN
   */
  async deletePattern(pattern) {
    try {
      const keys = await this.scanKeys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Deleted ${keys.length} keys for pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache deletePattern error: ${error.message}`);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      logger.error(`Cache exists error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get key TTL
   */
  async ttl(key) {
    try {
      return await redisClient.ttl(key); // returns seconds
    } catch (error) {
      logger.error(`Cache TTL error: ${error.message}`);
      return -2; // -2 means key does not exist
    }
  }

  /**
   * Increment counter
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
   * Set key only if not exists (NX)
   * Useful for locks, preventing duplicate jobs, rate limiting
   */
  async setIfNotExists(key, value = "1", ttl = 60) {
    try {
      return await redisClient.set(key, value, "NX", "EX", ttl);
    } catch (error) {
      logger.error(`Cache setIfNotExists error: ${error.message}`);
      return null;
    }
  }

  /**
   * Atomic operations (MULTI)
   */
  multi() {
    return redisClient.multi();
  }

  /**
   * Clear entire Redis DB (not recommended in production)
   */
  async clear() {
    try {
      await redisClient.flushdb();
      logger.info("Cache cleared");
    } catch (error) {
      logger.error(`Cache clear error: ${error.message}`);
    }
  }
}

module.exports = new CacheService();
