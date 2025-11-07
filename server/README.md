# Server API Implementation Guide

This directory contains Nuxt server API routes that serve as **reference implementations** for the REST API endpoints documented in `ORDERS_API.md` and `CUSTOMER_AUTH_API.md`.

## Important Notice

⚠️ **These are MOCK implementations** - They return sample data and do not connect to a real database. For production use, you need to:

1. Connect to your actual database (MySQL, PostgreSQL, etc.)
2. Implement proper JWT token generation and verification
3. Add comprehensive validation and error handling
4. Implement business logic for inventory management
5. Add logging and monitoring
6. Implement rate limiting and security measures

## Current Implementation Status

### ✅ Implemented (Mock Data)

- `POST /api/auth/customer/login` - Customer authentication
- `POST /api/orders` - Create order
- `GET /api/orders` - List customer orders
- `GET /api/orders/{orderId}` - Get order details
- `PUT /api/orders/{orderId}/cancel` - Cancel order

### ❌ Not Implemented

- Customer registration
- Profile management
- Password change
- JWT token verification
- Database integration
- Inventory management
- Order status updates
- Admin endpoints

## File Structure

```
server/
├── api/
│   ├── auth/
│   │   └── customer/
│   │       └── login.post.ts          # Customer login endpoint
│   └── orders/
│       ├── index.post.ts              # Create order
│       ├── index.get.ts               # List orders
│       ├── [orderId].get.ts           # Get order details
│       └── [orderId]/
│           └── cancel.put.ts          # Cancel order
└── tsconfig.json
```

## How to Use These Routes

### Option 1: Use as Reference (Recommended)

These routes show you the **expected structure** and **response format**. Use them as a guide to implement your own backend API in:
- Express.js
- Fastify
- NestJS
- Any other Node.js framework
- Or a completely different stack (Python, Java, etc.)

### Option 2: Build on Top of Nuxt Server

If you want to use Nuxt's built-in server capabilities:

1. Install required dependencies:
```bash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

2. Set up database connection (example with Prisma):
```bash
npm install @prisma/client
npx prisma init
```

3. Replace mock implementations with real database queries

4. Implement JWT utilities:

```typescript
// server/utils/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function generateToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token'
    });
  }
}
```

5. Use the JWT utilities in your routes:

```typescript
// In any protected route
const token = authHeader.substring(7);
const customerData = verifyToken(token);
```

## Production Checklist

Before deploying to production, ensure you:

- [ ] Replace all mock data with database queries
- [ ] Implement proper JWT token generation and verification
- [ ] Add input validation (use libraries like Zod or Joi)
- [ ] Implement proper error handling
- [ ] Add request logging
- [ ] Set up proper CORS configuration
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up monitoring and alerts
- [ ] Implement database transactions for orders
- [ ] Add unit and integration tests
- [ ] Configure environment variables properly
- [ ] Set up database migrations
- [ ] Implement backup and recovery procedures
- [ ] Add security headers
- [ ] Enable HTTPS in production

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="24h"

# API Configuration
API_BASE_URL="http://localhost:3000"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

## Database Schema Example

Here's a suggested database schema for orders:

```sql
-- Customers table
CREATE TABLE customers (
  id VARCHAR(50) PRIMARY KEY,
  company_id INT NOT NULL,
  customer_code VARCHAR(50),
  fname VARCHAR(100),
  lname VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  customer_type VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  order_id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  company_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total_amount DECIMAL(10, 2),
  total_discount DECIMAL(10, 2) DEFAULT 0,
  total_tax DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Order Items table
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  qty INT NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
```

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","company_id":1}'

# Create Order (replace TOKEN with actual token)
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":"PROD001","qty":2}]}'

# Get Orders
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer TOKEN"

# Get Order Details
curl -X GET http://localhost:3000/api/orders/ORD123 \
  -H "Authorization: Bearer TOKEN"

# Cancel Order
curl -X PUT http://localhost:3000/api/orders/ORD123/cancel \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Create a new collection "Orders API"
2. Add environment variables for base URL and token
3. Import the endpoints from the API documentation
4. Test each endpoint with sample data

## Next Steps

1. **Choose Your Backend Strategy:**
   - Option A: Build a separate backend API (Express, NestJS, etc.)
   - Option B: Extend these Nuxt server routes with real implementation

2. **Set Up Database:**
   - Choose your database (PostgreSQL, MySQL, MongoDB, etc.)
   - Create schema based on API requirements
   - Set up migrations

3. **Implement Authentication:**
   - Set up JWT token generation
   - Implement password hashing
   - Create middleware for authentication

4. **Build Order Logic:**
   - Implement order creation with inventory checks
   - Add order status transitions
   - Implement cancellation logic

5. **Test Everything:**
   - Write unit tests for business logic
   - Create integration tests for API endpoints
   - Test authentication flow

## Support

For questions or issues:
- Review the API documentation: `ORDERS_API.md`, `CUSTOMER_AUTH_API.md`
- Check the migration guide: `ORDERS_API_MIGRATION_GUIDE.md`
- Consult Nuxt server documentation: https://nuxt.com/docs/guide/directory-structure/server

---

**Last Updated:** October 16, 2025
**Version:** 1.0
