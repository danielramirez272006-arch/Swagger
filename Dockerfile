FROM node:20-alpine

WORKDIR /app

# Copiar manifiesto de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar el código fuente de la aplicación
COPY . .

# Exponer el puerto configurado
EXPOSE 3000

# Comando de inicio del servidor
CMD ["npm", "start"]
