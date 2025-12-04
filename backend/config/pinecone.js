require('dotenv').config();

const { Pinecone } = require('@pinecone-database/pinecone');
const logger = require('./logger');

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Track index reference
let index = null;

/**
 * Initialize Pinecone Connection
 */
const initPinecone = async () => {
  try {
    // Validate environment variables
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY is missing in .env");
    }

    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error("PINECONE_INDEX_NAME is missing in .env");
    }

    // Create index reference
    index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    logger.info(`Pinecone index '${process.env.PINECONE_INDEX_NAME}' initialized successfully`);

    return index;

  } catch (error) {
    logger.error(`Error during Pinecone initialization: ${error.message}`);
    throw error;
  }
};

/**
 * Get Pinecone index instance
 */
const getIndex = () => {
  if (!index) {
    throw new Error("Pinecone index not initialized. Call initPinecone() first.");
  }
  return index;
};

module.exports = {
  pinecone,
  initPinecone,
  getIndex,
};
