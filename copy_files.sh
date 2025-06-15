#!/bin/bash

# Source and destination directories
SRC="/home/sarink/Desktop/Project_folders/path-finder/safety-emergency-app/backend"
DEST="/home/sarink/Desktop/Project_folders/path-finder/operational_backend"

# Create necessary directories if they don't exist
mkdir -p "$DEST/controllers"
mkdir -p "$DEST/models"
mkdir -p "$DEST/routes"
mkdir -p "$DEST/middleware"
mkdir -p "$DEST/config"

# Copy files with backup for existing files
echo "Copying files from $SRC to $DEST"

# Copy controllers
cp -r "$SRC/controllers/"* "$DEST/controllers/" 2>/dev/null || :

# Copy models
cp -r "$SRC/models/"* "$DEST/models/" 2>/dev/null || :

# Copy routes
cp -r "$SRC/routes/"* "$DEST/routes/" 2>/dev/null || :

# Copy middleware
cp -r "$SRC/middleware/"* "$DEST/middleware/" 2>/dev/null || :

# Copy config files
cp "$SRC/.sequelizerc" "$DEST/" 2>/dev/null || :
cp -r "$SRC/config/"* "$DEST/config/" 2>/dev/null || :

# Copy migrations and seeders if they exist
if [ -d "$SRC/migrations" ]; then
  cp -r "$SRC/migrations" "$DEST/"
fi

if [ -d "$SRC/seeders" ]; then
  cp -r "$SRC/seeders" "$DEST/"
fi

echo "Files copied successfully!"
