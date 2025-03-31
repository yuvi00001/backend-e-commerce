const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image_url: {
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Index for efficient category searches
ProductSchema.index({ category: 1 });

// Convert model to JSON - use getters and hide version key
ProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product; 