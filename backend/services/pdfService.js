const pdf = require('pdf-parse');
const logger = require('../config/logger');

class PDFService {
  /**
   * Extract text from PDF buffer
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async extractText(pdfBuffer) {
    try {
      const data = await pdf(pdfBuffer);

      return {
        text: data.text,
        numPages: data.numpages,
        info: data.info,
        metadata: data.metadata,
      };
    } catch (error) {
      logger.error(`Error extracting PDF text: ${error.message}`);
      throw error;
    }
  }

  /**
   * Split PDF text into pages (approximation)
   * @param {string} text - Full PDF text
   * @param {number} numPages - Number of pages
   * @returns {Array<Object>} Array of page objects
   */
  splitIntoPages(text, numPages) {
    const avgCharsPerPage = Math.ceil(text.length / numPages);
    const pages = [];

    for (let i = 0; i < numPages; i++) {
      const start = i * avgCharsPerPage;
      const end = Math.min((i + 1) * avgCharsPerPage, text.length);
      const pageText = text.slice(start, end);

      if (pageText.trim()) {
        pages.push({
          pageNumber: i + 1,
          text: pageText.trim(),
        });
      }
    }

    return pages;
  }

  /**
   * Clean and preprocess text
   * @param {string} text - Raw text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();
  }
}

module.exports = new PDFService();
