const { Cart, Product } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Get user's active cart
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        model: 'Product',
        select: 'name price image_url stock'
      });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        total: 0
      });
    }

    // Format response to match frontend expectations
    const cartResponse = {
      cart: {
        ...cart.toJSON(),
        cartItems: cart.items.map(item => ({
          id: item.id,
          cart_id: cart.id,
          product_id: item.product_id,
          quantity: item.quantity,
          product: item.product
        }))
      },
      total: cart.total
    };
    
    // Delete original items array to avoid duplication
    delete cartResponse.cart.items;

    res.json(cartResponse);
  } catch (error) {
    next(error);
  }
};

// Add item to cart
const addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;

    // Check product exists and has enough stock
    const product = await Product.findById(product_id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    if (product.stock < quantity) {
      throw new AppError('Not enough stock available', 400);
    }

    // Get or create active cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        total: 0
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === product_id
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        product: product_id,
        quantity,
        price: product.price
      });
    }

    // Save cart (calculateTotal middleware will update the total)
    await cart.save();

    // Reload cart with populated product details
    cart = await Cart.findById(cart.id).populate({
      path: 'items.product',
      model: 'Product',
      select: 'name price image_url stock'
    });

    logger.info(`Added ${quantity} of product ${product_id} to cart ${cart.id}`);
    
    // Format response to match frontend expectations
    const cartResponse = {
      cart: {
        ...cart.toJSON(),
        cartItems: cart.items.map(item => ({
          id: item.id,
          cart_id: cart.id,
          product_id: item.product_id,
          quantity: item.quantity,
          product: item.product
        }))
      },
      total: cart.total
    };
    
    // Delete original items array to avoid duplication
    delete cartResponse.cart.items;

    res.status(201).json(cartResponse);
  } catch (error) {
    next(error);
  }
};

// Update cart item quantity
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    // Find the cart item
    const cartItem = cart.items.id(req.params.itemId);
    if (!cartItem) {
      throw new AppError('Cart item not found', 404);
    }

    // Check stock availability
    const product = await Product.findById(cartItem.product);
    if (product.stock < quantity) {
      throw new AppError('Not enough stock available', 400);
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cart.save();

    // Reload cart with populated product details
    const updatedCart = await Cart.findById(cart.id).populate({
      path: 'items.product',
      model: 'Product',
      select: 'name price image_url stock'
    });

    logger.info(`Updated quantity of cart item ${cartItem.id} to ${quantity}`);
    
    // Format response to match frontend expectations
    const cartResponse = {
      cart: {
        ...updatedCart.toJSON(),
        cartItems: updatedCart.items.map(item => ({
          id: item.id,
          cart_id: updatedCart.id,
          product_id: item.product_id,
          quantity: item.quantity,
          product: item.product
        }))
      },
      total: updatedCart.total
    };
    
    // Delete original items array to avoid duplication
    delete cartResponse.cart.items;

    res.json(cartResponse);
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    // Remove the item from the cart
    const itemIndex = cart.items.findIndex(
      item => item.id === req.params.itemId
    );

    if (itemIndex === -1) {
      throw new AppError('Cart item not found', 404);
    }

    // Remove the item
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Reload cart with populated product details
    const updatedCart = await Cart.findById(cart.id).populate({
      path: 'items.product',
      model: 'Product',
      select: 'name price image_url stock'
    });

    logger.info(`Removed item from cart`);
    
    // Format response to match frontend expectations
    const cartResponse = {
      cart: {
        ...updatedCart.toJSON(),
        cartItems: updatedCart.items.map(item => ({
          id: item.id,
          cart_id: updatedCart.id,
          product_id: item.product_id,
          quantity: item.quantity,
          product: item.product
        }))
      },
      total: updatedCart.total
    };
    
    // Delete original items array to avoid duplication
    delete cartResponse.cart.items;

    res.json(cartResponse);
  } catch (error) {
    next(error);
  }
};

// Clear cart
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (cart) {
      cart.items = [];
      cart.total = 0;
      await cart.save();
      logger.info(`Cleared cart ${cart.id}`);
      
      // Format response to match frontend expectations
      const cartResponse = {
        cart: {
          ...cart.toJSON(),
          cartItems: []
        },
        total: 0
      };
      
      // Delete original items array to avoid duplication
      delete cartResponse.cart.items;
      
      res.json(cartResponse);
    } else {
      // If no cart exists, return an empty cart response
      res.json({
        cart: {
          user: req.user.id,
          status: 'active',
          cartItems: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        total: 0
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
}; 