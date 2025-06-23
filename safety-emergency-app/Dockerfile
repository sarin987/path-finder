# Base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY safety-emergency-app/package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy source code
COPY safety-emergency-app/ .

# Expose the app port
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
