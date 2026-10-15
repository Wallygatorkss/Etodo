# Utilise une imagepour Node.js
FROM node:20-alpine

# Definit le dossier ou on travaille
WORKDIR /app

# Copie les fichiers package.json et package-lock.json
COPY todo/package*.json ./

# Installe les dependances
RUN npm install

# Copie tout le projet
COPY todo/ ./

# Build l'application Next.js
RUN npm run build

# Expose le port 3000
EXPOSE 3000

# Demarre l'application en mode dev
# mettre'"run", "dev"'' pour le dev ou juste '"start"'' quand on est en prod
CMD ["npm", "start"] 