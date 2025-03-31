const { connectDB } = require('./database');
const logger = require('../utils/logger');

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Database initialized successfully.');

    // You can add initial seed data here if needed
    // await seedDatabase();

  } catch (error) {
    logger.error('Unable to initialize database:', error);
    process.exit(1);
  }
};

// Optional: Add seed data function
const seedDatabase = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({
      where: { email: 'admin@example.com' }
    });

    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        firebase_uid: 'admin-uid', // You'll need to create this in Firebase
        role: 'admin'
      });
      logger.info('Admin user created successfully');
    }

    // Add sample products
    const productsExist = await Product.count();
    if (productsExist === 0) {
      await Product.bulkCreate([
        {
          name: 'Sample Product 1',
          price: 99.99,
          category: 'Electronics',
          stock: 100,
          image_url: 'https://example.com/sample1.jpg'
        },
        // Add more sample products as needed
      ]);
      logger.info('Sample products created successfully');
    }
  } catch (error) {
    logger.error('Error seeding database:', error);
  }
};

module.exports = initializeDatabase; 