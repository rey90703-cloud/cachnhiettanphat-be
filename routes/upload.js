import express from 'express';
import upload from '../middleware/upload.js';

const router = express.Router();

/**
 * POST /api/upload/single
 * Upload single file
 */
router.post('/single', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được upload'
      });
    }

    // Trả về URL của file
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Upload file thành công',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi upload file'
    });
  }
});

/**
 * POST /api/upload/multiple
 * Upload multiple files
 */
router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được upload'
      });
    }

    // Trả về URLs của các files
    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    res.json({
      success: true,
      message: 'Upload files thành công',
      data: files
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi upload files'
    });
  }
});

export default router;

