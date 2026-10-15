FROM node:20-alpine

WORKDIR /app

# copier uniquement les fichiers de dependances (opti du cache)
COPY package*.json ./

# ajouter --omit=dev a la fin pour la prod ou mettre juste npm ci pour le dev
RUN npm ci --omit=dev

COPY script/ ./script/

EXPOSE 3001

CMD ["npm", "start"]