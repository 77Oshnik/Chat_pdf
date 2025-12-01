const { getEmbeddingModel } = require('../config/gemini');
const logger = require('../config/logger');

class EmbeddingService {
  constructor() {
    this.model = null;
  }

  /**
   * Initialize embedding model
   */
  async initialize() {
    try {
      this.model = getEmbeddingModel();
      logger.info('Embedding model initialized');
    } catch (error) {
      logger.error(`Error initializing embedding model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate embeddings for text
   * @param {string} text - Text to embed
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async generateEmbedding(text) {
    try {
      if (!this.model) {
        await this.initialize();
      }

      const result = await this.model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      logger.error(`Error generating embedding: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param {Array<string>} texts - Array of texts to embed
   * @returns {Promise<Array<Array<number>>>} Array of embedding vectors
   */
  async generateBatchEmbeddings(texts) {
    try {
      if (!this.model) {
        await this.initialize();
      }

      const embeddings = await Promise.all(
        texts.map((text) => this.generateEmbedding(text))
      );

      return embeddings;
    } catch (error) {
      logger.error(`Error generating batch embeddings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Chunk text into smaller pieces for embedding
   * @param {string} text - Text to chunk
   * @param {number} chunkSize - Size of each chunk
   * @param {number} overlap - Overlap between chunks
   * @returns {Array<Object>} Array of chunks with metadata
   */
  chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      const chunk = text.slice(startIndex, endIndex);

      chunks.push({
        text: chunk,
        startIndex,
        endIndex,
      });

      startIndex += chunkSize - overlap;
    }

    return chunks;
  }
}

module.exports = new EmbeddingService();
