FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copy workspace root files needed for pnpm install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY server/package.json server/

RUN pnpm install --frozen-lockfile --filter server

# ------- runtime -------
FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/

WORKDIR /app/server

EXPOSE 8000

# Run migrations then start the server.
# Render injects env vars at runtime so no --env-file needed.
CMD ["sh", "-c", "node --import=tsx migrations/migrate.ts && node --import=tsx index.ts"]
