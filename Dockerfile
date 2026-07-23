# 1. Use a lightweight version of Node.js as the base image
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy the package files first (to install dependencies)
COPY package*.json ./

# 4. Install all the packages (Express, GenAI, etc.)
RUN npm install --production

# 5. Copy the rest of your project files into the container
COPY . .

# 6. Expose the port your server runs on so AWS can route traffic to it
EXPOSE 3000

# 7. The command to start your application
CMD ["node", "server.js"]