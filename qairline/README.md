# QAirline - Microservices Architecture

## 🎯 Tổng quan

Dự án QAirline được xây dựng theo kiến trúc microservices, bao gồm:

- **API Gateway**: Điểm truy cập duy nhất, định tuyến requests đến các services
- **Booking Service**: Quản lý đặt vé
- **Flight Service**: Quản lý chuyến bay
- **Offer Service**: Quản lý khuyến mãi
- **User Service**: Quản lý người dùng

## 📁 Cấu trúc dự án

```
qairline/
├── api-gateway/              # API Gateway - cổng vào chính
│   ├── src/
│   │   └── index.ts         # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── services/                 # Các microservices
│   ├── booking-service/     # Service quản lý đặt vé
│   │   ├── src/
│   │   │   ├── controllers/ # Xử lý logic nghiệp vụ
│   │   │   ├── database/    # Kết nối DB
│   │   │   ├── routes/      # Định nghĩa routes
│   │   │   └── index.ts     # Entry point
│   │   ├── tests/           # Unit tests
│   │   ├── jest.config.js
│   │   └── package.json
│   │
│   ├── flight-service/      # Service quản lý chuyến bay
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── offer-service/       # Service quản lý khuyến mãi
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── user-service/        # Service quản lý người dùng
│       ├── src/
│       ├── tests/
│       └── package.json
│
└── shared/                  # Thư viện dùng chung (nếu có)
```

## 🛠️ Công nghệ sử dụng

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL
- **Testing**: Jest + Supertest
- **Dev Tools**: ts-node-dev (hot reload)

## 📦 Cài đặt

### 1. Cài đặt dependencies cho tất cả services

```bash
# Cài đặt API Gateway
cd api-gateway
npm install

# Cài đặt từng service
cd .../services/booking-service
npm install

cd .../flight-service
npm install

cd .../offer-service
npm install

cd .../user-service
npm install
```

### 2. Cấu hình Database

Mỗi service cần cấu hình kết nối database riêng (tạo file `.env` trong từng service):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=qairline_db
PORT=3001
```

**Lưu ý**: Mỗi service chạy trên port khác nhau:
- Offer Service: `3001`
- Flight Service: `3002`
- Booking Service: `3003`
- User Service: `3004`
- API Gateway: `3000`

## 🚀 Chạy dự án

### Chạy từng service riêng lẻ (Development mode)

```bash
# Chạy API Gateway
cd api-gateway
npm run dev

# Chạy Booking Service
cd services/booking-service
npm run dev

# Chạy Flight Service
cd services/flight-service
npm run dev

# Chạy Offer Service
cd services/offer-service
npm run dev

# Chạy User Service
cd services/user-service
npm run dev
```

### Build cho production

```bash
# Build từng service
cd services/booking-service
npm run build
npm start

# Tương tự cho các service khác...
```

## 🧪 Chạy test

### Chạy test cho tất cả services

```bash
# Test Booking Service
cd services/booking-service
npm test

# Test Flight Service
cd services/flight-service
npm test

# Test Offer Service
cd services/offer-service
npm test

# Test User Service
cd services/user-service
npm test
```

### Chạy test ở chế độ watch (tự động chạy lại khi có thay đổi)

```bash
cd services/booking-service
npm run test:watch
```

### Chạy test với coverage

```bash
cd services/booking-service
npm test -- --coverage
```

## 🌐 API Endpoints

Tất cả requests đi qua API Gateway tại `http://localhost:3000`

### Booking Service
- `GET /api/bookings` - Lấy danh sách đặt vé
- `GET /api/bookings/:id` - Lấy chi tiết đặt vé
- `POST /api/bookings` - Tạo đặt vé mới
- `PUT /api/bookings/:id` - Cập nhật đặt vé
- `DELETE /api/bookings/:id` - Xóa đặt vé

### Flight Service
- `GET /api/flights` - Lấy danh sách chuyến bay
- `GET /api/flights/:id` - Lấy chi tiết chuyến bay
- `POST /api/flights` - Tạo chuyến bay mới
- `PUT /api/flights/:id` - Cập nhật chuyến bay
- `DELETE /api/flights/:id` - Xóa chuyến bay

### Offer Service
- `GET /api/offers` - Lấy danh sách khuyến mãi
- `GET /api/offers/:id` - Lấy chi tiết khuyến mãi
- `POST /api/offers` - Tạo khuyến mãi mới
- `PUT /api/offers/:id` - Cập nhật khuyến mãi
- `DELETE /api/offers/:id` - Xóa khuyến mãi

### User Service
- `GET /api/users` - Lấy danh sách người dùng
- `GET /api/users/:id` - Lấy chi tiết người dùng
- `POST /api/users` - Tạo người dùng mới
- `PUT /api/users/:id` - Cập nhật người dùng
- `DELETE /api/users/:id` - Xóa người dùng

### Health Check
- `GET /health` - Kiểm tra trạng thái API Gateway

## 📝 Ghi chú quan trọng

1. **Thứ tự khởi động**: Khởi động các services trước, sau đó mới khởi động API Gateway
2. **Database**: Đảm bảo MySQL đã được cài đặt và chạy
3. **Port conflicts**: Kiểm tra không có service nào khác đang sử dụng các port 3000-3004
4. **Environment variables**: Nhớ tạo file `.env` cho từng service

## 🐛 Debug

Nếu gặp lỗi:

1. Kiểm tra console log của service bị lỗi
2. Kiểm tra kết nối database
3. Kiểm tra port đã được sử dụng chưa
4. Xem API Gateway logs để biết request được route đến đâu