const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const Chat = require('../models/Chat');
const PDF = require('../models/PDF');
const embeddingService = require('../services/embeddingService');
const vectorService = require('../services/vectorService');
const chatService = require('../services/chatService');
const redisClient = require('../config/redis');
const logger = require('../config/logger');

/**
 * @desc    Send message and get response
 * @route   POST /api/chat/:pdfId
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { pdfId } = req.params;
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    // Check if PDF exists and belongs to user
    const pdf = await PDF.findOne({ _id: pdfId, userId });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    // Check if PDF is ready
    if (!pdf.isReady()) {
      return res.status(400).json({
        success: false,
        message: 'PDF is still being processed. Please wait.',
        processingStatus: pdf.processingStatus,
        embeddingStatus: pdf.embeddingStatus,
      });
    }

    // Generate or use existing session ID
    const chatSessionId = sessionId || uuidv4();

    // Find or create chat session
    let chat = await Chat.findOne({
      userId,
      pdfId,
      sessionId: chatSessionId,
    });

    if (!chat) {
      chat = await Chat.create({
        userId,
        pdfId,
        sessionId: chatSessionId,
        messages: [],
      });
    }

    // Check cache for similar question
    const cacheKey = `chat:${pdfId}:${message.toLowerCase().trim()}`;
    const cachedResponse = await redisClient.get(cacheKey);

    if (cachedResponse) {
      logger.info('Returning cached response');
      const response = JSON.parse(cachedResponse);

      // Add to chat history
      await chat.addMessage('user', message);
      await chat.addMessage('assistant', response.answer, response.context);

      return res.status(200).json({
        success: true,
        data: {
          answer: response.answer,
          context: response.context,
          sessionId: chatSessionId,
          cached: true,
        },
      });
    }

    // Generate embedding for the question
    const questionEmbedding = await embeddingService.generateEmbedding(message);

    // Query similar vectors
    const similarChunks = await vectorService.querySimilar(
      questionEmbedding,
      pdfId,
      5
    );

    if (similarChunks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          answer: "I couldn't find relevant information in the PDF to answer your question.",
          context: [],
          sessionId: chatSessionId,
        },
      });
    }

    // Get chat history for context
    const chatHistory = chat.messages.slice(-10); // Last 10 messages

    // Generate response
    const answer = await chatService.generateResponse(
      message,
      similarChunks,
      chatHistory
    );

    // Prepare context
    const context = similarChunks.map((chunk) => ({
      pageNumber: chunk.pageNumber,
      content: chunk.text.substring(0, 200) + '...',
      score: chunk.score,
    }));

    // Cache the response (expire in 1 hour)
    await redisClient.setex(
      cacheKey,
      3600,
      JSON.stringify({ answer, context })
    );

    // Add to chat history
    await chat.addMessage('user', message);
    await chat.addMessage('assistant', answer, context);

    logger.info(`Chat message processed for PDF: ${pdfId}`);

    res.status(200).json({
      success: true,
      data: {
        answer,
        context,
        sessionId: chatSessionId,
        cached: false,
      },
    });
  } catch (error) {
    logger.error(`Send message error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get chat history
 * @route   GET /api/chat/history
 * @access  Private
 */
const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const history = await Chat.getUserHistory(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (error) {
    logger.error(`Get chat history error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get chat session
 * @route   GET /api/chat/session/:sessionId
 * @access  Private
 */
const getChatSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOne({ userId, sessionId }).populate(
      'pdfId',
      'filename originalName'
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { chat },
    });
  } catch (error) {
    logger.error(`Get chat session error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete chat session
 * @route   DELETE /api/chat/session/:sessionId
 * @access  Private
 */
const deleteChatSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOne({ userId, sessionId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      });
    }

    await chat.deleteOne();

    logger.info(`Chat session deleted: ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete chat session error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get PDF chat sessions
 * @route   GET /api/chat/pdf/:pdfId
 * @access  Private
 */
const getPDFChatSessions = async (req, res, next) => {
  try {
    const { pdfId } = req.params;
    const userId = req.user.id;

    // Verify PDF belongs to user
    const pdf = await PDF.findOne({ _id: pdfId, userId });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    const sessions = await Chat.find({ userId, pdfId, isActive: true })
      .sort({ updatedAt: -1 })
      .select('sessionId messages updatedAt');

    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    logger.error(`Get PDF chat sessions error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  getChatSession,
  deleteChatSession,
  getPDFChatSessions,
};
