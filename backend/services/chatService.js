const { getChatModel } = require('../config/gemini');
const logger = require('../config/logger');

class ChatService {
  constructor() {
    this.model = null;
  }

  /**
   * Initialize chat model
   */
  async initialize() {
    try {
      this.model = getChatModel();
      logger.info('Chat model initialized');
    } catch (error) {
      logger.error(`Error initializing chat model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate response based on context and question
   * @param {string} question - User's question
   * @param {Array<Object>} context - Relevant context from PDF
   * @param {Array<Object>} chatHistory - Previous messages
   * @returns {Promise<string>} Generated response
   */
  async generateResponse(question, context, chatHistory = []) {
    try {
      if (!this.model) {
        await this.initialize();
      }

      // Build context string
      const contextString = context
        .map((ctx, idx) => `[Context ${idx + 1} - Page ${ctx.pageNumber}]:\n${ctx.text}`)
        .join('\n\n');

      // Build chat history string
      const historyString = chatHistory
        .slice(-5) // Last 5 messages for context
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      // Create prompt
      const prompt = `You are a helpful AI assistant that answers questions based on the provided PDF document context.

${historyString ? `Previous conversation:\n${historyString}\n\n` : ''}Context from the PDF document:
${contextString}

User's question: ${question}

Instructions:
1. Answer the question based ONLY on the provided context
2. If the context doesn't contain enough information to answer the question, say so
3. Be concise and accurate
4. If referencing specific information, mention the page number
5. Maintain a helpful and professional tone

Answer:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return text;
    } catch (error) {
      logger.error(`Error generating response: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a summary of the PDF content
   * @param {string} content - PDF content to summarize
   * @returns {Promise<string>} Summary
   */
  async generateSummary(content) {
    try {
      if (!this.model) {
        await this.initialize();
      }

      const prompt = `Please provide a concise summary of the following document content:

${content.substring(0, 10000)} ${content.length > 10000 ? '...(truncated)' : ''}

Summary:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      logger.error(`Error generating summary: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ChatService();
