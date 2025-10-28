// Settings Routes
import express from 'express';
import db from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [settings] = await db.query('SELECT * FROM settings');
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.setting_key] = s.setting_value;
    });
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const [settings] = await db.query('SELECT * FROM settings WHERE setting_key = ?', [req.params.key]);
    if (settings.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy cài đặt' });
    res.json({ success: true, data: settings[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

router.put('/admin/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value } = req.body;
    await db.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, setting_value, setting_value]
    );
    res.json({ success: true, message: 'Cập nhật cài đặt thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

export default router;

