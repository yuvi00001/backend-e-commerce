const { Order, Cart, Product } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Create order from cart
const createOrder = async (req, res, next) => {
  // Start a MongoDB session for transactions
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { address, city, state, zip_code, payment_method } = req.body;

    // Get cart with populated items
    const cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        model: 'Product'
      });

    if (!cart || !cart.items.length) {
      throw new AppError('Cart is empty', 400);
    }

    // Calculate total and check stock
    let total_price = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      
      if (item.quantity > product.stock) {
        throw new AppError(`Not enough stock for ${product.name}`, 400);
      }
      
      total_price += item.quantity * product.price;
      
      // Prepare order item
      orderItems.push({
        product: product._id,
        product_name: product.name,
        product_image: product.image_url,
        quantity: item.quantity,
        price: product.price
      });
      
      // Update product stock
      product.stock -= item.quantity;
      await product.save({ session });
    }

    // Create order with embedded documents
    const order = new Order({
      user: req.user.id,
      total_price,
      status: 'pending',
      items: orderItems,
      shipping_address: {
        address,
        city,
        state,
        zip_code
      },
      payment: {
        payment_method,
        status: 'pending'
      }
    });

    await order.save({ session });

    // Clear cart after order is created
    cart.items = [];
    cart.total = 0;
    await cart.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Transform _id to id for consistency with frontend expectations
    const orderObj = order.toObject();
    orderObj.id = orderObj._id.toString();
    delete orderObj._id;

    logger.info(`Created order ${order.id} for user ${req.user.id}`);
    res.status(201).json(orderObj);
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Get user's orders
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    // Transform _id to id for consistency with frontend expectations
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.id = orderObj._id;
      delete orderObj._id;
      return orderObj;
    });

    res.json(formattedOrders);
  } catch (error) {
    next(error);
  }
};

// Get single order
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Transform _id to id for consistency with frontend expectations
    const orderObj = order.toObject();
    orderObj.id = orderObj._id;
    delete orderObj._id;

    res.json(orderObj);
  } catch (error) {
    next(error);
  }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Transform _id to id for consistency with frontend expectations
    const orderObj = order.toObject();
    orderObj.id = orderObj._id;
    delete orderObj._id;

    logger.info(`Updated order ${order.id} status to ${status}`);
    res.json(orderObj);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus
}; 