const { pdfQueue } = require('../queues/pdfQueue');
const PDF = require('../models/PDF');
const logger = require('../config/logger');

/**
 * Retry all failed PDF processing jobs
 */
const retryFailedJobs = async () => {
  try {
    console.log('🔄 Checking for failed jobs...\n');

    // Get all failed jobs from the queue
    const failedJobs = await pdfQueue.getFailed(0, 100);
    
    console.log(`Found ${failedJobs.length} failed jobs in queue\n`);

    if (failedJobs.length === 0) {
      console.log('✅ No failed jobs to retry');
      return;
    }

    let retriedCount = 0;
    let skippedCount = 0;

    for (const job of failedJobs) {
      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts || 3;

      console.log(`\nJob ${job.id}:`);
      console.log(`  Attempts: ${attemptsMade}/${maxAttempts}`);
      console.log(`  Error: ${job.failedReason}`);

      if (attemptsMade >= maxAttempts) {
        console.log(`  ⏩ Skipping (max attempts reached)`);
        skippedCount++;
      } else {
        try {
          // Retry the job
          await job.retry();
          
          // Reset PDF status
          await PDF.findByIdAndUpdate(job.id, {
            processingStatus: 'processing',
            embeddingStatus: 'processing',
            processingError: null,
          });

          console.log(`  ✅ Retrying job...`);
          retriedCount++;
        } catch (error) {
          console.log(`  ❌ Error retrying: ${error.message}`);
        }
      }
    }

    console.log(`\n✨ Summary:`);
    console.log(`  Retried: ${retriedCount}`);
    console.log(`  Skipped: ${skippedCount}`);
    console.log(`  Total: ${failedJobs.length}\n`);

  } catch (error) {
    console.error('❌ Error retrying failed jobs:', error);
    logger.error(`Error retrying failed jobs: ${error.message}`);
    throw error;
  }
};

/**
 * Clean up permanently failed jobs (after all retries exhausted)
 */
const cleanupPermanentlyFailedJobs = async () => {
  try {
    console.log('🧹 Cleaning up permanently failed jobs...\n');

    const failedJobs = await pdfQueue.getFailed(0, 100);
    let cleanedCount = 0;

    for (const job of failedJobs) {
      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts || 3;

      if (attemptsMade >= maxAttempts) {
        console.log(`Removing job ${job.id} (${attemptsMade}/${maxAttempts} attempts)`);
        await job.remove();
        cleanedCount++;
      }
    }

    console.log(`\n✅ Cleaned up ${cleanedCount} permanently failed jobs\n`);

  } catch (error) {
    console.error('❌ Error cleaning up failed jobs:', error);
    logger.error(`Error cleaning up failed jobs: ${error.message}`);
    throw error;
  }
};

/**
 * Get stats about the queue
 */
const getQueueStats = async () => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      pdfQueue.getWaitingCount(),
      pdfQueue.getActiveCount(),
      pdfQueue.getCompletedCount(),
      pdfQueue.getFailedCount(),
      pdfQueue.getDelayedCount(),
    ]);

    console.log('\n📊 Queue Statistics:');
    console.log('═══════════════════');
    console.log(`  Waiting:   ${waiting}`);
    console.log(`  Active:    ${active}`);
    console.log(`  Delayed:   ${delayed}`);
    console.log(`  Completed: ${completed}`);
    console.log(`  Failed:    ${failed}`);
    console.log('═══════════════════\n');

    return { waiting, active, completed, failed, delayed };
  } catch (error) {
    console.error('❌ Error getting queue stats:', error);
    throw error;
  }
};

module.exports = {
  retryFailedJobs,
  cleanupPermanentlyFailedJobs,
  getQueueStats,
};
