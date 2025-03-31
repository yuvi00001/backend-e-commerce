const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};

// Product validation schemas
const productSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  image_url: Joi.string().uri().allow('', null),
  price: Joi.number().required().min(0),
  category: Joi.string().required(),
  stock: Joi.number().integer().min(0).required()
});

// Cart validation schemas
const cartItemSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required()
});

// Order validation schemas
const orderSchema = Joi.object({
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zip_code: Joi.string().required(),
  payment_method: Joi.string().required().valid('credit_card', 'paypal', 'stripe')
});

// User validation schemas
const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50)
}).min(1);

module.exports = {
  validate,
  schemas: {
    product: productSchema,
    cartItem: cartItemSchema,
    order: orderSchema,
    userUpdate: userUpdateSchema
  }
}; 