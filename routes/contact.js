// Contact Routes - Xử lý form liên hệ từ khách hàng
import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';

const router = express.Router();

// =====================================================
// PUBLIC ROUTES - Cho Frontend
// =====================================================

/**
 * POST /api/contact/submit
 * Gửi form liên hệ từ khách hàng
 */
router.post('/submit',
  // Validation
  [
    body('full_name').trim().notEmpty().withMessage('Họ tên không được để trống'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('phone').trim().notEmpty().withMessage('Số điện thoại không được để trống'),
    body('message').trim().notEmpty().withMessage('Nội dung không được để trống')
  ],
  async (req, res) => {
    try {
      // Kiểm tra validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const {
        full_name,
        email,
        phone,
        subject,
        message,
        company_name,
        address
      } = req.body;

      // Lấy IP và User Agent
      const ip_address = req.ip || req.connection.remoteAddress;
      const user_agent = req.get('user-agent');

      // Insert vào database
      const [result] = await db.query(
        `INSERT INTO contact_submissions 
        (full_name, email, phone, subject, message, company_name, address, ip_address, user_agent) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [full_name, email, phone, subject || null, message, company_name || null, address || null, ip_address, user_agent]
      );

      res.status(201).json({
        success: true,
        message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.',
        data: {
          id: result.insertId
        }
      });

    } catch (error) {
      console.error('Error submitting contact:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau.'
      });
    }
  }
);

// =====================================================
// ADMIN ROUTES - Quản lý liên hệ
// =====================================================

/**
 * GET /api/contact/admin/list
 * Lấy danh sách tất cả liên hệ (cho admin)
 */
router.get('/admin/list', async (req, res) => {
  try {
    const { status, is_read, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM contact_submissions WHERE 1=1';
    const params = [];

    // Filter by status
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Filter by is_read
    if (is_read !== undefined) {
      query += ' AND is_read = ?';
      params.push(is_read === 'true' ? 1 : 0);
    }

    // Order by created_at DESC
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [contacts] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM contact_submissions WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (is_read !== undefined) {
      countQuery += ' AND is_read = ?';
      countParams.push(is_read === 'true' ? 1 : 0);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách liên hệ'
    });
  }
});

/**
 * GET /api/contact/admin/unread-count
 * Lấy số lượng liên hệ chưa đọc
 * NOTE: Phải đặt TRƯỚC route /admin/:id để tránh conflict
 */
router.get('/admin/unread-count', async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = FALSE'
    );

    res.json({
      success: true,
      data: {
        count: result[0].count
      }
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy số lượng chưa đọc'
    });
  }
});

/**
 * GET /api/contact/admin/:id
 * Lấy chi tiết một liên hệ
 */
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [contacts] = await db.query(
      'SELECT * FROM contact_submissions WHERE id = ?',
      [id]
    );

    if (contacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy liên hệ'
      });
    }

    // Mark as read
    await db.query(
      'UPDATE contact_submissions SET is_read = TRUE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: contacts[0]
    });

  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thông tin liên hệ'
    });
  }
});

/**
 * PUT /api/contact/admin/:id/status
 * Cập nhật trạng thái liên hệ
 */
router.put('/admin/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    const validStatuses = ['new', 'processing', 'completed', 'spam'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    await db.query(
      'UPDATE contact_submissions SET status = ?, admin_note = ? WHERE id = ?',
      [status, admin_note || null, id]
    );

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công'
    });

  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật trạng thái'
    });
  }
});

/**
 * DELETE /api/contact/admin/:id
 * Xóa liên hệ
 */
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM contact_submissions WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa liên hệ thành công'
    });

  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa liên hệ'
    });
  }
});

/**
 * GET /api/contact/admin/stats
 * Thống kê liên hệ
 */
router.get('/admin/stats/summary', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_count
      FROM contact_submissions
    `);

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thống kê'
    });
  }
});

export default router;

