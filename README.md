# E-commerce Backend API

A Node.js-based e-commerce backend API with Firebase Authentication and PostgreSQL database.

## Features

- User Authentication (Firebase)
  - Email/Password login
  - Google Sign-in
  - Session persistence
- Product Management
  - CRUD operations for products
  - Category and price filtering
  - Stock management
- Shopping Cart
  - Add/remove products
  - Cart persistence
  - Price calculations
- Order Management
  - Checkout process
  - Order status tracking
  - Order history
- Role-Based Access Control (RBAC)
  - Admin privileges for product management
  - User-specific cart and order access

## Prerequisites

- Node.js >= 14.0.0
- PostgreSQL >= 12
- Firebase project with Authentication enabled
- npm or yarn package manager

## Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd ecommerce-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create environment file:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:

   - PostgreSQL credentials
   - Firebase project details
   - JWT secret
   - Other environment-specific variables

5. Initialize the database:

   ```bash
   npm run db:migrate
   # or
   yarn db:migrate
   ```

6. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Products

- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Cart

- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item
- `DELETE /api/cart/:itemId` - Remove item from cart

### Orders

- `POST /api/orders` - Create order
- `GET /api/orders` - List user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (Admin only)

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── index.js        # Application entry point
```

## Testing

Run the test suite:

```bash
npm test
# or
yarn test
```

## License

MIT
