import express, { Request, Response } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'API Gateway is running', timestamp: new Date().toISOString() });
});

// Proxy to Offer Service
app.use('/api/offers', createProxyMiddleware({
  target: process.env.OFFER_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/offers': ''
  },
  onError: (err, req, res) => {
    console.error('Offer Service Error:', err);
    res.status(502).json({ error: 'Offer service unavailable' });
  }
}));

// Proxy to Flight Service
app.use('/api/flights', createProxyMiddleware({
  target: process.env.FLIGHT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/flights': ''
  },
  onError: (err, req, res) => {
    console.error('Flight Service Error:', err);
    res.status(502).json({ error: 'Flight service unavailable' });
  }
}));

// Proxy to Booking Service
app.use('/api/bookings', createProxyMiddleware({
  target: process.env.BOOKING_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/bookings': ''
  },
  onError: (err, req, res) => {
    console.error('Booking Service Error:', err);
    res.status(502).json({ error: 'Booking service unavailable' });
  }
}));

// Proxy to User Service
app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': ''
  },
  onError: (err, req, res) => {
    console.error('User Service Error:', err);
    res.status(502).json({ error: 'User service unavailable' });
  }
}));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

export default app;
