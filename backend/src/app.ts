import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';
import vtuRoutes from './routes/vtu.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import userRoutes from './routes/user.routes';
import systemRoutes from './routes/system.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import { paystackWebhook } from './controllers/webhook.controller';

const app = express();

// Trust Railway proxy
app.set('trust proxy', 1);

const webhookJsonParser = express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
});

app.post('/api/webhooks/paystack', webhookJsonParser, paystackWebhook);
app.post('/api/webhooks/paymentpoint', webhookJsonParser, paystackWebhook);

// Security Headers & CSP
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", "https:", "data:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
}));

// CORS setup
app.use(cors());

// Parse JSON payloads with a larger limit for profile pictures
app.use(express.json({ limit: '5mb' }));

// Apply global rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vtu', vtuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Healthcheck route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
