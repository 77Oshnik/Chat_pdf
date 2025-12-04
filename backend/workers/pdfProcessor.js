const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const logger = require('../config/logger');
const { initPinecone } = require('../config/pinecone');
const PDF = require('../models/PDF');
const pdfService = require('../services/pdfService');
const embeddingService = require('../services/embeddingService');
const vectorService = require('../services/vectorService');
const connectDB = require('../config/database');

console.log('🚀 Starting PDF Worker Process...\n');

// Initialize database and services
const initialize = async () => {
  console.log('📦 Step 1: Connecting to MongoDB...');
  await connectDB();
  console.log('✅ MongoDB connected\n');

  console.log('🔗 Step 2: Initializing Pinecone...');
  await initPinecone();
  console.log('✅ Pinecone initialized\n');

  console.log('🤖 Step 3: Initializing Gemini AI...');
  await embeddingService.initialize();
  console.log('✅ Gemini AI ready\n');

  logger.info('Worker initialized successfully');
};

// Process PDF job
const processPDF = async (job) => {
  const { pdfId, pdfBuffer, userId } = job.data;

  try {
    console.log(`\n📄 Processing PDF: ${pdfId}`);
    logger.info(`Processing PDF: ${pdfId}`);

    // Update status to processing
    await PDF.findByIdAndUpdate(pdfId, {
      processingStatus: 'processing',
      embeddingStatus: 'processing',
    });

    // Update progress
    await job.updateProgress(10);

    // Extract text from PDF
    console.log(`📖 Extracting text...`);
    logger.info(`Extracting text from PDF: ${pdfId}`);
    const { text, numPages } = await pdfService.extractText(
      Buffer.from(pdfBuffer)
    );
    console.log(`✅ Extracted ${numPages} pages`);

    // Update PDF with page count
    await PDF.findByIdAndUpdate(pdfId, { pageCount: numPages });

    await job.updateProgress(30);

    // Clean text
    const cleanedText = pdfService.cleanText(text);

    // Split into pages
    const pages = pdfService.splitIntoPages(cleanedText, numPages);

    await job.updateProgress(40);

    // Generate chunks for embedding
    console.log(`✂️  Generating chunks...`);
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
    console.log(`✅ Generated ${allChunks.length} chunks`);

    await job.updateProgress(50);

    // Generate embeddings
    console.log(`🤖 Generating embeddings for ${allChunks.length} chunks...`);
    logger.info(`Generating embeddings for ${allChunks.length} chunks`);
    const embeddings = [];

    // Process in batches to avoid rate limits
    const batchSize = 10;
    const totalBatches = Math.ceil(allChunks.length / batchSize);
    
    for (let i = 0; i < allChunks.length; i += batchSize) {
      const batchNum = Math.floor(i / batchSize) + 1;
      const batch = allChunks.slice(i, i + batchSize);
      const batchTexts = batch.map((chunk) => chunk.text);
      
      console.log(`   Processing batch ${batchNum}/${totalBatches}...`);
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
    console.log(`✅ All embeddings generated`);

    await job.updateProgress(80);

    // Store vectors in Pinecone
    console.log(`💾 Storing ${embeddings.length} vectors in Pinecone...`);
    logger.info(`Storing ${embeddings.length} vectors in Pinecone`);
    const vectorIds = await vectorService.storeVectors(
      embeddings,
      pdfId,
      userId
    );
    console.log(`✅ Stored ${vectorIds.length} vectors`);

    await job.updateProgress(90);

    // Update PDF document with vector IDs
    await PDF.findByIdAndUpdate(pdfId, {
      processingStatus: 'completed',
      embeddingStatus: 'completed',
      vectorIds,
    });

    await job.updateProgress(100);

    console.log(`✅ PDF processing completed: ${pdfId}\n`);
    logger.info(`Successfully processed PDF: ${pdfId}`);

    return {
      success: true,
      pdfId,
      chunksProcessed: allChunks.length,
      vectorsStored: vectorIds.length,
    };
  } catch (error) {
    console.error(`❌ Error processing PDF ${pdfId}:`, error.message);
    console.error(error.stack);
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
  console.log('🏗️  Creating BullMQ worker...');
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
    console.log(`✅ Job ${job.id} completed successfully`);
    logger.info(`Worker completed job ${job.id}`);
  });

  worker.on('failed', async (job, err) => {
    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 3;
    const willRetry = attemptsMade < maxAttempts;

    if (willRetry) {
      console.log(`⚠️  Job ${job.id} failed (attempt ${attemptsMade}/${maxAttempts})`);
      console.log(`   Error: ${err.message}`);
      console.log(`   🔄 Will retry in ${Math.pow(2, attemptsMade) * 2} seconds...`);
      logger.warn(`Job ${job.id} failed on attempt ${attemptsMade}/${maxAttempts}, will retry: ${err.message}`);
      
      // Don't mark as failed if will retry
      await PDF.findByIdAndUpdate(job.id, {
        processingStatus: 'processing',
        embeddingStatus: 'processing',
      });
    } else {
      console.error(`❌ Job ${job.id} failed permanently after ${maxAttempts} attempts`);
      console.error(`   Final error: ${err.message}`);
      logger.error(`Worker permanently failed job ${job.id} after ${maxAttempts} attempts: ${err.message}`);
      
      // Mark as permanently failed only after all retries exhausted
      await PDF.findByIdAndUpdate(job.id, {
        processingStatus: 'failed',
        embeddingStatus: 'failed',
        processingError: `Failed after ${maxAttempts} attempts: ${err.message}`,
      });
    }
  });

  worker.on('error', (err) => {
    console.error(`❌ Worker error:`, err.message);
    logger.error(`Worker error: ${err.message}`);
  });

  worker.on('active', (job) => {
    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 3;
    
    if (attemptsMade > 1) {
      console.log(`▶️  Retrying job ${job.id} (attempt ${attemptsMade}/${maxAttempts})`);
    } else {
      console.log(`▶️  Started processing job ${job.id}`);
    }
  });

  console.log('✅ Worker created\n');
  return worker;
};

// Start worker
const startWorker = async () => {
  try {
    await initialize();
    const worker = createWorker();
    
    console.log('✅ PDF PROCESSING WORKER IS RUNNING!');
    console.log('✅ Waiting for jobs...\n');
    logger.info('PDF processing worker started');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n⚠️  Shutting down worker...');
      logger.info('Shutting down worker...');
      await worker.close();
      await redisClient.quit();
      console.log('✅ Worker shut down gracefully');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n⚠️  Shutting down worker...');
      logger.info('Shutting down worker...');
      await worker.close();
      await redisClient.quit();
      console.log('✅ Worker shut down gracefully');
      process.exit(0);
    });
  } catch (error) {
    console.error('\n❌ FAILED TO START WORKER:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    logger.error(`Failed to start worker: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED REJECTION:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Start the worker
startWorker();

