const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus
} = require('../controllers/order.controller');

// All order routes require authentication
router.use(authenticate);

// User routes
router.post('/',
  validate(schemas.order),
  createOrder
);

router.get('/', getOrders);
router.get('/:id', getOrder);

// Admin routes
router.put('/:id/status',
  requireAdmin,
  updateOrderStatus
);

module.exports = router; 