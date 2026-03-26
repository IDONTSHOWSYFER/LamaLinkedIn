FROM node:20-alpine AS base
RUN npm install -g pnpm

# Build stage
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm exec prisma generate
COPY . .
RUN pnpm build

# Production stage
FROM base AS production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
