// Testimonials Routes
import express from 'express';
import db from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [testimonials] = await db.query(
      'SELECT * FROM testimonials WHERE is_active = TRUE ORDER BY display_order ASC, created_at DESC'
    );
    res.json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

// POST /api/testimonials - Submit review từ frontend (public, không cần auth)
router.post('/', async (req, res) => {
  try {
    const { customer_name, rating, content } = req.body;

    // Validate input
    if (!customer_name || !rating || !content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    const [result] = await db.query(
      `INSERT INTO testimonials (client_name, rating, content, is_active, created_at)
       VALUES (?, ?, ?, TRUE, NOW())`,
      [customer_name, rating, content]
    );

    res.status(201).json({
      success: true,
      message: 'Gửi đánh giá thành công',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [testimonials] = await db.query('SELECT * FROM testimonials WHERE id = ?', [id]);
    if (testimonials.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
    const testimonial = testimonials[0];
    // Add aliases
    testimonial.customer_name = testimonial.client_name;
    testimonial.company = testimonial.company_name;
    testimonial.avatar_url = testimonial.avatar;
    res.json({ success: true, data: testimonial });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.post('/admin', async (req, res) => {
  try {
    const { customer_name, position, company, avatar_url, rating, content, is_active } = req.body;
    const [result] = await db.query(
      `INSERT INTO testimonials (client_name, position, company_name, avatar, rating, content, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_name, position || null, company || null, avatar_url || null, rating || 5, content, is_active !== false]
    );
    res.status(201).json({ success: true, message: 'Tạo đánh giá thành công', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Map frontend fields to database fields
    if (updateData.customer_name !== undefined) {
      updateData.client_name = updateData.customer_name;
      delete updateData.customer_name;
    }
    if (updateData.company !== undefined) {
      updateData.company_name = updateData.company;
      delete updateData.company;
    }
    if (updateData.avatar_url !== undefined) {
      updateData.avatar = updateData.avatar_url;
      delete updateData.avatar_url;
    }

    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    await db.query(`UPDATE testimonials SET ${fields} WHERE id = ?`, values);
    res.json({ success: true, message: 'Cập nhật đánh giá thành công' });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.delete('/admin/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Xóa đánh giá thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

export default router;

