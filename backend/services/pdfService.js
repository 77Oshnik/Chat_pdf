const { PDFExtract } = require('pdf.js-extract');
const logger = require('../config/logger');

class PDFService {
  constructor() {
    this.pdfExtract = new PDFExtract();
  }

  /**
   * Extract text from PDF buffer
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async extractText(pdfBuffer) {
    try {
      const data = await this.pdfExtract.extractBuffer(pdfBuffer);
      
      // Combine all text from all pages
      const text = data.pages
        .map(page => page.content.map(item => item.str).join(' '))
        .join('\n\n');
      
      return {
        text: text,
        numPages: data.pages.length,
        info: data.meta || {},
        metadata: data.meta || {},
      };
    } catch (error) {
      logger.error(`Error extracting PDF text: ${error.message}`);
      throw error;
    }
  }

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

  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }
}

module.exports = new PDFService();