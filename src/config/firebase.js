const admin = require('firebase-admin');
const logger = require('../utils/logger');

const initializeFirebaseAdmin = () => {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    process.exit(1);
  }
};

const verifyFirebaseToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    logger.error('Error verifying Firebase token:', error);
    throw error;
  }
};

const getFirebaseUser = async (uid) => {
  try {
    const user = await admin.auth().getUser(uid);
    return user;
  } catch (error) {
    logger.error('Error getting Firebase user:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebaseAdmin,
  verifyFirebaseToken,
  getFirebaseUser,
  admin,
}; 