FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci --no-audit --no-fund

COPY frontend ./frontend
COPY backend ./backend
RUN npm run build --workspace frontend

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    DB_FILE=/app/backend/data/dudamapa.sqlite
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY --from=build /app/node_modules ./node_modules
COPY backend/src ./backend/src
COPY --from=build /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/backend/data && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start", "--workspace", "backend"]
