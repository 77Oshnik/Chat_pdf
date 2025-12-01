const { Pinecone } = require('@pinecone-database/pinecone');
const logger = require('./logger');

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

let index = null;

// Initialize Pinecone index
const initPinecone = async () => {
  try {
    // Get the index
    index = pinecone.index(process.env.PINECONE_INDEX_NAME);
    logger.info(`Pinecone index '${process.env.PINECONE_INDEX_NAME}' initialized`);
    
    return index;
  } catch (error) {
    logger.error(`Error initializing Pinecone: ${error.message}`);
    throw error;
  }
};

// Get index instance
const getIndex = () => {
  if (!index) {
    throw new Error('Pinecone index not initialized. Call initPinecone() first.');
  }
  return index;
};

module.exports = {
  pinecone,
  initPinecone,
  getIndex,
};
