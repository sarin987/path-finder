# Base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./


# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose the app port
EXPOSE 3000

# Command to run the application directly
CMD ["npm", "start"]
