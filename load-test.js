/**
 * Simple load testing script for the e-commerce API
 * 
 * Usage:
 *   node load-test.js [endpoint] [concurrent] [requests]
 * 
 * Example:
 *   node load-test.js /api/products 100 1000
 *   (tests 100 concurrent connections making a total of 1000 requests to /api/products)
 */

const http = require('http');
const url = require('url');
const cluster = require('cluster');
const os = require('os');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration (with defaults and command line args)
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;
const endpoint = process.argv[2] || '/api/products';
const concurrentRequests = parseInt(process.argv[3], 10) || 100;
const totalRequests = parseInt(process.argv[4], 10) || 1000;
const workerCount = os.cpus().length;

// Print test configuration
console.log('Load Test Configuration:');
console.log(`API Endpoint: http://${API_HOST}:${API_PORT}${endpoint}`);
console.log(`Concurrent Requests: ${concurrentRequests}`);
console.log(`Total Requests: ${totalRequests}`);
console.log(`Using ${workerCount} worker processes for testing`);
console.log('-'.repeat(50));

// Track results across workers
let completedRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let totalTime = 0;
let maxTime = 0;
let minTime = Number.MAX_SAFE_INTEGER;

// Function to make a request and measure response time
const makeRequest = () => {
  const startTime = process.hrtime();
  
  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: endpoint,
    method: 'GET',
    timeout: 10000 // 10 seconds timeout
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const endTime = process.hrtime(startTime);
      const duration = endTime[0] * 1000 + endTime[1] / 1000000; // in milliseconds
      
      // Only process on master or when no clustering
      if (!cluster.isWorker) {
        completedRequests++;
        totalTime += duration;
        maxTime = Math.max(maxTime, duration);
        minTime = Math.min(minTime, duration);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          successfulRequests++;
        } else {
          failedRequests++;
          console.error(`Request failed with status ${res.statusCode}`);
        }
        
        if (completedRequests % 100 === 0 || completedRequests === totalRequests) {
          console.log(`Completed ${completedRequests}/${totalRequests} requests`);
        }
        
        // Print results if all requests are completed
        if (completedRequests === totalRequests) {
          printResults();
        }
      } else {
        // If running as a worker, send results to master
        process.send({ 
          success: res.statusCode >= 200 && res.statusCode < 300,
          duration: duration
        });
      }
    });
  });
  
  req.on('error', (e) => {
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000; // in milliseconds
    
    if (!cluster.isWorker) {
      completedRequests++;
      failedRequests++;
      totalTime += duration;
      
      console.error(`Request error: ${e.message}`);
      
      if (completedRequests === totalRequests) {
        printResults();
      }
    } else {
      process.send({ 
        success: false,
        duration: duration,
        error: e.message
      });
    }
  });
  
  req.end();
};

// Print test results
const printResults = () => {
  console.log('\nLoad Test Results:');
  console.log('-'.repeat(50));
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful Requests: ${successfulRequests}`);
  console.log(`Failed Requests: ${failedRequests}`);
  console.log(`Success Rate: ${((successfulRequests / totalRequests) * 100).toFixed(2)}%`);
  console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average Response Time: ${(totalTime / totalRequests).toFixed(2)}ms`);
  console.log(`Min Response Time: ${minTime.toFixed(2)}ms`);
  console.log(`Max Response Time: ${maxTime.toFixed(2)}ms`);
  console.log(`Requests Per Second: ${(totalRequests / (totalTime / 1000)).toFixed(2)}`);
  
  process.exit(0);
};

// Run load test in cluster mode
if (cluster.isMaster || cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);
  
  // Calculate requests per worker
  const requestsPerWorker = Math.floor(totalRequests / workerCount);
  let remainingRequests = totalRequests - (requestsPerWorker * workerCount);
  
  // Track worker results
  const workerResults = {};
  
  // Create workers
  for (let i = 0; i < workerCount; i++) {
    const worker = cluster.fork();
    
    // Assign number of requests to this worker
    let workerRequests = requestsPerWorker;
    if (remainingRequests > 0) {
      workerRequests++;
      remainingRequests--;
    }
    
    worker.send({ requests: workerRequests, concurrent: Math.min(concurrentRequests / workerCount, workerRequests) });
    
    // Initialize results tracker for this worker
    workerResults[worker.id] = {
      completed: 0,
      successful: 0,
      failed: 0,
      totalTime: 0,
      maxTime: 0,
      minTime: Number.MAX_SAFE_INTEGER
    };
    
    // Handle messages from worker
    worker.on('message', (msg) => {
      workerResults[worker.id].completed++;
      
      if (msg.success) {
        workerResults[worker.id].successful++;
      } else {
        workerResults[worker.id].failed++;
        if (msg.error) {
          console.error(`Worker ${worker.id} error: ${msg.error}`);
        }
      }
      
      workerResults[worker.id].totalTime += msg.duration;
      workerResults[worker.id].maxTime = Math.max(workerResults[worker.id].maxTime, msg.duration);
      workerResults[worker.id].minTime = Math.min(workerResults[worker.id].minTime, msg.duration);
      
      // Update master counters
      completedRequests++;
      successfulRequests = Object.values(workerResults).reduce((sum, r) => sum + r.successful, 0);
      failedRequests = Object.values(workerResults).reduce((sum, r) => sum + r.failed, 0);
      totalTime = Object.values(workerResults).reduce((sum, r) => sum + r.totalTime, 0);
      
      // Update min/max
      const workersMaxTime = Math.max(...Object.values(workerResults).map(r => r.maxTime));
      const workersMinTime = Math.min(...Object.values(workerResults).map(r => r.minTime));
      maxTime = Math.max(maxTime, workersMaxTime);
      minTime = Math.min(minTime, workersMinTime);
      
      if (completedRequests % 100 === 0 || completedRequests === totalRequests) {
        console.log(`Completed ${completedRequests}/${totalRequests} requests`);
      }
      
      // Print results if all requests are completed
      if (completedRequests === totalRequests) {
        printResults();
      }
    });
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} finished`);
  });
} else {
  // Worker process
  console.log(`Worker ${process.pid} started`);
  
  process.on('message', (msg) => {
    const { requests, concurrent } = msg;
    console.log(`Worker ${process.pid} will make ${requests} requests with ${concurrent} concurrency`);
    
    // Track active requests
    let active = 0;
    let completed = 0;
    
    // Function to send a request and track concurrency
    const sendRequest = () => {
      active++;
      
      makeRequest();
      
      // When the request is done
      process.on('message', () => {
        active--;
        completed++;
        
        // If we still have requests to send
        if (completed < requests) {
          sendRequest();
        } else if (active === 0) {
          // If we've sent all requests and none are active, exit
          console.log(`Worker ${process.pid} completed all requests`);
        }
      });
    };
    
    // Start initial batch of concurrent requests
    for (let i = 0; i < Math.min(concurrent, requests); i++) {
      sendRequest();
    }
  });
} 