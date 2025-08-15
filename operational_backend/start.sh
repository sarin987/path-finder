#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript code
echo "Building TypeScript code..."
npm run build

# Start the server
echo "Starting server..."
NODE_OPTIONS='--experimental-specifier-resolution=node' node server.mjs
