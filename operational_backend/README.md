# Safety Emergency App - Backend

Backend service for the Safety Emergency Application with role-based authentication.

## Features

- Role-based authentication (Police, Ambulance, Fire, Parent)
- JWT token-based authentication
- RESTful API endpoints
- Socket.IO for real-time communication
- MySQL database with Sequelize ORM
- Environment-based configuration

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd safety-emergency-app/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   - Copy `.env.example` to `.env`
   - Update the database credentials and other environment variables

4. **Database setup**
   - Create a MySQL database
   - Update the database credentials in `.env`
   - Run the database sync script:
     ```bash
     npm run sync-db
     ```
     This will:
     - Create all necessary tables
     - Run seeders to create initial admin users

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register/:role` - Register a new user with a specific role
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile (protected)
- `PUT /api/auth/me` - Update current user profile (protected)

### Test Accounts

Test accounts are created with the following credentials:

| Role      | Email                   | Password  |
|-----------|-------------------------|-----------|
| Police    | police@example.com     | admin123  |
| Ambulance | ambulance@example.com  | admin123  |
| Fire      | fire@example.com       | admin123  |
| Parent    | parent@example.com     | admin123  |


## Running Tests

To run the authentication tests:

```bash
npm run test:auth
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Node environment (development/production)
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRE` - JWT expiration time (e.g., '7d')
- `DB_HOST` - Database host
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `FRONTEND_URL` - Frontend URL for CORS

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
