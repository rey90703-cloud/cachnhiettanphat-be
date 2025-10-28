// Main Server File
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import servicesRoutes from './routes/services.js';
import newsRoutes from './routes/news.js';
import contactRoutes from './routes/contact.js';
import projectsRoutes from './routes/projects.js';
import testimonialsRoutes from './routes/testimonials.js';
import partnersRoutes from './routes/partners.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';

// Load environment variables
dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Cách Nhiệt Bình Minh API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Cách Nhiệt Bình Minh API Server                 ║
║                                                       ║
║   📡 Server running on: http://localhost:${PORT}      ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   📅 Started at: ${new Date().toLocaleString('vi-VN')}        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;

