# API Gateway - QAirline

API Gateway cho hệ thống microservices của QAirline.

## Chức năng

- Định tuyến requests đến các microservices
- Load balancing
- Error handling
- CORS configuration

## Cài đặt

```bash
npm install
```

## Chạy development

```bash
npm run dev
```

## Build production

```bash
npm run build
npm start
```

## Routes

- `/api/offers/*` → Offer Service (port 3001)
- `/api/flights/*` → Flight Service (port 3002)
- `/api/bookings/*` → Booking Service (port 3003)
- `/api/users/*` → User Service (port 3004)
- `/health` → Health check

## Environment Variables

Copy `.env.example` to `.env` và cấu hình các service URLs.
