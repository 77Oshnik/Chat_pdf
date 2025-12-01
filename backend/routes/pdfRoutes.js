const express = require('express');
const router = express.Router();
const {
  uploadPDF,
  getUserPDFs,
  getPDF,
  getPDFStatus,
  deletePDF,
  retryProcessing,
} = require('../controllers/pdfController');
const protect = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { uploadLimiter } = require('../middlewares/rateLimiter');

// All routes are protected
router.use(protect);

// PDF routes
router.post('/upload', uploadLimiter, upload.single('pdf'), uploadPDF);
router.get('/', getUserPDFs);
router.get('/:id', getPDF);
router.get('/:id/status', getPDFStatus);
router.post('/:id/retry', retryProcessing);
router.delete('/:id', deletePDF);

module.exports = router;
