#!/bin/sh
set -e

# Replace environment variables in the built files
if [ -f .env.production ]; then
  echo "window._env_ = {
    REACT_APP_API_URL: '${REACT_APP_API_URL:-http://localhost:5000}',
    REACT_APP_WS_URL: '${REACT_APP_WS_URL:-ws://localhost:5000}'
  };" > /usr/share/nginx/html/env.js
fi

# Start Nginx
exec nginx -g 'daemon off;'
