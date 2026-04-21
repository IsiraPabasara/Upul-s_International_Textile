import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from "cookie-parser";
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

// Middleware and Router imports
import { errorMiddleware } from '../../../packages/error-handler/error-middleware';
import router from './routes/main.router';

const swaggerDocument = require("./swagger-output.json");

const app = express();

/**
 * PRODUCTION CONFIGURATION
 */
// Required for express-rate-limit to see the correct IP address when behind a proxy (Nginx, Heroku, AWS, etc.)
app.set("trust proxy", 1);

/**
 * RATE LIMITERS
 * Logic: Layered protection to prevent CPU exhaustion and infinite Axios refresh loops.
 */

// Layer 1: Global Hard Ceiling (Prevents brute force/DDoS)
const baseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, 
  message: { error: "Extreme traffic detected. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Layer 2: Dynamic Tiered Limiter (Compatible with your Axios Interceptor)
const dynamicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: any) => {
    // Light check: presence of token determines the limit
    const hasToken = req.cookies?.token || req.headers.authorization;
    return hasToken ? 1000 : 100; 
  },
  handler: (req, res, _next, options) => {
    // Use 429 specifically so Frontend Axios interceptor knows NOT to try a refresh
    res.status(429).json({
      error: "Too many requests, try again later!",
      retryAfterSeconds: Math.ceil(options.windowMs / 1000)
    });
  },
  // Essential: Don't block the health check or the refresh-token endpoint
  skip: (req) => {
    const excludedPaths = ['/api/health', '/api/auth/refresh-token'];
    return excludedPaths.some(path => req.path.startsWith(path));
  },
});

/**
 * MIDDLEWARE STACK
 */
app.use(helmet()); // Security headers
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev')); // 'combined' is better for production logs

// Apply Rate Limiters
app.use(baseLimiter);
app.use(dynamicLimiter);

/**
 * ROUTES
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/docs-json", (_req, res) => {
  res.json(swaggerDocument);
});

app.use("/api", router);

/**
 * ERROR HANDLING
 */
app.use(errorMiddleware);

/**
 * SERVER STARTUP & GRACEFUL SHUTDOWN
 */
const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📜 Swagger Docs available at http://localhost:${port}/api-docs`);
});

// Handle termination signals (Docker, PM2, Kubernetes)
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Closed out remaining connections.');
    process.exit(0);
  });

  // Force close if it takes too long
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}