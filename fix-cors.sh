#!/bin/bash

# CORS Fix Script for Student Feedback System
# This script restarts the backend server with the updated CORS settings

echo "====================================="
echo "CORS Fix Script for Student Feedback System"
echo "====================================="

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if running on Node.js process
BACKEND_PID=$(lsof -ti:5001)
if [ ! -z "$BACKEND_PID" ]; then
  echo "Stopping existing backend process (PID: $BACKEND_PID)..."
  kill $BACKEND_PID
  sleep 2
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi

# Start the backend server
echo "Starting backend server with updated CORS settings..."
echo "Press Ctrl+C to stop the server when done testing."
npm run dev

# The script will stay running with the server
# Press Ctrl+C to exit
