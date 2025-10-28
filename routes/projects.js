// Projects Routes
import express from 'express';
import db from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [projects] = await db.query(
      'SELECT * FROM projects WHERE is_active = TRUE ORDER BY display_order ASC, completion_date DESC'
    );
    projects.forEach(p => {
      if (p.gallery_images) p.gallery_images = JSON.parse(p.gallery_images);
      if (p.services_used) p.services_used = JSON.parse(p.services_used);
    });
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dự án' });
    }
    const project = projects[0];
    if (project.gallery_images) project.gallery_images = JSON.parse(project.gallery_images);
    if (project.services_used) project.services_used = JSON.parse(project.services_used);
    // Add image_url alias
    project.image_url = project.featured_image;
    project.client = project.client_name;
    project.completed_date = project.completion_date;
    project.description = project.short_description;
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const [projects] = await db.query('SELECT * FROM projects WHERE slug = ? AND is_active = TRUE', [req.params.slug]);
    if (projects.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy dự án' });
    const project = projects[0];
    if (project.gallery_images) project.gallery_images = JSON.parse(project.gallery_images);
    if (project.services_used) project.services_used = JSON.parse(project.services_used);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.post('/admin', async (req, res) => {
  try {
    const { name, client, location, completed_date, description, image_url, is_active } = req.body;

    // Generate slug from name
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const [result] = await db.query(
      `INSERT INTO projects (name, slug, client_name, location, completion_date, short_description, featured_image, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, client || null, location || null, completed_date || null, description || null, image_url || null, is_active !== false]
    );
    res.status(201).json({ success: true, message: 'Tạo dự án thành công', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Map frontend fields to database fields
    if (updateData.image_url !== undefined) {
      updateData.featured_image = updateData.image_url;
      delete updateData.image_url;
    }
    if (updateData.client !== undefined) {
      updateData.client_name = updateData.client;
      delete updateData.client;
    }
    if (updateData.completed_date !== undefined) {
      updateData.completion_date = updateData.completed_date;
      delete updateData.completed_date;
    }
    if (updateData.description !== undefined) {
      updateData.short_description = updateData.description;
      delete updateData.description;
    }

    if (updateData.gallery_images) updateData.gallery_images = JSON.stringify(updateData.gallery_images);
    if (updateData.services_used) updateData.services_used = JSON.stringify(updateData.services_used);

    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    await db.query(`UPDATE projects SET ${fields} WHERE id = ?`, values);
    res.json({ success: true, message: 'Cập nhật dự án thành công' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.delete('/admin/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Xóa dự án thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

export default router;

