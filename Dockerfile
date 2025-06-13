# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY ripcity-backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY ripcity-backend/src ./src
COPY ripcity-backend/tsconfig.json ./

# Install TypeScript and build dependencies
RUN npm install -g typescript
RUN npm install --save-dev @types/node

# Build the application
RUN npm run build

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["npm", "start"]
