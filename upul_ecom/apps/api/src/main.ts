import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from "cookie-parser";
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from '../../../packages/error-handler/error-middleware'
import swaggerUi from 'swagger-ui-express'
import router from './routes/main.router';

const swaggerDocument = require("./swagger-output.json");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: (req:any) => (req.user ? 1000 : 100),
  message: {error: "Too many requests, Try again later!"},
  standardHeaders: true,
  legacyHeaders: true,
})

app.use(limiter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/docs-json", (req,res) => {
    res.json(swaggerDocument);
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use("/api", router);

app.use(errorMiddleware);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger Docs available at http://localhost:${port}/api-docs`);
});
