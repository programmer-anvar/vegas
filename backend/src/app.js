import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { notFoundHandler, errorHandler } from '#middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import posRoutes from './routes/pos.routes.js';
import { clientUrl, env, trustProxy } from '#config/env.js';

const app = express();

if (trustProxy) app.set('trust proxy', trustProxy);

app.use(helmet());
app.use(compression());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pos', posRoutes);

if (env === 'development') {
  app.use(morgan('dev'));
}

app.get('/', (req, res) => {
  res.json({ message: 'VEGAS API ishlayapti ' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
