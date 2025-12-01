const cloudinary = require('../config/cloudinary');
const logger = require('../config/logger');
const { Readable } = require('stream');

class CloudinaryService {
  /**
   * Upload PDF to Cloudinary
   * @param {Buffer} fileBuffer - PDF file buffer
   * @param {string} filename - Original filename
   * @param {string} userId - User ID for folder organization
   * @returns {Promise<Object>} Upload result with URL and public ID
   */
  async uploadPDF(fileBuffer, filename, userId) {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `pdfs/${userId}`,
            resource_type: 'raw',
            public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`,
            format: 'pdf',
          },
          (error, result) => {
            if (error) {
              logger.error(`Cloudinary upload error: ${error.message}`);
              reject(error);
            } else {
              logger.info(`PDF uploaded to Cloudinary: ${result.public_id}`);
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                bytes: result.bytes,
              });
            }
          }
        );

        // Convert buffer to stream and pipe to cloudinary
        const readableStream = Readable.from(fileBuffer);
        readableStream.pipe(uploadStream);
      });
    } catch (error) {
      logger.error(`Error in uploadPDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete PDF from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  async deletePDF(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw',
      });
      
      logger.info(`PDF deleted from Cloudinary: ${publicId}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get PDF URL
   * @param {string} publicId - Cloudinary public ID
   * @returns {string} PDF URL
   */
  getPDFUrl(publicId) {
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true,
    });
  }
}

module.exports = new CloudinaryService();
