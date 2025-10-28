// Products Routes
import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';

const router = express.Router();

// =====================================================
// PUBLIC ROUTES - Cho Frontend
// =====================================================

/**
 * GET /api/products
 * Lấy danh sách sản phẩm (có phân trang, filter)
 */
router.get('/', async (req, res) => {
  try {
    const {
      category_id,
      is_featured,
      is_bestseller,
      search,
      page = 1,
      limit = 12
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
    `;
    const params = [];

    // Filters
    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (is_featured === 'true') {
      query += ' AND p.is_featured = TRUE';
    }

    if (is_bestseller === 'true') {
      query += ' AND p.is_bestseller = TRUE';
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.short_description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Order and pagination
    query += ' ORDER BY p.display_order ASC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await db.query(query, params);

    // Parse JSON fields
    products.forEach(product => {
      if (product.gallery_images) product.gallery_images = JSON.parse(product.gallery_images);
      if (product.specifications) product.specifications = JSON.parse(product.specifications);
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE';
    const countParams = [];
    if (category_id) {
      countQuery += ' AND category_id = ?';
      countParams.push(category_id);
    }
    if (is_featured === 'true') countQuery += ' AND is_featured = TRUE';
    if (is_bestseller === 'true') countQuery += ' AND is_bestseller = TRUE';
    if (search) {
      countQuery += ' AND (name LIKE ? OR short_description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách sản phẩm'
    });
  }
});

/**
 * GET /api/products/featured-in-header
 * Lấy sản phẩm được chọn hiển thị trên header dropdown
 */
router.get('/featured-in-header', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.featured_in_header = TRUE AND p.is_active = TRUE
      ORDER BY p.display_order ASC, p.created_at DESC
    `);

    // Parse JSON fields
    products.forEach(product => {
      if (product.gallery_images) product.gallery_images = JSON.parse(product.gallery_images);
      if (product.specifications) product.specifications = JSON.parse(product.specifications);
    });

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy sản phẩm nổi bật'
    });
  }
});

/**
 * GET /api/products/:slug
 * Lấy chi tiết sản phẩm theo slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [products] = await db.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.is_active = TRUE
    `, [slug]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    const product = products[0];

    // Parse JSON fields
    if (product.gallery_images) product.gallery_images = JSON.parse(product.gallery_images);
    if (product.specifications) product.specifications = JSON.parse(product.specifications);

    // Increment view count
    await db.query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [product.id]);

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thông tin sản phẩm'
    });
  }
});

// =====================================================
// ADMIN ROUTES - Quản lý sản phẩm
// =====================================================

/**
 * GET /api/products/admin/list
 * Lấy tất cả sản phẩm (cho admin, bao gồm cả inactive)
 */
router.get('/admin/list', async (req, res) => {
  try {
    const { search, category_id, limit = 1000 } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.short_description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.display_order ASC, p.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [products] = await db.query(query, params);

    // Parse JSON fields
    products.forEach(product => {
      if (product.gallery_images) product.gallery_images = JSON.parse(product.gallery_images);
      if (product.specifications) product.specifications = JSON.parse(product.specifications);
    });

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách sản phẩm'
    });
  }
});

/**
 * GET /api/products/admin/:id
 * Lấy chi tiết sản phẩm theo ID (cho admin)
 */
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.json({
      success: true,
      data: products[0]
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy sản phẩm'
    });
  }
});

/**
 * POST /api/products/admin
 * Tạo sản phẩm mới
 */
router.post('/admin',
  [
    body('category_id').isInt().withMessage('Category ID không hợp lệ'),
    body('name').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
    body('slug').trim().notEmpty().withMessage('Slug không được để trống')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const {
        category_id, name, slug, short_description, full_description,
        price, sale_price, unit, sku, stock_quantity, main_image, image2,
        gallery_images, specifications, is_featured, is_bestseller,
        featured_in_header, display_order, meta_title, meta_description, meta_keywords,
        notes
      } = req.body;

      const [result] = await db.query(`
        INSERT INTO products (
          category_id, name, slug, short_description, full_description,
          price, sale_price, unit, sku, stock_quantity, main_image, image2,
          gallery_images, specifications, is_featured, is_bestseller,
          featured_in_header, display_order, meta_title, meta_description, meta_keywords,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        category_id, name, slug, short_description || null, full_description || null,
        price || 0, sale_price || null, unit || 'tấm', sku || null, stock_quantity || 0,
        main_image || null, image2 || null, JSON.stringify(gallery_images || []),
        JSON.stringify(specifications || {}), is_featured || false, is_bestseller || false,
        featured_in_header || false, display_order || 0, meta_title || null, meta_description || null, meta_keywords || null,
        notes || null
      ]);

      res.status(201).json({
        success: true,
        message: 'Tạo sản phẩm thành công',
        data: { id: result.insertId }
      });

    } catch (error) {
      console.error('Error creating product:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Slug đã tồn tại'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tạo sản phẩm'
      });
    }
  }
);

/**
 * PUT /api/products/admin/:id
 * Cập nhật sản phẩm
 */
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert arrays/objects to JSON strings
    if (updateData.gallery_images) updateData.gallery_images = JSON.stringify(updateData.gallery_images);
    if (updateData.specifications) updateData.specifications = JSON.stringify(updateData.specifications);

    // Filter out invalid columns
    const validColumns = [
      'category_id', 'name', 'slug', 'short_description', 'full_description',
      'price', 'sale_price', 'unit', 'sku', 'stock_quantity', 'main_image', 'image2',
      'gallery_images', 'specifications', 'is_featured', 'is_bestseller',
      'featured_in_header', 'display_order', 'meta_title', 'meta_description', 'meta_keywords',
      'notes', 'is_active'
    ];

    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (validColumns.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật'
      });
    }

    const fields = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(filteredData), id];

    await db.query(`UPDATE products SET ${fields} WHERE id = ?`, values);

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật sản phẩm'
    });
  }
});

/**
 * DELETE /api/products/admin/:id
 * Xóa sản phẩm
 */
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa sản phẩm'
    });
  }
});

export default router;

