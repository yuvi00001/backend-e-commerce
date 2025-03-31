const { User } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { getFirebaseUser } = require('../config/firebase');
const logger = require('../utils/logger');

// Get user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { name } = req.body;
    user.name = name || user.name;
    await user.save();

    logger.info(`Updated profile for user ${user.id}`);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Sync Firebase user data
const syncFirebaseUser = async (req, res, next) => {
  try {
    const firebaseUser = await getFirebaseUser(req.user.firebase_uid);
    
    req.user.email = firebaseUser.email;
    req.user.name = firebaseUser.displayName || req.user.name;
    await req.user.save();

    logger.info(`Synced Firebase data for user ${req.user.id}`);
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

// Make user an admin (super admin only)
const makeAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Check if requesting user is super admin
    if (req.user.role !== 'admin') {
      throw new AppError('Only super admins can create new admins', 403);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.role = 'admin';
    await user.save();
    
    logger.info(`User ${userId} promoted to admin by ${req.user.id}`);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  syncFirebaseUser,
  makeAdmin
}; 