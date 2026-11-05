# syntax=docker/dockerfile:1

# ==============================================================================
# Shubban Library Multi-Stage Production Dockerfile
# Optimized for minimal footprint (<200MB), high security, and fast startup
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Alpine Environment
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Dependencies Installation
# ------------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --prefer-offline --no-audit

# ------------------------------------------------------------------------------
# Stage 3: Source Compilation & Next.js Build
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Environment variables for build stage
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Run as non-privileged user for container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set up storage and uploads directories with permissions
RUN mkdir -p /app/public/uploads && \
    chown -R nextjs:nodejs /app/public/uploads

# Copy public static files
COPY --from=builder /app/public ./public

# Copy standalone build and static Next.js assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and migrations for runtime operations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Container Healthcheck hitting the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]

