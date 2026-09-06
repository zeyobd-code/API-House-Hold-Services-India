# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (devDependencies included for nest build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper process signal handling
RUN apk add --no-cache dumb-init

# Copy built files and package manifests from builder
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Install production-only dependencies
RUN npm ci --only=production && npm cache clean --force

# Create uploads directory and grant permissions to node user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Switch to non-root user for security
USER node

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
