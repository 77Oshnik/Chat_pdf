const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    pageCount: {
      type: Number,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    processingError: {
      type: String,
    },
    embeddingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    vectorIds: [{
      type: String,
    }],
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user queries
pdfSchema.index({ userId: 1, createdAt: -1 });
pdfSchema.index({ userId: 1, processingStatus: 1 });

// Method to check if PDF is ready for chat
pdfSchema.methods.isReady = function () {
  return this.processingStatus === 'completed' && this.embeddingStatus === 'completed';
};

module.exports = mongoose.model('PDF', pdfSchema);
