# Docker Deployment Guide

This guide explains how to run the AI-Powered Interview Prep App using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Your OpenAI API key

## Quick Start

### 1. Set Environment Variables

Create a `.env` file in the root directory (same level as docker-compose.yml):

```bash
# Required
OPENAI_API_KEY=your-openai-api-key-here

# Optional (defaults provided)
OPENAI_MODEL=gpt-4o-mini-2024-07-18
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
JWT_SECRET=super-secret-jwt-key-change-this-in-production-2025
```

### 2. Build and Run

```bash
# Start all services (MongoDB, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

### 3. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │  Port 80
│   nginx         │
└────────┬────────┘
         │
         │ HTTP
         │
┌────────▼────────┐
│   Backend       │
│   (Node.js)     │  Port 5000
│   Express       │
└────────┬────────┘
         │
         │ MongoDB
         │
┌────────▼────────┐
│   MongoDB       │  Port 27017
│   Database      │
└─────────────────┘
```

## Service Details

### Frontend (nginx)
- **Image**: nginx:alpine
- **Build**: Multi-stage (node:18-alpine → nginx:alpine)
- **Port**: 80
- **Features**:
  - Gzip compression
  - Static asset caching
  - React Router support
  - Security headers

### Backend (Node.js)
- **Image**: node:18-alpine
- **Port**: 5000
- **Volumes**: `./backend/uploads:/app/uploads`
- **Environment Variables**:
  - `MONGODB_URI`: Connection to MongoDB container
  - `OPENAI_API_KEY`: Your OpenAI API key
  - `JWT_SECRET`: Secret for JWT tokens

### MongoDB
- **Image**: mongo:7.0
- **Port**: 27017
- **Volume**: `mongodb_data` (persistent storage)
- **Database**: `interview-prep`

## Development Mode

To run with live code updates (development):

```bash
# Backend with nodemon
cd backend
docker run -it --rm \
  -v $(pwd):/app \
  -w /app \
  -p 5000:5000 \
  --env-file .env \
  node:18-alpine \
  sh -c "npm install && npm run dev"

# Frontend with Vite dev server
cd frontend
docker run -it --rm \
  -v $(pwd):/app \
  -w /app \
  -p 5173:5173 \
  node:18-alpine \
  sh -c "npm install && npm run dev"
```

## Building Individual Images

### Backend
```bash
cd backend
docker build -t interview-prep-backend .
docker run -p 5000:5000 --env-file .env interview-prep-backend
```

### Frontend
```bash
cd frontend
docker build -t interview-prep-frontend .
docker run -p 80:80 interview-prep-frontend
```

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017/interview-prep` |
| `JWT_SECRET` | Secret key for JWT tokens | (generated) |
| `JWT_EXPIRE` | JWT token expiration | `7d` |
| `OPENAI_API_KEY` | OpenAI API key | **Required** |
| `OPENAI_BASE_URL` | OpenAI API base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Chat completion model | `gpt-4o-mini-2024-07-18` |
| `OPENAI_EMBEDDING_MODEL` | Embedding model | `text-embedding-3-large` |

### Frontend (Build-time)

Create `frontend/.env` for build-time variables:

```bash
VITE_API_URL=http://localhost:5000/api
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Check if ports are in use
netstat -an | grep -E "80|5000|27017"
```

### MongoDB connection issues
```bash
# Check if MongoDB is running
docker-compose ps

# Restart MongoDB
docker-compose restart mongodb

# Check MongoDB logs
docker-compose logs mongodb
```

### Frontend can't reach backend
```bash
# Check backend health
curl http://localhost:5000/api/health

# Verify network
docker network inspect interview-prep-app_interview-prep-network
```

### Clear all data and restart
```bash
# Stop all containers
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild and start fresh
docker-compose up --build -d
```

## Production Deployment

### Security Checklist

1. **Change JWT Secret**
   ```bash
   # Generate strong secret
   openssl rand -base64 32
   ```

2. **Use HTTPS**
   - Add SSL certificates to nginx
   - Update nginx.conf with SSL configuration

3. **Environment Variables**
   - Never commit `.env` files
   - Use Docker secrets or environment variable management

4. **MongoDB Security**
   - Enable authentication
   - Use strong passwords
   - Limit network access

5. **Update Dependencies**
   ```bash
   cd backend && npm audit fix
   cd frontend && npm audit fix
   ```

### Nginx SSL Configuration (nginx.conf)

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... rest of configuration
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Scaling

### Horizontal Scaling (Multiple Backend Instances)

```yaml
# docker-compose.yml
services:
  backend:
    # ... existing config
    deploy:
      replicas: 3

  nginx-lb:
    image: nginx:alpine
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Resource Limits

```yaml
# docker-compose.yml
services:
  backend:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Monitoring

### Health Checks

```yaml
# docker-compose.yml
services:
  backend:
    # ... existing config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### View Resource Usage

```bash
# Container stats
docker stats

# Specific service
docker stats interview-prep-backend
```

## Backup and Restore

### Backup MongoDB

```bash
# Backup
docker exec interview-prep-mongodb mongodump \
  --db interview-prep \
  --out /data/backup

# Copy to host
docker cp interview-prep-mongodb:/data/backup ./mongodb-backup
```

### Restore MongoDB

```bash
# Copy backup to container
docker cp ./mongodb-backup interview-prep-mongodb:/data/restore

# Restore
docker exec interview-prep-mongodb mongorestore \
  --db interview-prep \
  /data/restore/interview-prep
```

## CI/CD Pipeline Example

```yaml
# .github/workflows/docker-deploy.yml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build images
        run: docker-compose build

      - name: Run tests
        run: |
          docker-compose up -d mongodb
          cd backend && npm test
          cd frontend && npm test

      - name: Push to registry
        run: |
          docker tag interview-prep-backend:latest registry.com/backend:latest
          docker push registry.com/backend:latest
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure OpenAI API key is valid
4. Check network connectivity
