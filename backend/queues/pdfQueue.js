const { Queue } = require('bullmq');
const redisClient = require('../config/redis');
const logger = require('../config/logger');

// Create PDF processing queue
const pdfQueue = new Queue('pdf-processing', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: parseInt(process.env.MAX_RETRIES) || 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Queue event listeners
pdfQueue.on('error', (error) => {
  logger.error(`PDF Queue error: ${error.message}`);
});

pdfQueue.on('waiting', (jobId) => {
  logger.info(`Job ${jobId} is waiting`);
});

pdfQueue.on('active', (job) => {
  logger.info(`Job ${job.id} is now active`);
});

pdfQueue.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

pdfQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed: ${err.message}`);
});

// Add job to queue
const addPdfProcessingJob = async (pdfData) => {
  try {
    const job = await pdfQueue.add('process-pdf', pdfData, {
      jobId: pdfData.pdfId,
    });
    
    logger.info(`Added PDF processing job: ${job.id}`);
    return job;
  } catch (error) {
    logger.error(`Error adding job to queue: ${error.message}`);
    throw error;
  }
};

// Get job status
const getJobStatus = async (jobId) => {
  try {
    const job = await pdfQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;
    
    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  } catch (error) {
    logger.error(`Error getting job status: ${error.message}`);
    throw error;
  }
};

module.exports = {
  pdfQueue,
  addPdfProcessingJob,
  getJobStatus,
};
