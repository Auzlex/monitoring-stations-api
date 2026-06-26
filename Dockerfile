# syntax=docker/dockerfile:1
FROM node:22-alpine AS base

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install all dependencies (development + production) for building & generating client
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY prisma ./prisma/
RUN pnpm install --no-frozen-lockfile

# Install production-only dependencies for the final image
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY prisma ./prisma/
RUN pnpm install --prod --no-frozen-lockfile

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build

# Run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=prod-deps /app/node_modules ./node_modules

EXPOSE 7000
ENV PORT=7000

CMD ["sh", "-c", "pnpm exec prisma db push && node dist/src/server.js"]

