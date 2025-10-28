// Categories Routes
import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /api/categories - Lấy tất cả danh mục
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT * FROM categories
      WHERE is_active = TRUE
      ORDER BY id ASC
    `);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh mục'
    });
  }
});

// GET /api/categories/parent/:parentId - Lấy danh mục con theo parent_id
router.get('/parent/:parentId', async (req, res) => {
  try {
    const [subcategories] = await db.query(`
      SELECT * FROM categories
      WHERE parent_id = ? AND is_active = TRUE
      ORDER BY id ASC
    `, [req.params.parentId]);

    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh mục con'
    });
  }
});

// GET /api/categories/:slug - Lấy chi tiết danh mục
router.get('/:slug', async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE slug = ? AND is_active = TRUE',
      [req.params.slug]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    res.json({
      success: true,
      data: categories[0]
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
});

// GET /api/categories/admin/list - Lấy tất cả danh mục (admin)
router.get('/admin/list/all', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT * FROM categories
      ORDER BY id ASC
    `);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh mục'
    });
  }
});

// GET /api/categories/admin/:id - Lấy chi tiết danh mục (admin)
router.get('/admin/:id', async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE id = ?',
      [req.params.id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    res.json({
      success: true,
      data: categories[0]
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra'
    });
  }
});

// POST /api/categories/admin/create - Tạo danh mục mới
router.post('/admin/create', async (req, res) => {
  try {
    const { name, slug, description, full_content, parent_id, image_url, display_order } = req.body;

    const [result] = await db.query(
      `INSERT INTO categories (name, slug, description, full_content, parent_id, image_url, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description || null, full_content || null, parent_id || null, image_url || null, display_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo danh mục'
    });
  }
});

// PUT /api/categories/admin/:id - Cập nhật danh mục
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];

    await db.query(`UPDATE categories SET ${fields} WHERE id = ?`, values);

    res.json({
      success: true,
      message: 'Cập nhật danh mục thành công'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật danh mục'
    });
  }
});

// DELETE /api/categories/admin/:id - Xóa danh mục
router.delete('/admin/:id', async (req, res) => {
  try {
    // Kiểm tra xem category có products không
    const [products] = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [req.params.id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục này vì có ${products[0].count} sản phẩm đang sử dụng`
      });
    }

    // Kiểm tra xem category có sub-categories không
    const [subCategories] = await db.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
      [req.params.id]
    );

    if (subCategories[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục này vì có ${subCategories[0].count} danh mục con`
      });
    }

    // Xóa category
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Xóa danh mục thành công'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa danh mục'
    });
  }
});

export default router;

