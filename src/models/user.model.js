const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  firebase_uid: {
    type: String,
    unique: true,
    required: [true, 'Firebase UID is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true
  },
  shippingAddress: {
    address: String,
    city: String,
    state: String,
    zip_code: String,
    country: String
  }
}, {
  timestamps: true,
  versionKey: false
});

// Convert model to JSON - use getters and hide version key
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User; 