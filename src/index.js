const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeFirebaseAdmin } = require('./config/firebase');
const initializeDatabase = require('./config/db-init');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin
initializeFirebaseAdmin();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server if not being required by another module (clustering setup)
    if (!module.parent) {
      app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
      });
    } else {
      // When imported by clustering module, just initialize the database
      const server = app.listen(PORT, () => {
        logger.info(`Worker server is running on port ${PORT}`);
      });

      // Export server for graceful shutdown
      module.exports = server;
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export the app for testing or cluster usage
module.exports = app; 