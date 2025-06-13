FROM node:18-alpine

WORKDIR /app

# Copy and install backend dependencies
COPY ripcity-backend/package*.json ./backend/
RUN cd backend && npm install

# Copy and install frontend dependencies  
COPY rip-city-tickets-react/package*.json ./frontend/
RUN cd frontend && npm install

# Copy source code
COPY ripcity-backend/ ./backend/
COPY rip-city-tickets-react/ ./frontend/

# Build applications
RUN cd backend && npm run build:full
RUN cd frontend && npm run build

# Expose port
EXPOSE 3000

# Start backend server
CMD ["node", "backend/dist/server.js"]