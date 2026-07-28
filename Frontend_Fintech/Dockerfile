# Multi-stage build for Frontend SPA

# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY angular.json tsconfig*.json proxy.conf.json ./
COPY public ./public
COPY src ./src

RUN npm run build -- --configuration=production

# --- Production stage ---
FROM nginx:1.27-alpine AS production

RUN apk add --no-cache wget

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/frontend-fintech/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
