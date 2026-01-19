import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

// Security Middleware
app.use(helmet());

// Rate Limiting (limit each IP to 100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  // Skip rate limiting for health check
  skip: (req) => req.path === '/health',
});
app.use(limiter);

// Compression middleware (should be early in the middleware stack)
app.use(compression({
  level: 6, // Compression level (1-9, 6 is a good balance)
  filter: (req, res) => {
    // Don't compress responses if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other responses
    return compression.filter(req, res);
  },
}));

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Chemical Waste Management API',
    version: '1.0.0',
  });
});

// Import routes
import authRoutes from './routes/auth.routes.js';
import companiesRoutes from './routes/companies.routes.js';
import transportersRoutes from './routes/transporters.routes.js';
import inwardRoutes from './routes/inward.routes.js';
import inwardMaterialsRoutes from './routes/inwardMaterials.routes.js';
import outwardMaterialsRoutes from './routes/outwardMaterials.routes.js';
import outwardRoutes from './routes/outward.routes.js';
import invoicesRoutes from './routes/invoices.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import settingsRoutes from './routes/settings.routes.js';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/transporters', transportersRoutes);
app.use('/api/inward', inwardRoutes);
app.use('/api/inward-materials', inwardMaterialsRoutes);
app.use('/api/outward-materials', outwardMaterialsRoutes);
app.use('/api/outward', outwardRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chemical Waste Management Backend API',
    health: '/health',
    api: '/api',
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

