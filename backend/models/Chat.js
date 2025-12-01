const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pdfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PDF',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        context: [{
          pageNumber: Number,
          content: String,
          score: Number,
        }],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
chatSchema.index({ userId: 1, pdfId: 1, createdAt: -1 });
chatSchema.index({ sessionId: 1 });
chatSchema.index({ userId: 1, isActive: 1, updatedAt: -1 });

// Method to add message
chatSchema.methods.addMessage = function (role, content, context = []) {
  this.messages.push({
    role,
    content,
    context,
    timestamp: new Date(),
  });
  return this.save();
};

// Static method to get user's chat history
chatSchema.statics.getUserHistory = function (userId, limit = 20) {
  return this.find({ userId, isActive: true })
    .populate('pdfId', 'filename originalName')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('pdfId sessionId messages updatedAt');
};

module.exports = mongoose.model('Chat', chatSchema);
