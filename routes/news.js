// News Routes
import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /api/news - Lấy danh sách tin tức
router.get('/', async (req, res) => {
  try {
    const { is_featured, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT n.*, a.full_name as author_name
      FROM news n
      LEFT JOIN admin_users a ON n.author_id = a.id
      WHERE n.is_published = TRUE
    `;
    const params = [];

    if (is_featured === 'true') {
      query += ' AND n.is_featured = TRUE';
    }

    query += ' ORDER BY n.published_at DESC, n.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [news] = await db.query(query, params);

    // Parse JSON fields and add image_url alias
    news.forEach(item => {
      if (item.gallery_images) item.gallery_images = JSON.parse(item.gallery_images);
      if (item.tags) item.tags = JSON.parse(item.tags);
      // Add image_url as alias for featured_image
      item.image_url = item.featured_image;
    });

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách tin tức'
    });
  }
});

// GET /api/news/:slug - Lấy chi tiết tin tức
router.get('/:slug', async (req, res) => {
  try {
    const [news] = await db.query(`
      SELECT n.*, a.full_name as author_name
      FROM news n
      LEFT JOIN admin_users a ON n.author_id = a.id
      WHERE n.slug = ? AND n.is_published = TRUE
    `, [req.params.slug]);

    if (news.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức'
      });
    }

    const newsItem = news[0];
    if (newsItem.gallery_images) newsItem.gallery_images = JSON.parse(newsItem.gallery_images);
    if (newsItem.tags) newsItem.tags = JSON.parse(newsItem.tags);

    // Increment view count
    await db.query('UPDATE news SET view_count = view_count + 1 WHERE id = ?', [newsItem.id]);

    res.json({
      success: true,
      data: newsItem
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
});

// GET /api/news/admin/:id - Lấy chi tiết tin tức theo ID (cho admin)
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [news] = await db.query(`
      SELECT n.*, a.full_name as author_name
      FROM news n
      LEFT JOIN admin_users a ON n.author_id = a.id
      WHERE n.id = ?
    `, [id]);

    if (news.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức'
      });
    }

    const newsItem = news[0];

    // Parse JSON fields and add image_url alias
    if (newsItem.gallery_images) newsItem.gallery_images = JSON.parse(newsItem.gallery_images);
    if (newsItem.tags) newsItem.tags = JSON.parse(newsItem.tags);
    // Add image_url as alias for featured_image
    newsItem.image_url = newsItem.featured_image;

    res.json({
      success: true,
      data: newsItem
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
});

// POST /api/news/admin - Tạo tin tức mới
router.post('/admin', async (req, res) => {
  try {
    const {
      title, slug, excerpt, short_description, content, author_id,
      image_url, featured_image, gallery_images, tags, is_featured,
      is_published, published_at,
      meta_title, meta_description, meta_keywords
    } = req.body;

    // Support both image_url and featured_image
    const imageUrl = image_url || featured_image || null;
    const excerptText = excerpt || short_description || null;

    const [result] = await db.query(`
      INSERT INTO news (
        title, slug, excerpt, content, author_id, featured_image,
        gallery_images, tags, is_featured, is_published, published_at,
        meta_title, meta_description, meta_keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, slug, excerptText, content, author_id || null, imageUrl,
      JSON.stringify(gallery_images || []), JSON.stringify(tags || []),
      is_featured || false, is_published !== false, published_at || new Date(),
      meta_title || null, meta_description || null, meta_keywords || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo tin tức thành công',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo tin tức'
    });
  }
});

// PUT /api/news/admin/:id - Cập nhật tin tức
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Support both image_url and featured_image
    if (updateData.image_url !== undefined) {
      updateData.featured_image = updateData.image_url;
      delete updateData.image_url;
    }

    // Support both excerpt and short_description
    if (updateData.short_description !== undefined) {
      updateData.excerpt = updateData.short_description;
      delete updateData.short_description;
    }

    if (updateData.gallery_images) updateData.gallery_images = JSON.stringify(updateData.gallery_images);
    if (updateData.tags) updateData.tags = JSON.stringify(updateData.tags);

    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];

    await db.query(`UPDATE news SET ${fields} WHERE id = ?`, values);

    res.json({
      success: true,
      message: 'Cập nhật tin tức thành công'
    });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật tin tức'
    });
  }
});

// DELETE /api/news/admin/:id - Xóa tin tức
router.delete('/admin/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM news WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Xóa tin tức thành công'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa tin tức'
    });
  }
});

export default router;

