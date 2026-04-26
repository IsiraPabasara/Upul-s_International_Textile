# --- Stage 1: Base Build ---
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl python3 make g++

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# Dummy URL for Prisma generation
ENV DATABASE_URL="mongodb+srv://dummy:dummy@cluster.mongodb.net/dummy"
RUN npx prisma generate --schema=./prisma/schema.prisma

# Strip unused Prisma engines (Schema Engine, Format Engine) - keep only Query Engine (~40-60MB savings)
RUN find node_modules/.prisma/client -type f \( \
    -name "schema-engine*" -o -name "format-engine*" \
  \) -delete 2>/dev/null || true && \
  find node_modules/@prisma/engines -type f \( \
    -name "schema-engine*" -o -name "format-engine*" \
  \) -delete 2>/dev/null || true

# Workspace sync and build
ENV NX_DAEMON=false
ENV NX_NO_CLOUD=true
RUN npx nx sync
RUN npx nx build api --prod
RUN npx nx build user-ui --prod
RUN npx nx build admin-ui --prod

# Create minimal package.json for API with only backend dependencies
RUN node -e " \
  const pkg = require('./package.json'); \
  const apiDeps = { \
    '@prisma/client': pkg.dependencies['@prisma/client'], \
    'axios': pkg.dependencies['axios'], \
    'bcryptjs': pkg.dependencies['bcryptjs'], \
    'bull': pkg.dependencies['bull'], \
    'cookie-parser': pkg.dependencies['cookie-parser'], \
    'cors': pkg.dependencies['cors'], \
    'dotenv': pkg.dependencies['dotenv'], \
    'ejs': pkg.dependencies['ejs'], \
    'exceljs': pkg.dependencies['exceljs'], \
    'express': pkg.dependencies['express'], \
    'express-rate-limit': pkg.dependencies['express-rate-limit'], \
    'helmet': pkg.dependencies['helmet'], \
    'imagekit': pkg.dependencies['imagekit'], \
    'ioredis': pkg.dependencies['ioredis'], \
    'jsonwebtoken': pkg.dependencies['jsonwebtoken'], \
    'md5': pkg.dependencies['md5'], \
    'morgan': pkg.dependencies['morgan'], \
    'pdfkit': pkg.dependencies['pdfkit'], \
    'replicate': pkg.dependencies['replicate'], \
    'resend': pkg.dependencies['resend'], \
    'slugify': pkg.dependencies['slugify'], \
    'swagger-ui-express': pkg.dependencies['swagger-ui-express'], \
    'uuid': pkg.dependencies['uuid'] \
  }; \
  const minPkg = { name: 'api', version: '1.0.0', dependencies: apiDeps }; \
  require('fs').writeFileSync('./api-package.json', JSON.stringify(minPkg, null, 2)); \
"

