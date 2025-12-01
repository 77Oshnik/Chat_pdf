require('dotenv').config();
const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const logger = require('../config/logger');
const { initPinecone } = require('../config/pinecone');
const PDF = require('../models/PDF');
const pdfService = require('../services/pdfService');
const embeddingService = require('../services/embeddingService');
const vectorService = require('../services/vectorService');
const connectDB = require('../config/database');

// Initialize database and services
const initialize = async () => {
  await connectDB();
  await initPinecone();
  await embeddingService.initialize();
  logger.info('Worker initialized successfully');
};

// Process PDF job
const processPDF = async (job) => {
  const { pdfId, pdfBuffer, userId } = job.data;

  try {
    logger.info(`Processing PDF: ${pdfId}`);

    // Update status to processing
    await PDF.findByIdAndUpdate(pdfId, {
      processingStatus: 'processing',
      embeddingStatus: 'processing',
    });

    // Update progress
    await job.updateProgress(10);

    // Extract text from PDF
    logger.info(`Extracting text from PDF: ${pdfId}`);
    const { text, numPages } = await pdfService.extractText(
      Buffer.from(pdfBuffer)
    );

    // Update PDF with page count
    await PDF.findByIdAndUpdate(pdfId, { pageCount: numPages });

    await job.updateProgress(30);

    // Clean text
    const cleanedText = pdfService.cleanText(text);

    // Split into pages
    const pages = pdfService.splitIntoPages(cleanedText, numPages);

    await job.updateProgress(40);

    // Generate chunks for embedding
    logger.info(`Generating chunks for PDF: ${pdfId}`);
    const allChunks = [];

    for (const page of pages) {
      const chunks = embeddingService.chunkText(page.text);
      chunks.forEach((chunk) => {
        allChunks.push({
          text: chunk.text,
          pageNumber: page.pageNumber,
        });
      });
    }

    await job.updateProgress(50);

    // Generate embeddings
    logger.info(`Generating embeddings for ${allChunks.length} chunks`);
    const embeddings = [];

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < allChunks.length; i += batchSize) {
      const batch = allChunks.slice(i, i + batchSize);
      const batchTexts = batch.map((chunk) => chunk.text);
      const batchEmbeddings = await embeddingService.generateBatchEmbeddings(
        batchTexts
      );

      batch.forEach((chunk, idx) => {
        embeddings.push({
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          embedding: batchEmbeddings[idx],
        });
      });

      // Update progress
      const progress = 50 + Math.floor((i / allChunks.length) * 30);
      await job.updateProgress(progress);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await job.updateProgress(80);

    // Store vectors in Pinecone
    logger.info(`Storing ${embeddings.length} vectors in Pinecone`);
    const vectorIds = await vectorService.storeVectors(
      embeddings,
      pdfId,
      userId
    );

    await job.updateProgress(90);

    // Update PDF document with vector IDs
    await PDF.findByIdAndUpdate(pdfId, {
      processingStatus: 'completed',
      embeddingStatus: 'completed',
      vectorIds,
    });

    await job.updateProgress(100);

    logger.info(`Successfully processed PDF: ${pdfId}`);

    return {
      success: true,
      pdfId,
      chunksProcessed: allChunks.length,
      vectorsStored: vectorIds.length,
    };
  } catch (error) {
    logger.error(`Error processing PDF ${pdfId}: ${error.message}`);

    // Update PDF status to failed
    await PDF.findByIdAndUpdate(pdfId, {
      processingStatus: 'failed',
      embeddingStatus: 'failed',
      processingError: error.message,
    });

    throw error;
  }
};

// Create worker
const createWorker = () => {
  const worker = new Worker('pdf-processing', processPDF, {
    connection: redisClient,
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  });

  // Worker event listeners
  worker.on('completed', (job) => {
    logger.info(`Worker completed job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Worker failed job ${job.id}: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`Worker error: ${err.message}`);
  });

  return worker;
};

// Start worker
const startWorker = async () => {
  try {
    await initialize();
    const worker = createWorker();
    logger.info('PDF processing worker started');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down worker...');
      await worker.close();
      await redisClient.quit();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down worker...');
      await worker.close();
      await redisClient.quit();
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Failed to start worker: ${error.message}`);
    process.exit(1);
  }
};

// Start the worker
startWorker();
