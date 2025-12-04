#!/usr/bin/env node

/**
 * Queue Management CLI
 * 
 * Usage:
 *   node scripts/manageQueue.js stats           - Show queue statistics
 *   node scripts/manageQueue.js retry           - Retry all failed jobs
 *   node scripts/manageQueue.js cleanup         - Remove permanently failed jobs
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/database');
const { retryFailedJobs, cleanupPermanentlyFailedJobs, getQueueStats } = require('../utils/queueUtils');
const redisClient = require('../config/redis');

const command = process.argv[2];

const main = async () => {
  try {
    // Connect to database
    console.log('📦 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    switch (command) {
      case 'stats':
        await getQueueStats();
        break;

      case 'retry':
        await retryFailedJobs();
        break;

      case 'cleanup':
        await cleanupPermanentlyFailedJobs();
        await getQueueStats();
        break;

      default:
        console.log('❌ Invalid command\n');
        console.log('Available commands:');
        console.log('  stats   - Show queue statistics');
        console.log('  retry   - Retry all failed jobs');
        console.log('  cleanup - Remove permanently failed jobs\n');
        console.log('Usage: node scripts/manageQueue.js <command>\n');
        process.exit(1);
    }

    // Close connections
    await redisClient.quit();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main();
