import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import teamRoutes from "./routes/teamRoutes.js";
import { env } from './config/env.js';
import { getDynamicSitemap } from './controllers/seo.controller.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import blogRoutes from './routes/blog.routes.js';
import contactRoutes from './routes/contact.routes.js';
import authRoutes from './routes/auth.routes.js';
import apiRoutes from './routes/index.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((v) => v.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(helmet());
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers.accept?.includes('text/event-stream') || req.path.includes('/events/stream')) {
        return false;
      }

      return compression.filter(req, res);
    },
  }),
);
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: false, limit: '8mb' }));
app.use(cookieParser());
app.use((req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});
app.use(hpp());
if (env.NODE_ENV === 'production') {
  app.use(globalLimiter);
}
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));


app.get('/sitemap.xml', getDynamicSitemap);
app.get('/api/sitemap.xml', getDynamicSitemap);
app.use(['/api/v1/blogs', '/api/blogposts'], (req, _res, next) => {
  console.info('[blog:request]', {
    method: req.method,
    path: req.originalUrl,
    origin: req.headers.origin || 'unknown',
  });
  next();
});

app.use('/api/v1', apiRoutes);
// Backwards-compatible auth alias for clients expecting /api/auth/... instead of /api/v1/auth/...
app.use('/api/auth', authRoutes);
app.use('/api/blogposts', blogRoutes);
app.use('/api/contact', contactRoutes);


app.use("/api/team", teamRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
