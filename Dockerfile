# Base stage
FROM node:18-alpine AS base
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM node:18-alpine AS development
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build stage
FROM development AS build
WORKDIR /app

# Build the application
RUN npm run build

# Production base
FROM node:18-alpine AS production-base
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy package files and install production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy built application
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

# Change to app user
USER nestjs

# Main service
FROM production-base AS main
EXPOSE 3000
CMD ["dumb-init", "node", "dist/main.js"]

# Admin service
FROM production-base AS admin
EXPOSE 3001
CMD ["dumb-init", "node", "dist/main-admin.js"]

# Campaign service
FROM production-base AS campaign
EXPOSE 3002
CMD ["dumb-init", "node", "dist/main-campaign.js"]

# Investment service
FROM production-base AS investment
EXPOSE 3003
CMD ["dumb-init", "node", "dist/main-investment.js"]