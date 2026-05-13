import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import toolsRoutes from './routes/tools.js';
import categoriesRoutes from './routes/categories.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import movementsRoutes from './routes/movements.js';
import dashboardRoutes from './routes/dashboard.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ToolBox Manager API is running' });
});

app.use(notFound);
app.use(errorHandler);

export default app;
