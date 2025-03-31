const { mongoose } = require('../config/database');
const User = require('./user.model');
const Product = require('./product.model');
const Cart = require('./cart.model');
const Order = require('./order.model');

module.exports = {
  mongoose,
  User,
  Product,
  Cart,
  Order
}; 