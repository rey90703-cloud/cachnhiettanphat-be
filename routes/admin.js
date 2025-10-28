// Admin Routes - Quản lý admin users
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const router = express.Router();

// POST /api/admin/login - Đăng nhập admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await db.query(
      'SELECT * FROM admin_users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    // Update last login
    await db.query('UPDATE admin_users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi đăng nhập'
    });
  }
});

// GET /api/admin/users - Lấy danh sách admin users
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM admin_users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

// POST /api/admin/users/create - Tạo admin user mới
router.post('/users/create', async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO admin_users (username, email, password, full_name, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, full_name, role || 'editor']
    );

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản admin thành công',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập hoặc email đã tồn tại'
      });
    }
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

// PUT /api/admin/users/:id - Cập nhật admin user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, role, is_active, password } = req.body;

    let updateData = { email, full_name, role, is_active };

    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];

    await db.query(`UPDATE admin_users SET ${fields} WHERE id = ?`, values);

    res.json({ success: true, message: 'Cập nhật tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

// DELETE /api/admin/users/:id - Xóa admin user
router.delete('/users/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM admin_users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Xóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

// GET /api/admin/dashboard/stats - Lấy thống kê dashboard
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get products count
    const [productsCount] = await db.query('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');

    // Get services count
    const [servicesCount] = await db.query('SELECT COUNT(*) as count FROM services WHERE is_active = TRUE');

    // Get news count (news table uses is_published instead of is_active)
    const [newsCount] = await db.query('SELECT COUNT(*) as count FROM news WHERE is_published = TRUE');

    // Get unread contacts count
    const [contactsCount] = await db.query('SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = FALSE');

    // Get recent activities (last 10)
    const [recentActivities] = await db.query(`
      SELECT 'product' as type, name as title, created_at
      FROM products
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      UNION ALL
      SELECT 'news' as type, title, created_at
      FROM news
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      UNION ALL
      SELECT 'contact' as type, CONCAT(full_name, ' - ', subject) as title, created_at
      FROM contact_submissions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        stats: {
          products: productsCount[0].count,
          services: servicesCount[0].count,
          news: newsCount[0].count,
          contacts: contactsCount[0].count
        },
        recentActivities
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thống kê'
    });
  }
});

export default router;

