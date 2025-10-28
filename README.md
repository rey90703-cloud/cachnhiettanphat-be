# Backend API - Cách Nhiệt Bình Minh

Backend API cho website Cách Nhiệt Bình Minh, xây dựng bằng Node.js + Express + MySQL.

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Cấu hình database

#### Bước 1: Tạo database trong XAMPP

1. Mở XAMPP Control Panel
2. Start MySQL
3. Mở phpMyAdmin: `http://localhost/phpmyadmin`
4. Import file `../database/schema.sql` để tạo database và tables

#### Bước 2: Cấu hình kết nối

1. Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

2. Chỉnh sửa file `.env` (nếu cần):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cachnhiet_binhminh
```

### 3. Chạy server

#### Development mode (với nodemon - auto restart):
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📡 API Endpoints

### Public Endpoints (Frontend)

#### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:slug` - Lấy chi tiết sản phẩm

#### Services
- `GET /api/services` - Lấy danh sách dịch vụ
- `GET /api/services/:slug` - Lấy chi tiết dịch vụ

#### News
- `GET /api/news` - Lấy danh sách tin tức
- `GET /api/news/:slug` - Lấy chi tiết tin tức

#### Categories
- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/categories/:slug` - Lấy chi tiết danh mục

#### Contact
- `POST /api/contact/submit` - Gửi form liên hệ

#### Projects
- `GET /api/projects` - Lấy danh sách dự án

#### Testimonials
- `GET /api/testimonials` - Lấy danh sách đánh giá

#### Partners
- `GET /api/partners` - Lấy danh sách đối tác

#### Settings
- `GET /api/settings` - Lấy cài đặt website

### Admin Endpoints

#### Admin Auth
- `POST /api/admin/login` - Đăng nhập admin

#### Admin Users
- `GET /api/admin/users` - Lấy danh sách admin users
- `POST /api/admin/users/create` - Tạo admin user mới
- `PUT /api/admin/users/:id` - Cập nhật admin user
- `DELETE /api/admin/users/:id` - Xóa admin user

#### Admin Products
- `POST /api/products/admin/create` - Tạo sản phẩm mới
- `PUT /api/products/admin/:id` - Cập nhật sản phẩm
- `DELETE /api/products/admin/:id` - Xóa sản phẩm

#### Admin Services
- `POST /api/services/admin/create` - Tạo dịch vụ mới
- `PUT /api/services/admin/:id` - Cập nhật dịch vụ
- `DELETE /api/services/admin/:id` - Xóa dịch vụ

#### Admin News
- `POST /api/news/admin/create` - Tạo tin tức mới
- `PUT /api/news/admin/:id` - Cập nhật tin tức
- `DELETE /api/news/admin/:id` - Xóa tin tức

#### Admin Contact
- `GET /api/contact/admin/list` - Lấy danh sách liên hệ
- `GET /api/contact/admin/:id` - Lấy chi tiết liên hệ
- `PUT /api/contact/admin/:id/status` - Cập nhật trạng thái liên hệ
- `DELETE /api/contact/admin/:id` - Xóa liên hệ
- `GET /api/contact/admin/stats/summary` - Thống kê liên hệ

## 🔐 Authentication

Admin endpoints yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

Để lấy token, gọi endpoint `/api/admin/login` với:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

## 📦 Database Schema

Database gồm các bảng:
- `admin_users` - Quản trị viên
- `categories` - Danh mục sản phẩm
- `products` - Sản phẩm
- `services` - Dịch vụ
- `news` - Tin tức
- `contact_submissions` - Thông tin liên hệ từ khách hàng
- `projects` - Dự án đã thực hiện
- `testimonials` - Đánh giá khách hàng
- `partners` - Đối tác
- `settings` - Cài đặt website

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **express-validator** - Input validation
- **cors** - CORS middleware
- **dotenv** - Environment variables

## 📝 Notes

- Default admin account:
  - Username: `admin`
  - Password: `admin123` (Nên đổi sau khi setup)

- CORS được cấu hình cho `http://localhost:3000` (frontend Vite)

- Tất cả API responses đều có format:
```json
{
  "success": true/false,
  "message": "...",
  "data": {...}
}
```

## 🔧 Troubleshooting

### Lỗi kết nối database
- Kiểm tra XAMPP MySQL đã start chưa
- Kiểm tra thông tin trong file `.env`
- Kiểm tra database đã được tạo chưa

### Lỗi port đã được sử dụng
- Đổi PORT trong file `.env`
- Hoặc kill process đang dùng port 5000

## 📞 Support

Email: cachnhietbinhminhbd@gmail.com

