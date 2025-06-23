#!/bin/bash

# Set environment variables
export NODE_ENV=development
export PORT=5000
export JWT_SECRET=dev_jwt_secret_key
export UPLOAD_PATH=./uploads

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start the server
node server.js
