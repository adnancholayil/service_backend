# --- BUILD STAGE ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json tsconfig.json ./

RUN npm ci

COPY src/ ./src/

RUN npm run build

# --- RUN STAGE ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

# Create upload directories inside container
RUN mkdir -p uploads logs

EXPOSE 4000

CMD ["node", "dist/server.js"]
