# Use a specific Node.js version to avoid network issues
FROM node:18-alpine AS deps
WORKDIR /app
 
# Copy package files
COPY package*.json ./
 
# Install production dependencies only with legacy peer deps for React 19 compatibility
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force
 
# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app
 
# Copy package files
COPY package*.json ./
 
# Install all dependencies (including dev dependencies) with legacy peer deps
RUN npm ci --legacy-peer-deps
 
# Copy source code
COPY . .
 
# Build arguments for environment variables
ARG NODE_ENV
ARG ENCRYPTION_KEY
ARG MONGODB_URI
ARG JWT_SECRET
ARG NEXT_PUBLIC_APP_URL

 
# Set environment variables
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY
ENV MONGODB_URI=$MONGODB_URI
ENV JWT_SECRET=$JWT_SECRET
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# 🔥 Clear Next.js cache before building
RUN rm -rf .next
 
# Build the application
RUN npm run build
 
# Runner stage
FROM node:18-alpine AS runner
WORKDIR /app
 
# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
 
# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
 
# Copy the standalone server from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
 
# Copy static files - CRITICAL for images
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
 
# Copy public folder - CRITICAL for static assets and images
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
 
# Switch to nextjs user
USER nextjs
 
# Expose port 6004
EXPOSE 6004
 
# Set the hostname to allow external connections
ENV HOSTNAME="0.0.0.0"
ENV PORT=6004
 
# Start the application using the standalone server
CMD ["node", "server.js"]