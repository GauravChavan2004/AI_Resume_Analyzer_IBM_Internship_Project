# Use Node.js LTS base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy root manifest and service manifests
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies across all directories
RUN npm run install:all

# Copy project source code
COPY . .

# Expose Frontend (3000) and Backend (5000) ports
EXPOSE 3000
EXPOSE 5000

# Start both services concurrently
CMD ["npm", "start"]
