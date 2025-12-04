const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get embedding model
// Using gemini-embedding-001 which produces 3072-dimensional vectors
// ⚠️ IMPORTANT: Your Pinecone index MUST be configured for 3072 dimensions!
// To create/update Pinecone index: https://app.pinecone.io
const getEmbeddingModel = () => {
  try {
    return genAI.getGenerativeModel({ model: 'text-embedding-004' });
  } catch (error) {
    logger.error(`Error initializing Gemini embedding model: ${error.message}`);
    throw error;
  }
};

// Get chat model
const getChatModel = () => {
  try {
    return genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
  } catch (error) {
    logger.error(`Error initializing Gemini chat model: ${error.message}`);
    throw error;
  }
};

module.exports = {
  genAI,
  getEmbeddingModel,
  getChatModel,
};
