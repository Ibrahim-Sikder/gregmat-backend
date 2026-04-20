# GregMat Server

## How to Start the Project

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

**For Email Testing (Development):**

- Visit [https://ethereal.email/create](https://ethereal.email/create) to generate test email credentials
- Update `SENDER_EMAIL` and `SENDER_EMAIL_PASSWORD` in your `.env` file with the generated credentials

### 3. Start Development Server

```bash
npm run dev
```

### 4. Start Production Server

```bash
npm run build
npm start
```

### 4. Database Setup

Make sure your MongoDB and Redis services are running:

**For MongoDB:**

- If using MongoDB Atlas, ensure your connection string is correct
- If using local MongoDB, start the service: `sudo systemctl start mongod`

**For Redis:**

- Start Redis service: `sudo systemctl start redis-server`
- Or using Docker: `docker run -d -p 6379:6379 redis:alpine`

### 5. Build the Project

```bash
npm run build
```

## 🚀 Running the Application

### Development Mode

Start the server in development mode with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or your configured PORT).

### Production Mode

#### Option 1: Using PM2 (Recommended)

```bash
# Start the application
npm start

# Check application status
npm run logs

# Stop the application
npm run stop

# Restart the application
npm run restart

# Delete the application from PM2
npm run delete
```

#### Option 2: Direct Node.js

```bash
# Make sure you've built the project first
npm run build

# Start the application
node build/src/app.js
```

## 📝 Available Scripts

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start development server with hot reload |
| `npm start`          | Start production server using PM2        |
| `npm run build`      | Build TypeScript to JavaScript           |
| `npm run lint`       | Run ESLint for code quality              |
| `npm run format`     | Format code using Prettier               |
| `npm run stop`       | Stop PM2 process                         |
| `npm run restart`    | Restart PM2 process                      |
| `npm run delete`     | Delete PM2 process                       |
| `npm run logs`       | View PM2 logs                            |
| `npm run seeds:dev`  | Run database seeds in development        |
| `npm run seeds:prod` | Run database seeds in production         |

### Logs

- Development logs: Console output
- Production logs: `./logs/` directory
- PM2 logs: `npm run logs`

## 📚 API Documentation

Once the server is running, you can access:

- Health check: `GET /health`
- API endpoints will be available based on the configured routes
