import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import winston from 'winston';
import { Pool } from 'pg';
import { createClient } from 'redis';

dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3000;

// Initialize Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.errors({ stack: true })
  ),
  defaultMeta: { service: 'school-result-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Initialize Database Connection Pool
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pgPool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  logger.error('Redis error', err);
});

redisClient.connect().catch((err) => {
  logger.error('Redis connection error', err);
});

// Make pool and redis accessible to request
declare global {
  namespace Express {
    interface Request {
      pool: Pool;
      redis: typeof redisClient;
      schoolId?: string;
      userId?: string;
      userRole?: string;
      user?: {
        id: string;
        school_id: string;
        email: string;
        role: 'admin' | 'teacher' | 'auditor';
      };
    }
  }
}

app.request.pool = pgPool;
app.request.redis = redisClient;

// Middleware Setup

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
    });
  });

  next();
});

// Routes

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Import route creators
import { createAuthRoutes } from './routes/auth';
import { createSchoolsRoutes } from './routes/schools';
import { createUsersRoutes } from './routes/users';
import { createClassesRoutes } from './routes/classes';
import { createPupilsRoutes } from './routes/pupils';
import { createSubjectsRoutes } from './routes/subjects';
import { createResultsRoutes } from './routes/results';

// API v1 routes
app.use('/api/v1/auth', createAuthRoutes(pgPool));
app.use('/api/v1/schools', createSchoolsRoutes(pgPool));
app.use('/api/v1/users', createUsersRoutes(pgPool));
app.use('/api/v1/classes', createClassesRoutes(pgPool));
app.use('/api/v1/pupils', createPupilsRoutes(pgPool));
app.use('/api/v1/subjects', createSubjectsRoutes(pgPool));
app.use('/api/v1/results', createResultsRoutes(pgPool));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
    timestamp: new Date().toISOString(),
  });
});

// Start Server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'connecting...'}`);
  logger.info(`💾 Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');

  server.close(async () => {
    logger.info('HTTP server closed');
    await pgPool.end();
    await redisClient.quit();
    logger.info('Database and cache connections closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
});

export default app;
