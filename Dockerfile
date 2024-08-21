FROM node:16

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port on which your app will run
EXPOSE 3000

# Command to run your application
CMD ["npm", "start"]