# Clean up builder
RUN rm -rf node_modules/.cache .next/cache apps/*/node_modules

# Aggressively prune standalone output to reduce size (target: <50MB app code)
RUN cd apps/user-ui/.next/standalone && \
    # Remove documentation and type files
    find . -type f \( \
      -name "*.md" -o -name "*.txt" -o -name "LICENSE*" -o -name "*.map" \
      -o -name "*.d.ts" -o -name "*.d.mts" -o -name "*.d.cts" \
      -o -name "CHANGELOG*" -o -name "readme*" -o -name "README*" \
      -o -name "*.flow" -o -name "*.ts.map" -o -name "*.mts" -o -name "*.cts" \
      -o -name "tsconfig*.json" -o -name ".npmignore" -o -name ".gitignore" \
      -o -name "*.tsbuildinfo" -o -name "jest.config.*" -o -name "*.test.js" \
      -o -name "*.spec.js" -o -name ".eslintrc*" -o -name ".prettierrc*" \
      -o -name "Makefile" -o -name "*.mk" -o -name "binding.gyp" \
    \) -delete 2>/dev/null || true && \
    # Remove unnecessary directories
    find . -type d \( \
      -name "test" -o -name "tests" -o -name "__tests__" -o -name "__mocks__" \
      -o -name "docs" -o -name "doc" -o -name ".github" -o -name ".git" \
      -o -name "example" -o -name "examples" -o -name "benchmark" -o -name "benchmarks" \
      -o -name ".idea" -o -name ".vscode" -o -name "coverage" -o -name ".nyc_output" \
      -o -name "src" -o -name "source" -o -name "es" -o -name "esm" \
      -o -name "types" -o -name "typings" -o -name "@types" \
    \) -exec rm -rf {} + 2>/dev/null || true && \
    # Remove non-linux native binaries
    find . -type f -name "*.node" ! -path "*linux*" -delete 2>/dev/null || true && \
    find . -type d \( -name "darwin*" -o -name "win32*" -o -name "freebsd*" -o -name "*-arm64*" \) -exec rm -rf {} + 2>/dev/null || true && \
    # Remove unnecessary package files
    find . -name "package.json" -exec sed -i -e 's/"types":.*,//g' -e 's/"typings":.*,//g' {} \; 2>/dev/null || true && \
    # Remove browser/ESM variants (server only needs CJS)
    find . -path "*/node_modules/*" -type f \( -name "*.browser.js" -o -name "*.esm.js" -o -name "*.mjs" \) -delete 2>/dev/null || true

# Prune admin-ui standalone output (same optimizations)
RUN cd apps/admin-ui/.next/standalone && \
    find . -type f \( \
      -name "*.md" -o -name "*.txt" -o -name "LICENSE*" -o -name "*.map" \
      -o -name "*.d.ts" -o -name "*.d.mts" -o -name "*.d.cts" \
      -o -name "CHANGELOG*" -o -name "readme*" -o -name "README*" \
      -o -name "*.flow" -o -name "*.ts.map" -o -name "*.mts" -o -name "*.cts" \
      -o -name "tsconfig*.json" -o -name ".npmignore" -o -name ".gitignore" \
      -o -name "*.tsbuildinfo" -o -name "jest.config.*" -o -name "*.test.js" \
      -o -name "*.spec.js" -o -name ".eslintrc*" -o -name ".prettierrc*" \
      -o -name "Makefile" -o -name "*.mk" -o -name "binding.gyp" \
    \) -delete 2>/dev/null || true && \
    find . -type d \( \
      -name "test" -o -name "tests" -o -name "__tests__" -o -name "__mocks__" \
      -o -name "docs" -o -name "doc" -o -name ".github" -o -name ".git" \
      -o -name "example" -o -name "examples" -o -name "benchmark" -o -name "benchmarks" \
      -o -name ".idea" -o -name ".vscode" -o -name "coverage" -o -name ".nyc_output" \
      -o -name "src" -o -name "source" -o -name "es" -o -name "esm" \
      -o -name "types" -o -name "typings" -o -name "@types" \
    \) -exec rm -rf {} + 2>/dev/null || true && \
    find . -type f -name "*.node" ! -path "*linux*" -delete 2>/dev/null || true && \
    find . -type d \( -name "darwin*" -o -name "win32*" -o -name "freebsd*" -o -name "*-arm64*" \) -exec rm -rf {} + 2>/dev/null || true && \
    find . -name "package.json" -exec sed -i -e 's/"types":.*,//g' -e 's/"typings":.*,//g' {} \; 2>/dev/null || true && \
    find . -path "*/node_modules/*" -type f \( -name "*.browser.js" -o -name "*.esm.js" -o -name "*.mjs" \) -delete 2>/dev/null || true

# --- Stage 2: Production API (Minimal) ---
FROM node:20-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

ENV PRISMA_CLI_QUERY_ENGINE_TYPE=library
ENV PRISMA_CLIENT_ENGINE_TYPE=library

COPY --from=builder /app/apps/api/dist ./
COPY --from=builder /app/api-package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install only API dependencies
RUN npm install --omit=optional && \
    npm cache clean --force && \
    find node_modules -type f \( -name "*.md" -o -name "LICENSE*" -o -name "*.map" \) -delete && \
    find node_modules -type d \( -name "test" -o -name "tests" -o -name "__tests__" \) -exec rm -rf {} + 2>/dev/null || true && \
    rm -rf /tmp/* /var/tmp/* /var/cache/apk/*

EXPOSE 4000
CMD npx prisma@6.19 db push --schema=./prisma/schema.prisma && node main.js

# --- Stage 3: Production UI (Next.js Standalone) ---
# Using minimal scratch-based image with just Node.js (~35MB base)
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS ui
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001 HOSTNAME=0.0.0.0

# For Nx monorepos, standalone includes full app structure with all deps bundled
COPY --from=builder --chown=nonroot:nonroot /app/apps/user-ui/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/apps/user-ui/.next/static ./apps/user-ui/.next/static
COPY --from=builder --chown=nonroot:nonroot /app/apps/user-ui/public ./apps/user-ui/public

USER nonroot
EXPOSE 3001
CMD ["apps/user-ui/server.js"]

# --- Stage 4: Production Admin UI (Next.js Standalone) ---
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS admin-ui
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3002 HOSTNAME=0.0.0.0

COPY --from=builder --chown=nonroot:nonroot /app/apps/admin-ui/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
COPY --from=builder --chown=nonroot:nonroot /app/apps/admin-ui/public ./apps/admin-ui/public

USER nonroot
EXPOSE 3002
CMD ["apps/admin-ui/server.js"]