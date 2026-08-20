import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import aiRoutes from './backend/routes/aiRoutes.js';
import customerRoutes from './backend/routes/customerRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';
import creatorRoutes from './backend/routes/creatorRoutes.js';
import authRoutes from './backend/routes/authRoutes.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { requestId } from './middleware/requestId.js';
import { securityLogger } from './middleware/securityLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestTimeout } from './middleware/timeout.js';
import { healthCheck } from './middleware/healthCheck.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(securityHeaders);
app.use(requestId);
app.use(securityLogger);
app.use(requestTimeout(30000));

// Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(__dirname));

// Mount Enterprise API Routes
app.use('/api/auth', authRoutes);
app.use('/api', aiRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creator', creatorRoutes);

// Rate limiting for auth and expensive/SSRF-sensitive endpoints
app.use('/api/auth/login', rateLimiter);
app.use('/api/analyze-website', rateLimiter);
app.use('/api/recommend', rateLimiter);

// Health Endpoint
app.get('/api/health', healthCheck);

// Fallback to SPA index.html
app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

import fs from 'fs';

// Global error handler (must be after all routes)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ADDUS Platform Server listening on port ${PORT}`);
});
