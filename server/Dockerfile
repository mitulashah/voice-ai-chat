# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .
COPY .env .
# Copy required data/config directories
COPY --from=builder /app/src/personas ./src/personas
COPY --from=builder /app/src/prompts ./src/prompts
COPY --from=builder /app/src/scenarios ./src/scenarios
COPY --from=builder /app/src/util ./src/util
# Also copy scenarios to dist for runtime
COPY --from=builder /app/src/scenarios ./dist/scenarios
# Also copy util to dist for runtime (for moods.json and others)
COPY --from=builder /app/src/util ./dist/util
# Ensure data directory exists and is writable
RUN mkdir -p ./data && chmod 777 ./data
# Copy startup script
COPY startup.sh .
RUN chmod +x startup.sh
EXPOSE 5000
CMD ["./startup.sh"]
