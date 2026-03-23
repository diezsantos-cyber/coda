# CODA Backend - Red Hat UBI Dockerfile
# Base: Red Hat Universal Base Image 9 with Node.js 20
# Compatible with: OpenShift 4.x, Azure AKS, standard Kubernetes

# ==================== BUILDER STAGE ====================
FROM registry.access.redhat.com/ubi9/nodejs-20:latest AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY packages/backend/package*.json ./

# Install dependencies (production + dev for build)
USER 0
RUN npm ci
USER 1001

# Copy source code
COPY packages/backend/ ./

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ==================== PRODUCTION STAGE ====================
FROM registry.access.redhat.com/ubi9/nodejs-20-minimal:latest

# Metadata
LABEL name="coda-backend" \
      vendor="HeyBanco" \
      version="1.0" \
      release="1" \
      summary="CODA Platform Backend API + Telegram Bot" \
      description="Multi-tenant SaaS platform for organizational collaboration and decision management" \
      io.k8s.description="CODA Backend API + Telegram Bot" \
      io.k8s.display-name="CODA Backend" \
      io.openshift.tags="nodejs,api,telegram,bot"

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=1001:0 /app/dist ./dist
COPY --from=builder --chown=1001:0 /app/node_modules ./node_modules
COPY --from=builder --chown=1001:0 /app/package.json ./package.json

# Create directory for logs (writable by non-root)
RUN mkdir -p /app/logs && \
    chown -R 1001:0 /app/logs && \
    chmod -R g+w /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 3000

# Run as non-root user (OpenShift compatible)
USER 1001

# Environment variables (overridden at runtime)
ENV NODE_ENV=production \
    PORT=3000

# Start application
CMD ["node", "dist/index.js"]

# ==================== BUILD INSTRUCTIONS ====================
# Build:
#   docker build -f Dockerfile -t coda-backend:latest .
#
# Run locally:
#   docker run -p 3000:3000 \
#     -e DATABASE_URL="postgresql://..." \
#     -e REDIS_URL="redis://..." \
#     -e TELEGRAM_BOT_TOKEN="..." \
#     coda-backend:latest
#
# Push to ACR (Azure):
#   docker tag coda-backend:latest acrcoda.azurecr.io/coda-backend:latest
#   docker push acrcoda.azurecr.io/coda-backend:latest
#
# Push to OpenShift internal registry:
#   docker tag coda-backend:latest registry.heybanco.local/coda/backend:latest
#   docker push registry.heybanco.local/coda/backend:latest
