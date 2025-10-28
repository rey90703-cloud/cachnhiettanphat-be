// Partners Routes
import express from 'express';
import db from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [partners] = await db.query(
      'SELECT * FROM partners WHERE is_active = TRUE ORDER BY display_order ASC, name ASC'
    );
    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [partners] = await db.query('SELECT * FROM partners WHERE id = ?', [id]);
    if (partners.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đối tác' });
    }
    const partner = partners[0];
    // Add alias
    partner.logo_url = partner.logo;
    res.json({ success: true, data: partner });
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.post('/admin', async (req, res) => {
  try {
    const { name, logo_url, website, description, display_order, is_active } = req.body;
    const [result] = await db.query(
      `INSERT INTO partners (name, logo, website, description, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, logo_url, website || null, description || null, display_order || 0, is_active !== false]
    );
    res.status(201).json({ success: true, message: 'Tạo đối tác thành công', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error creating partner:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Map frontend fields to database fields
    if (updateData.logo_url !== undefined) {
      updateData.logo = updateData.logo_url;
      delete updateData.logo_url;
    }

    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    await db.query(`UPDATE partners SET ${fields} WHERE id = ?`, values);
    res.json({ success: true, message: 'Cập nhật đối tác thành công' });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.delete('/admin/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM partners WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Xóa đối tác thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

export default router;

