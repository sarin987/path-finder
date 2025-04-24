#!/bin/bash
set -e

echo "🔧 Setting up Docker permissions..."

# Add user to docker group
if ! groups $USER | grep -q docker; then
    sudo usermod -aG docker $USER
    echo "Added $USER to docker group"
fi

# Set Docker socket permissions
sudo chmod 666 /var/run/docker.sock
echo "Set Docker socket permissions"

# Restart Docker daemon
sudo systemctl restart docker
echo "Restarted Docker daemon"

echo "✅ Docker permissions setup complete!"
echo "Please log out and back in for changes to take effect"