/**
 * E-commerce API Endpoint Test Script
 * 
 * This script tests the API endpoints to verify they're working correctly
 * and returning the expected response formats.
 */

const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const LOG_FILE = './endpoint-test-results.log';

// Test user credentials - these should be for a test user in your system
// You may need to replace these with valid credentials
let testUserToken = '';

// Initialize log file
fs.writeFileSync(LOG_FILE, `API Endpoint Test Results\n${new Date().toISOString()}\n\n`);

// Utility function to log results
const logResult = (endpoint, success, data = null, error = null) => {
  const result = success ? 'SUCCESS' : 'FAILURE';
  const message = `[${result}] ${endpoint}: ${error || 'OK'}`;
  
  console.log(message);
  
  fs.appendFileSync(LOG_FILE, message + '\n');
  if (data) {
    fs.appendFileSync(LOG_FILE, JSON.stringify(data, null, 2) + '\n\n');
  }
  if (error) {
    fs.appendFileSync(LOG_FILE, error + '\n\n');
  }
};

// Get auth token (would typically use Firebase Auth)
// For testing purposes, you'd need to obtain a valid token
// This is a placeholder that you would replace with actual auth 
const getAuthToken = async () => {
  console.log('NOTE: You need to manually set a valid Firebase auth token to test authenticated endpoints');
  console.log('You can get this token from your browser local storage or by using the Firebase Admin SDK');
  
  // For testing, if you have a token, you can replace this
  testUserToken = process.env.TEST_AUTH_TOKEN || '';
  
  if (!testUserToken) {
    console.warn('Warning: No auth token provided. Authenticated tests will fail.');
  }
  
  return testUserToken;
};

// Test API endpoints
const testEndpoints = async () => {
  try {
    // 1. Get auth token for authenticated requests
    await getAuthToken();
    
    const authHeaders = testUserToken ? {
      Authorization: `Bearer ${testUserToken}`
    } : {};

    // Store test data
    let testProductId = '';
    let testCartItemId = '';
    let testOrderId = '';
    
    // 2. Test public product endpoints
    console.log('\n--- Testing Public Product Endpoints ---');
    
    // 2.1 Get all products
    try {
      const productsResponse = await axios.get(`${API_URL}/api/products`);
      logResult('/api/products', true, productsResponse.data);
      
      // Save a product ID for later tests
      if (productsResponse.data.products && productsResponse.data.products.length > 0) {
        testProductId = productsResponse.data.products[0].id;
      }
    } catch (error) {
      logResult('/api/products', false, null, error.message);
    }
    
    // 2.2 Get a single product
    if (testProductId) {
      try {
        const productResponse = await axios.get(`${API_URL}/api/products/${testProductId}`);
        logResult(`/api/products/${testProductId}`, true, productResponse.data);
      } catch (error) {
        logResult(`/api/products/${testProductId}`, false, null, error.message);
      }
    } else {
      logResult('Get single product', false, null, 'No product ID available to test');
    }
    
    // Skip authenticated tests if no token available
    if (!testUserToken) {
      console.log('\nSkipping authenticated tests - no auth token available');
      return;
    }
    
    // 3. Test cart endpoints
    console.log('\n--- Testing Cart Endpoints ---');
    
    // 3.1 Get cart (initially empty or existing)
    try {
      const cartResponse = await axios.get(`${API_URL}/api/cart`, { headers: authHeaders });
      logResult('/api/cart', true, cartResponse.data);
    } catch (error) {
      logResult('/api/cart', false, null, error.message);
    }
    
    // 3.2 Add item to cart (requires valid product ID)
    if (testProductId) {
      try {
        const addCartResponse = await axios.post(
          `${API_URL}/api/cart`, 
          { product_id: testProductId, quantity: 1 },
          { headers: authHeaders }
        );
        logResult('/api/cart (POST)', true, addCartResponse.data);
        
        // Get cart item ID for update test
        if (addCartResponse.data.cart && addCartResponse.data.cart.cartItems && addCartResponse.data.cart.cartItems.length > 0) {
          testCartItemId = addCartResponse.data.cart.cartItems[0].id;
        }
      } catch (error) {
        logResult('/api/cart (POST)', false, null, error.message);
      }
    }
    
    // 3.3 Update cart item quantity
    if (testCartItemId) {
      try {
        const updateCartResponse = await axios.put(
          `${API_URL}/api/cart/${testCartItemId}`,
          { quantity: 2 },
          { headers: authHeaders }
        );
        logResult(`/api/cart/${testCartItemId} (PUT)`, true, updateCartResponse.data);
      } catch (error) {
        logResult(`/api/cart/${testCartItemId} (PUT)`, false, null, error.message);
      }
    }
    
    // 3.4 Remove item from cart
    if (testCartItemId) {
      try {
        const removeCartResponse = await axios.delete(
          `${API_URL}/api/cart/${testCartItemId}`,
          { headers: authHeaders }
        );
        logResult(`/api/cart/${testCartItemId} (DELETE)`, true, removeCartResponse.data);
      } catch (error) {
        logResult(`/api/cart/${testCartItemId} (DELETE)`, false, null, error.message);
      }
    }
    
    // 3.5 Add item back to cart for order test
    if (testProductId) {
      try {
        await axios.post(
          `${API_URL}/api/cart`, 
          { product_id: testProductId, quantity: 1 },
          { headers: authHeaders }
        );
      } catch (error) {
        logResult('Add item back to cart', false, null, error.message);
      }
    }
    
    // 4. Test order endpoints
    console.log('\n--- Testing Order Endpoints ---');
    
    // 4.1 Create an order
    try {
      const createOrderResponse = await axios.post(
        `${API_URL}/api/orders`,
        {
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip_code: '12345',
          payment_method: 'credit_card'
        },
        { headers: authHeaders }
      );
      logResult('/api/orders (POST)', true, createOrderResponse.data);
      
      // Save order ID for later tests
      if (createOrderResponse.data && createOrderResponse.data.id) {
        testOrderId = createOrderResponse.data.id;
      }
    } catch (error) {
      logResult('/api/orders (POST)', false, null, error.message);
    }
    
    // 4.2 Get all orders
    try {
      const ordersResponse = await axios.get(`${API_URL}/api/orders`, { headers: authHeaders });
      logResult('/api/orders', true, ordersResponse.data);
    } catch (error) {
      logResult('/api/orders', false, null, error.message);
    }
    
    // 4.3 Get a single order
    if (testOrderId) {
      try {
        const orderResponse = await axios.get(
          `${API_URL}/api/orders/${testOrderId}`,
          { headers: authHeaders }
        );
        logResult(`/api/orders/${testOrderId}`, true, orderResponse.data);
      } catch (error) {
        logResult(`/api/orders/${testOrderId}`, false, null, error.message);
      }
    }
    
    console.log('\n--- Test Complete ---');
    console.log(`Results logged to ${LOG_FILE}`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

// Run the tests
testEndpoints(); 