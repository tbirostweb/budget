# --- Étape 1 : build du front Vue ---
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Le front appelle l'API (auth + banque + données) sur la même origine (/api)
ENV VITE_BANK_API=/api
RUN npm run build

# --- Étape 2 : image de production (front + back + BDD sur un seul port) ---
FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data

# Dépendances de prod (express, better-sqlite3, nodemailer, cookie-parser)
COPY package*.json ./
RUN npm ci --omit=dev

# Serveur + front compilé
COPY server ./server
COPY --from=build /app/dist ./dist

# Dossier persistant pour la base SQLite (à mapper sur un volume Dokploy)
RUN mkdir -p /data
VOLUME /data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=8s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server/index.js"]
