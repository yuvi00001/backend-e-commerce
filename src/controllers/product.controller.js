const { Product } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Get all products with filtering
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort = 'createdAt'
    } = req.query;

    // Build the filter query
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Calculate pagination 
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Define sort order
    const sortOrder = {};
    if (sort.startsWith('-')) {
      sortOrder[sort.substring(1)] = -1;
    } else {
      sortOrder[sort] = 1;
    }

    // Execute query with pagination
    const products = await Product.find(filter)
      .sort(sortOrder)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    
    // Format response to match frontend expectations
    res.json({
      products,
      pagination: {
        total: totalProducts,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(totalProducts / parsedLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single product
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Create new product
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    logger.info(`New product created: ${product.name}`);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// Update product
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    logger.info(`Product updated: ${product.name}`);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Delete product
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    logger.info(`Product deleted: ${product.name}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
}; 