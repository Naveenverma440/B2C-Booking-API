# B2C Booking API

A secure and scalable API-only backend for a B2C travel platform's "My Bookings" section, built with Node.js, MongoDB, and JWT authentication.

## 🚀 Features

- **JWT Authentication**: Secure access and refresh token implementation
- **User Management**: Complete user profile management with validation
- **Booking Management**: Upcoming and completed bookings with smart classification
- **Traveller Management**: Add, edit, and delete travellers for bookings
- **AI Integration**: OpenAI-powered booking summary generation
- **Comprehensive Validation**: Input validation using Joi
- **Error Handling**: Proper error responses with appropriate status codes
- **Security**: Rate limiting, CORS, Helmet security headers
- **Database**: MongoDB with Mongoose ODM
- **API Documentation**: Complete Postman collection included

## 🛠️ Tech Stack

- **Runtime**: Node.js (Latest)
- **Framework**: Express.js
- **Database**: MongoDB (Cloud)
- **Authentication**: JWT (Access & Refresh Tokens)
- **Validation**: Joi
- **AI Integration**: OpenAI API
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs
- **Environment**: dotenv

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v18.0.0 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- OpenAI API key
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd b2c-booking-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory and configure the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/b2c_booking_db?retryWrites=true&w=majority

# JWT Configuration
JWT_ACCESS_SECRET=your_super_secret_access_token_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Database Setup

#### MongoDB Atlas Setup:
1. Create a MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Replace the `MONGODB_URI` in your `.env` file

#### Seed Sample Data:
```bash
npm run seed
```

This will create sample users and bookings for testing.

### 5. Start the Application

#### Development Mode:
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | User logout | No |

### User Profile Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/profile` | Get user profile | Yes |
| PUT | `/api/user/profile` | Update user profile | Yes |
| GET | `/api/user/stats` | Get user statistics | Yes |

### Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/bookings` | Get all bookings | Yes |
| GET | `/api/bookings?status=upcoming` | Get upcoming bookings | Yes |
| GET | `/api/bookings?status=completed` | Get completed bookings | Yes |
| GET | `/api/bookings/:id` | Get booking by ID | Yes |
| POST | `/api/bookings/:id/summary` | Generate AI booking summary | Yes |

### Traveller Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/travellers` | Get all travellers | Yes |
| POST | `/api/travellers` | Add new traveller | Yes |
| PUT | `/api/travellers/:traveller_id` | Update traveller | Yes |
| DELETE | `/api/travellers/:traveller_id` | Delete traveller | Yes |

## 🔐 Authentication

This API uses JWT (JSON Web Tokens) for authentication with both access and refresh tokens:

- **Access Token**: Short-lived (15 minutes) for API access
- **Refresh Token**: Long-lived (7 days) for token renewal

### Using Authentication

1. **Register/Login** to get tokens
2. **Include access token** in Authorization header:
   ```
   Authorization: Bearer <your_access_token>
   ```
3. **Refresh tokens** when access token expires

## 📊 Booking Classification Logic

Bookings are automatically classified based on `last_travel_date`:

- **Upcoming**: `last_travel_date >= today`
- **Completed**: `last_travel_date < today`

## 🤖 AI Integration

The API includes OpenAI integration for generating friendly booking summaries:

- **Endpoint**: `POST /api/bookings/:id/summary`
- **Feature**: Generates personalized travel summaries
- **Fallback**: Provides default summary if AI service is unavailable

## 🧪 Testing with Postman

### Import Collection
1. Open Postman
2. Click "Import"
3. Select `postman_collection.json` from the project root
4. The collection includes all endpoints with sample requests

### Sample Login Credentials
After running the seed script, you can use these credentials:

```
Email: john.doe@example.com
Password: password123

Email: jane.smith@example.com
Password: password123

Email: mike.johnson@example.com
Password: password123

Email: sarah.williams@example.com
Password: password123
```

## 📁 Project Structure

```
b2c-booking-api/
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── errorHandler.js      # Global error handling
│   └── validation.js        # Input validation schemas
├── models/
│   ├── User.js             # User model
│   └── Order.js            # Booking/Order model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── user.js             # User profile routes
│   ├── bookings.js         # Booking management routes
│   └── travellers.js       # Traveller management routes
├── scripts/
│   └── seedData.js         # Database seeding script
├── .env.example            # Environment variables template
├── server.js               # Main application file
├── package.json            # Dependencies and scripts
├── postman_collection.json # Postman API collection
└── README.md              # Project documentation
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents API abuse
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

## 🚦 Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": "Detailed validation errors (if applicable)"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Sample API Responses

### Successful Login Response:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": "15m"
    }
  }
}
```

### Booking List Response:
```json
{
  "status": "success",
  "message": "Upcoming bookings retrieved successfully",
  "data": {
    "bookings": [
      {
        "_id": "booking_id",
        "bookingReference": "BK123456789",
        "destination": {
          "city": "Dubai",
          "country": "UAE"
        },
        "startDate": "2025-06-15T00:00:00.000Z",
        "endDate": "2025-06-22T00:00:00.000Z",
        "bookingStatus": "upcoming",
        "totalAmount": 2500,
        "currency": "USD"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalBookings": 15,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions:
1. Check the API documentation
2. Review the Postman collection
3. Check existing issues
4. Create a new issue if needed

## 🔄 Version History

- **v1.0.0** - Initial release with complete B2C booking API functionality

---

**Happy Coding! 🚀**