const { body, param } = require('express-validator');

const chatMessageValidator = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  
  param('pdfId')
    .notEmpty()
    .withMessage('PDF ID is required')
    .isMongoId()
    .withMessage('Invalid PDF ID'),
];

const sessionIdValidator = [
  param('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isUUID()
    .withMessage('Invalid session ID format'),
];

module.exports = {
  chatMessageValidator,
  sessionIdValidator,
};
