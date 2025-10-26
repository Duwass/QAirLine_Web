/**
 * Offer Service Entry Point
 * 
 * Purpose: Initialize and start the offer microservice
 * Port: 4004 (configurable via environment variable)
 * 
 * Responsibilities:
 * - Setup Express application
 * - Configure middleware (CORS, JSON parsing)
 * - Register offer routes
 * - Start HTTP server
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import offerRoutes from './routes/offerRoutes';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware configuration
app.use(cors());  // Enable Cross-Origin Resource Sharing
app.use(express.json());  // Parse JSON request bodies

// Register routes
// All offer endpoints will be prefixed with /api/Offers
app.use('/api/Offers', offerRoutes);

/**
 * Health check endpoint
 * Used for monitoring service availability
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

/**
 * Kubernetes/Docker health check endpoint
 * Returns simple OK status for container orchestration
 */
app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

// Start server
const PORT = process.env.PORT || 4004;

app.listen(PORT, () => {
  console.log(`Offer service is running on port ${PORT}`);
});