const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// MongoDB connection string
const getConnectionString = () => {
  const { 
    MONGO_USER, 
    MONGO_PASSWORD, 
    MONGO_HOST, 
    MONGO_PORT, 
    MONGO_DB,
    MONGO_URI 
  } = process.env;

  // If a full URI is provided, use it
  if (MONGO_URI) {
    return MONGO_URI;
  }

  // Otherwise, build the connection string
  if (MONGO_USER && MONGO_PASSWORD) {
    return `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;
  } else {
    return `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;
  }
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const connectionString = getConnectionString();
    await mongoose.connect(connectionString, options);
    logger.info('MongoDB connection established successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Disconnect from MongoDB
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};

// Database connection events
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.info('MongoDB disconnected');
});

// Close the connection if the Node process ends
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
}; 