# Multi-stage build for Backend API

# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads logs && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/ready').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
