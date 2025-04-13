/**
 * E-commerce API Server with Clustering
 * 
 * This file implements Node.js clustering to take advantage of multi-core systems,
 * improving the application's performance and reliability.
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

// Then load the logger
const logger = require('./src/utils/logger');

// Number of CPUs
const numCPUs = process.env.WORKER_COUNT || os.cpus().length;

// Get PORT from environment variables
const PORT = process.env.PORT || 3000;

// Track worker servers for proper shutdown
const workers = {};

// Implement clustering
if (cluster.isPrimary || cluster.isMaster) {
  logger.info(`Master process ${process.pid} is running`);
  logger.info(`Setting up ${numCPUs} workers...`);

  // Fork workers equal to CPU cores or configured amount
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers[worker.id] = worker;
  }

  // Log when a worker exits and fork a new one
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);
    
    // Remove the worker from our tracking
    delete workers[worker.id];
    
    // Fork a new worker to replace the dead one
    logger.info('Starting a new worker...');
    const newWorker = cluster.fork();
    workers[newWorker.id] = newWorker;
  });

  // Log when a new worker is online
  cluster.on('online', (worker) => {
    logger.info(`Worker ${worker.process.pid} is online`);
  });

  // Handle graceful shutdown on various signals
  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => {
      logger.info(`${signal} signal received: closing HTTP server`);
      
      // Tell all workers to gracefully shut down
      Object.values(workers).forEach(worker => {
        worker.send('shutdown');
      });

      // Set a timeout to forcefully exit if workers don't exit gracefully
      setTimeout(() => {
        logger.warn('Forcing shutdown after timeout');
        process.exit(1);
      }, 15000); // 15 second timeout
      
      // Exit cleanly if all workers exit
      cluster.on('exit', () => {
        if (Object.keys(workers).length === 0) {
          logger.info('All workers have exited, shutting down master');
          process.exit(0);
        }
      });
    });
  });
} else {
  // Worker processes - import the actual application
  try {
    // Import the app (which will start listening on the port)
    const server = require('./src/index');
    
    // Listen for shutdown message from master
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        logger.info(`Worker ${process.pid} received shutdown message`);
        
        // Close the HTTP server gracefully
        if (server.close) {
          server.close(() => {
            logger.info(`Worker ${process.pid} closed connections and exiting`);
            process.exit(0);
          });
          
          // Force exit after timeout in case some connections hang
          setTimeout(() => {
            logger.warn(`Worker ${process.pid} forcing exit after timeout`);
            process.exit(0);
          }, 10000);
        } else {
          // If server.close is not available, just exit
          process.exit(0);
        }
      }
    });
    
    logger.info(`Worker ${process.pid} started and ready to handle connections`);
  } catch (error) {
    logger.error(`Worker ${process.pid} failed to start:`, error);
    process.exit(1);
  }
} 