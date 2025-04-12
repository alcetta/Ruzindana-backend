import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { notFound, errorHandler } from './middlewares/error.js'; // ✅ This must match the export in error.js

// Configure environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

// PayPal config route
app.get('/api/config/paypal', (req, res) =>
  res.send(process.env.PAYPAL_CLIENT_ID)
);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
    );
  }
);
