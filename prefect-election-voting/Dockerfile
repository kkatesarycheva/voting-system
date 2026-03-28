FROM node:20-alpine AS frontend

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS backend

RUN apk add --no-cache python3 make g++
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install --omit=dev

FROM node:20-alpine

RUN apk add --no-cache libstdc++

WORKDIR /app
COPY --from=backend /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/
COPY --from=frontend /app/dist ./dist

RUN addgroup -S app && adduser -S app -G app
RUN mkdir -p /app/data/uploads && chown -R app:app /app/data
USER app

EXPOSE 3001

ENV PORT=3001
ENV DB_PATH=/app/data/voting.db
ENV UPLOAD_DIR=/app/data/uploads

CMD ["node", "backend/server.js"]
