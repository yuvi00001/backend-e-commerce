const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes (admin only)
router.post('/',
  authenticate,
  requireAdmin,
  validate(schemas.product),
  createProduct
);

router.put('/:id',
  authenticate,
  requireAdmin,
  validate(schemas.product),
  updateProduct
);

router.delete('/:id',
  authenticate,
  requireAdmin,
  deleteProduct
);

module.exports = router; 