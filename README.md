# Hostel Management Backend

A comprehensive Node.js backend API for a hostel management system with MongoDB Atlas, built with Express and Mongoose.

## Features

- **Authentication & Authorization**: JWT-based authentication with refresh tokens and role-based access control
- **20 Database Models**: Complete schema covering all hostel management features
- **Session Management**: Secure user sessions with automatic expiration
- **Password Security**: Bcrypt password hashing
- **Validation**: Input validation using express-validator
- **CORS**: Configured for cross-origin requests

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: express-validator
- **Security**: bcryptjs for password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account and cluster
- npm or yarn

## Installation

1. **Clone and navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   ```bash
   copy .env.example .env
   ```
   - Update the `.env` file with your MongoDB Atlas connection string and JWT secrets:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## MongoDB Atlas Setup

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (or use existing)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<database>` with your database name (e.g., `hostel_management`)
7. Paste the connection string into your `.env` file

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   └── auth.js              # JWT verification & authorization
├── models/
│   ├── Activity.js
│   ├── ActivityParticipant.js
│   ├── Conversation.js
│   ├── FoodRequest.js
│   ├── FoodRequestAcceptance.js
│   ├── FoodStall.js
│   ├── Hostel.js
│   ├── LostFoundClaim.js
│   ├── LostFoundPost.js
│   ├── Message.js
│   ├── Notice.js
│   ├── Notification.js
│   ├── Report.js
│   ├── RewardRedemption.js
│   ├── RewardTransaction.js
│   ├── Role.js
│   ├── RoommateIssue.js
│   ├── RoommateParticipant.js
│   ├── User.js
│   ├── UserSession.js
│   └── index.js             # Models export
├── routes/
│   ├── auth.js              # Auth routes
│   └── index.js             # Main router
├── .env.example             # Environment template
├── .gitignore
├── package.json
├── README.md
└── server.js                # Server entry point
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)
- `POST /api/auth/refresh` - Refresh access token

### Health Check

- `GET /api/health` - Check API and database status
- `GET /api/` - API information

## Database Models

The system includes 20 comprehensive models:

1. **Hostel** - Hostel information
2. **Role** - User roles (student, warden, admin, etc.)
3. **User** - User accounts with authentication
4. **UserSession** - JWT refresh token sessions
5. **LostFoundPost** - Lost and found items
6. **LostFoundClaim** - Claims on lost/found items
7. **Activity** - Group activities
8. **ActivityParticipant** - Activity participants
9. **RoommateIssue** - Roommate conflict management
10. **RoommateParticipant** - Issue participants
11. **FoodStall** - Food stall information
12. **FoodRequest** - Peer-to-peer food delivery
13. **FoodRequestAcceptance** - Request acceptance
14. **RewardTransaction** - Points earned
15. **RewardRedemption** - Points redemption
16. **Notice** - Hostel announcements
17. **Notification** - User notifications
18. **Report** - Content moderation reports
19. **Conversation** - Message grouping
20. **Message** - Chat messages

## Usage Examples

### Register a User
```bash
POST https://campus-connect-backend-eyt0.onrender.com/api/auth/register
Content-Type: application/json

{
  "college_email": "student@college.edu",
  "password": "password123",
  "full_name": "John Doe",
  "role_id": "role_object_id_here"
}
```

### Login
```bash
POST https://campus-connect-backend-eyt0.onrender.com/api/auth/login
Content-Type: application/json

{
  "college_email": "student@college.edu",
  "password": "password123"
}
```

### Protected Route Example
```bash
GET https://campus-connect-backend-eyt0.onrender.com/api/auth/me
Authorization: Bearer <your_jwt_token>
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## Security Features

- Password hashing with bcryptjs
- JWT access tokens (24h expiry)
- JWT refresh tokens (7d expiry)
- Session management with automatic expiration
- Role-based access control
- Input validation on all routes
- Account status checking

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `JWT_EXPIRE` | Access token expiry | 24h |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | 7d |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |

## Next Steps

After setting up the backend:

1. Create initial roles in the database (student, warden, admin)
2. Create hostel records
3. Implement additional route controllers for other models
4. Add data seeding scripts
5. Implement real-time features with Socket.IO (optional)
6. Add file upload functionality for images
7. Implement comprehensive testing

## License

ISC
