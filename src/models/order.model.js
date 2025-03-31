const mongoose = require('mongoose');
const { Schema } = mongoose;

// OrderItem schema (will be embedded in Order)
const OrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  product_name: {
    type: String,
    required: [true, 'Product name is required']
  },
  product_image: String,
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
  _id: true
});

// ShippingAddress schema (will be embedded in Order)
const ShippingAddressSchema = new Schema({
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  zip_code: {
    type: String,
    required: [true, 'Zip code is required']
  },
  country: {
    type: String,
    default: 'United States'
  }
}, {
  _id: false,
  versionKey: false
});

// Payment schema (will be embedded in Order)
const PaymentSchema = new Schema({
  payment_method: {
    type: String,
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  transaction_id: String
}, {
  timestamps: true,
  _id: false,
  versionKey: false
});

// Order schema
const OrderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  total_price: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  items: [OrderItemSchema],
  shipping_address: ShippingAddressSchema,
  payment: PaymentSchema
}, {
  timestamps: true,
  versionKey: false
});

// Middleware to calculate total before saving
OrderSchema.pre('save', function(next) {
  if (this.isModified('items') || !this.total_price) {
    this.calculateTotal();
  }
  next();
});

// Method to calculate order total
OrderSchema.methods.calculateTotal = function() {
  if (!this.items || this.items.length === 0) {
    this.total_price = 0;
    return 0;
  }
  
  const total = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  this.total_price = total;
  return total;
};

// Convert model to JSON
OrderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    
    // Transform each order item
    if (ret.items) {
      ret.items = ret.items.map(item => {
        return {
          id: item._id,
          product_id: item.product,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          price: item.price,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      });
    }
  }
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order; 