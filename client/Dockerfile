FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and config
COPY package*.json ./
COPY next-i18next.config.js ./
COPY next.config.js ./

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
COPY next-i18next.config.js ./
COPY next.config.js ./
RUN npm install --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

ENV NODE_ENV production

CMD ["npm", "start"] 