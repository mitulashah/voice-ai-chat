# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# No need for VITE_API_URL build arg - we'll configure at runtime
RUN npm run build

# Stage 2: Serve static files
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .
COPY ./nginx.conf /etc/nginx/nginx.conf
# Copy startup script
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh
EXPOSE 80
CMD ["/startup.sh"]
