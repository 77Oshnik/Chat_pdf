const PDF = require('../models/PDF');
const cloudinaryService = require('../services/cloudinaryService');
const vectorService = require('../services/vectorService');
const { addPdfProcessingJob, getJobStatus } = require('../queues/pdfQueue');
const logger = require('../config/logger');

/**
 * @desc    Upload PDF
 * @route   POST /api/pdf/upload
 * @access  Private
 */
const uploadPDF = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file',
      });
    }

    const { originalname, buffer, size } = req.file;
    const userId = req.user.id;

    logger.info(`Uploading PDF: ${originalname} for user: ${userId}`);

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadPDF(
      buffer,
      originalname,
      userId
    );

    // Create PDF document in database
    const pdf = await PDF.create({
      userId,
      filename: originalname,
      originalName: originalname,
      cloudinaryUrl: uploadResult.url,
      cloudinaryPublicId: uploadResult.publicId,
      fileSize: size,
      processingStatus: 'pending',
      embeddingStatus: 'pending',
    });

    // Add job to processing queue
    await addPdfProcessingJob({
      pdfId: pdf._id.toString(),
      pdfBuffer: buffer.toJSON().data,
      userId,
    });

    logger.info(`PDF uploaded and queued for processing: ${pdf._id}`);

    res.status(201).json({
      success: true,
      message: 'PDF uploaded successfully and queued for processing',
      data: {
        pdf: {
          id: pdf._id,
          filename: pdf.filename,
          fileSize: pdf.fileSize,
          processingStatus: pdf.processingStatus,
          createdAt: pdf.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error(`Upload PDF error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get all user PDFs
 * @route   GET /api/pdf
 * @access  Private
 */
const getUserPDFs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId };
    if (status) {
      query.processingStatus = status;
    }

    const pdfs = await PDF.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-vectorIds -__v');

    const count = await PDF.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        pdfs,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count,
      },
    });
  } catch (error) {
    logger.error(`Get user PDFs error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get single PDF
 * @route   GET /api/pdf/:id
 * @access  Private
 */
const getPDF = async (req, res, next) => {
  try {
    const pdf = await PDF.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).select('-vectorIds -__v');

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { pdf },
    });
  } catch (error) {
    logger.error(`Get PDF error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get PDF processing status
 * @route   GET /api/pdf/:id/status
 * @access  Private
 */
const getPDFStatus = async (req, res, next) => {
  try {
    const pdf = await PDF.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    // Get job status from queue
    const jobStatus = await getJobStatus(pdf._id.toString());

    res.status(200).json({
      success: true,
      data: {
        processingStatus: pdf.processingStatus,
        embeddingStatus: pdf.embeddingStatus,
        isReady: pdf.isReady(),
        jobStatus: jobStatus
          ? {
              state: jobStatus.state,
              progress: jobStatus.progress,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error(`Get PDF status error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete PDF
 * @route   DELETE /api/pdf/:id
 * @access  Private
 */
const deletePDF = async (req, res, next) => {
  try {
    const pdf = await PDF.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    // Delete from Cloudinary
    await cloudinaryService.deletePDF(pdf.cloudinaryPublicId);

    // Delete vectors from Pinecone
    if (pdf.vectorIds && pdf.vectorIds.length > 0) {
      await vectorService.deleteVectors(pdf.vectorIds);
    }

    // Delete from database
    await pdf.deleteOne();

    logger.info(`PDF deleted: ${pdf._id}`);

    res.status(200).json({
      success: true,
      message: 'PDF deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete PDF error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  uploadPDF,
  getUserPDFs,
  getPDF,
  getPDFStatus,
  deletePDF,
};
