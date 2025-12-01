const { getIndex } = require('../config/pinecone');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class VectorService {
  /**
   * Store vectors in Pinecone
   * @param {Array<Object>} vectors - Array of vector objects
   * @param {string} pdfId - PDF document ID
   * @param {string} userId - User ID
   * @returns {Promise<Array<string>>} Array of vector IDs
   */
  async storeVectors(vectors, pdfId, userId) {
    try {
      const index = getIndex();
      const vectorIds = [];

      // Prepare vectors for upsert
      const vectorsToUpsert = vectors.map((vector, idx) => {
        const id = uuidv4();
        vectorIds.push(id);

        return {
          id,
          values: vector.embedding,
          metadata: {
            pdfId,
            userId,
            text: vector.text,
            pageNumber: vector.pageNumber || 0,
            chunkIndex: idx,
            createdAt: new Date().toISOString(),
          },
        };
      });

      // Upsert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
        const batch = vectorsToUpsert.slice(i, i + batchSize);
        await index.upsert(batch);
      }

      logger.info(`Stored ${vectorIds.length} vectors for PDF ${pdfId}`);
      return vectorIds;
    } catch (error) {
      logger.error(`Error storing vectors: ${error.message}`);
      throw error;
    }
  }

  /**
   * Query similar vectors
   * @param {Array<number>} queryVector - Query embedding vector
   * @param {string} pdfId - PDF document ID
   * @param {number} topK - Number of results to return
   * @returns {Promise<Array<Object>>} Similar vectors with metadata
   */
  async querySimilar(queryVector, pdfId, topK = 5) {
    try {
      const index = getIndex();

      const queryResponse = await index.query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter: {
          pdfId: { $eq: pdfId },
        },
      });

      return queryResponse.matches.map((match) => ({
        id: match.id,
        score: match.score,
        text: match.metadata.text,
        pageNumber: match.metadata.pageNumber,
        chunkIndex: match.metadata.chunkIndex,
      }));
    } catch (error) {
      logger.error(`Error querying vectors: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete vectors for a PDF
   * @param {Array<string>} vectorIds - Array of vector IDs to delete
   * @returns {Promise<void>}
   */
  async deleteVectors(vectorIds) {
    try {
      const index = getIndex();

      // Delete in batches
      const batchSize = 1000;
      for (let i = 0; i < vectorIds.length; i += batchSize) {
        const batch = vectorIds.slice(i, i + batchSize);
        await index.deleteMany(batch);
      }

      logger.info(`Deleted ${vectorIds.length} vectors`);
    } catch (error) {
      logger.error(`Error deleting vectors: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete all vectors for a PDF by filter
   * @param {string} pdfId - PDF document ID
   * @returns {Promise<void>}
   */
  async deleteByPdfId(pdfId) {
    try {
      const index = getIndex();

      await index.deleteMany({
        filter: {
          pdfId: { $eq: pdfId },
        },
      });

      logger.info(`Deleted all vectors for PDF ${pdfId}`);
    } catch (error) {
      logger.error(`Error deleting vectors by PDF ID: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new VectorService();
