# Emergency Assistance System

A full-stack emergency assistance system with a React Native frontend, Node.js backend, and MySQL database, all containerized with Docker.

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system
- Node.js 18+ (for local development)
- npm or yarn package manager

### 🛠 Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd path-finder
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

3. **Start the application**
   ```bash
   docker compose up -d
   ```

4. **Access the applications**
   - Frontend: http://localhost:3000
   - Dashboard: http://localhost:8080
   - Backend API: http://localhost:5000

## 🏗 Project Structure

- `operational_frontend/` - React Native web application
- `operational_backend/` - Node.js backend with Express
- `safety-emergency-app/` - Responder dashboard (React)
- `docker-compose.yml` - Docker Compose configuration
- `.env` - Environment configuration

## 🐳 Docker Commands

- Start all services:
  ```bash
  docker compose up -d
  ```

- Stop all services:
  ```bash
  docker compose down
  ```

- View logs:
  ```bash
  # All services
  docker compose logs -f
  
  # Specific service
  docker compose logs -f backend
  ```

- Rebuild containers:
  ```bash
  docker compose up -d --build
  ```

## 🔧 Development

For local development, you can run services individually:

### Backend
```bash
cd operational_backend
npm install
npm run dev
```

### Frontend
```bash
cd operational_frontend
npm install
npm start
```

### Dashboard
```bash
cd safety-emergency-app
npm install
npm start
```

## 📦 Environment Variables

Copy `.env.example` to `.env` and update the values:

```
# Backend
NODE_ENV=development
PORT=5000

# Database
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=emergency_db
MYSQL_USER=emergency_user
MYSQL_PASSWORD=password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
```

## 📄 License

This project is licensed under the MIT License.