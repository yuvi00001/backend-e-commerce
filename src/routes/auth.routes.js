const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const {
  getProfile,
  updateProfile,
  syncFirebaseUser,
  makeAdmin
} = require('../controllers/auth.controller');

// Protected routes
router.use(authenticate);

router.get('/profile', getProfile);

router.put('/profile',
  validate(schemas.userUpdate),
  updateProfile
);

router.post('/sync', syncFirebaseUser);

// Admin routes
router.put('/users/:userId/make-admin',
  requireAdmin,
  makeAdmin
);

module.exports = router; 