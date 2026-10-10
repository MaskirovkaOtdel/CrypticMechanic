# Stage 1: Build production assets
FROM node:20-alpine AS builder

WORKDIR /app

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

# Copy package manifests
COPY package*.json ./

# Install dependencies cleanly
RUN npm install

# Copy source tree
COPY . .

# Build production assets
RUN npm run build

# Stage 2: Hermetic Nginx runtime
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=5s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
