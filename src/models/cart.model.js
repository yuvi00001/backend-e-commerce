const mongoose = require('mongoose');
const { Schema } = mongoose;

// Cart Item Schema (will be embedded in Cart)
const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  }
}, {
  timestamps: true,
  versionKey: false,
  _id: true // We want each cart item to have its own ID
});

// Cart Schema
const CartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  items: [CartItemSchema], // Embedding cart items
  total: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Virtual method to calculate cart total
CartSchema.methods.calculateTotal = function() {
  if (!this.items || this.items.length === 0) {
    this.total = 0;
    return 0;
  }
  
  const total = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  this.total = total;
  return total;
};

// Middleware to calculate total before saving
CartSchema.pre('save', function(next) {
  this.calculateTotal();
  next();
});

// Convert model to JSON - use getters and hide version key
CartSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    
    // Transform each cart item
    if (ret.items) {
      ret.items = ret.items.map(item => {
        return {
          id: item._id,
          product_id: item.product,
          quantity: item.quantity,
          price: item.price,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      });
    }
  }
});

const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart; 