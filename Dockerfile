FROM node:18-alpine

WORKDIR /app

# Copiar archivos de package.json e instalar dependencias primero
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código de la aplicación
COPY . .

# Crear un usuario no root para ejecutar la aplicación
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cambiar la propiedad de los archivos al usuario no root
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "app.js"]