const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cart.controller');

// All cart routes require authentication
router.use(authenticate);

router.get('/', getCart);

router.post('/',
  validate(schemas.cartItem),
  addToCart
);

router.put('/:itemId',
  validate(schemas.cartItem),
  updateCartItem
);

router.delete('/:itemId', removeFromCart);

router.delete('/', clearCart);

module.exports = router; 