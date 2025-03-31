const { verifyFirebaseToken } = require('../config/firebase');
const { User } = require('../models');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await verifyFirebaseToken(token);

    // Find user by Firebase UID
    let user = await User.findOne({ firebase_uid: decodedToken.uid });
    
    // Create user if not found
    if (!user) {
      user = await User.create({
        firebase_uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || 'User',
        role: 'user'
      });
      logger.info(`Created new user for Firebase UID: ${decodedToken.uid}`);
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    logger.error('Admin authorization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authenticate,
  requireAdmin
}; 