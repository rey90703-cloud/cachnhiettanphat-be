// Services Routes
import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /api/services - Lấy danh sách dịch vụ
router.get('/', async (req, res) => {
  try {
    const { is_featured, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM services WHERE is_active = TRUE';
    const params = [];

    if (is_featured === 'true') {
      query += ' AND is_featured = TRUE';
    }

    query += ' ORDER BY display_order ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [services] = await db.query(query, params);

    // Parse JSON fields
    services.forEach(service => {
      if (service.gallery_images) service.gallery_images = JSON.parse(service.gallery_images);
      if (service.features) service.features = JSON.parse(service.features);
    });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách dịch vụ'
    });
  }
});

// GET /api/services/:slug - Lấy chi tiết dịch vụ
router.get('/:slug', async (req, res) => {
  try {
    const [services] = await db.query(
      'SELECT * FROM services WHERE slug = ? AND is_active = TRUE',
      [req.params.slug]
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    const service = services[0];
    if (service.gallery_images) service.gallery_images = JSON.parse(service.gallery_images);
    if (service.features) service.features = JSON.parse(service.features);

    // Increment view count
    await db.query('UPDATE services SET view_count = view_count + 1 WHERE id = ?', [service.id]);

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
});

// POST /api/services/admin/create - Tạo dịch vụ mới
router.post('/admin/create', async (req, res) => {
  try {
    const {
      category_id, name, slug, short_description, full_description, icon, main_image,
      gallery_images, features, is_featured, display_order,
      meta_title, meta_description, meta_keywords
    } = req.body;

    const [result] = await db.query(`
      INSERT INTO services (
        category_id, name, slug, short_description, full_description, icon, main_image,
        gallery_images, features, is_featured, display_order,
        meta_title, meta_description, meta_keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      category_id || null, name, slug, short_description || null, full_description || null,
      icon || null, main_image || null,
      JSON.stringify(gallery_images || []), JSON.stringify(features || []),
      is_featured || false, display_order || 0,
      meta_title || null, meta_description || null, meta_keywords || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo dịch vụ thành công',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo dịch vụ'
    });
  }
});

// GET /api/services/admin/:id - Lấy chi tiết dịch vụ (admin)
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [services] = await db.query(`
      SELECT s.*, c.name as category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `, [id]);

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    const service = services[0];

    // Parse JSON fields
    if (service.gallery_images) service.gallery_images = JSON.parse(service.gallery_images);
    if (service.features) service.features = JSON.parse(service.features);

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
});

// PUT /api/services/admin/:id - Cập nhật dịch vụ
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.gallery_images) updateData.gallery_images = JSON.stringify(updateData.gallery_images);
    if (updateData.features) updateData.features = JSON.stringify(updateData.features);

    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];

    await db.query(`UPDATE services SET ${fields} WHERE id = ?`, values);

    res.json({
      success: true,
      message: 'Cập nhật dịch vụ thành công'
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật dịch vụ'
    });
  }
});

// DELETE /api/services/admin/:id - Xóa dịch vụ
router.delete('/admin/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM services WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Xóa dịch vụ thành công'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa dịch vụ'
    });
  }
});

export default router;

