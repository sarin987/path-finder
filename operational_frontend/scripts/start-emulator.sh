#!/bin/bash
# scripts/start-emulator.sh

echo "🚀 Starting Firebase emulators..."
cd "$(dirname "$0")/.."  # Navigate to project root

# Start Firebase emulators in the background
firebase emulators:start --import=./emulator-data --export-on-exit &

# Wait for emulators to start
echo "⏳ Waiting for emulators to start..."
sleep 10

# Start responder simulation
echo "🚨 Starting responder simulation..."
node scripts/simulate-responder.js

# Keep the script running
wait
