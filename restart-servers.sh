#!/bin/bash

# Exit on error
set -e

echo "🔄 Restarting Student Feedback System"
echo "===================================="

# Kill any existing Node processes (optional, uncomment if needed)
# echo "Stopping existing Node processes..."
# pkill -f "node" || true
# sleep 2

# Navigate to project root
cd "$(dirname "$0")"

# Function to check if a port is in use
port_in_use() {
  lsof -i:"$1" >/dev/null 2>&1
}

# Check if backend port is already in use
if port_in_use 5000; then
  echo "⚠️ Port 5000 is already in use. Please stop any running backend server."
  exit 1
fi

# Check if frontend port is already in use
if port_in_use 3000; then
  echo "⚠️ Port 3000 is already in use. Please stop any running frontend server."
  exit 1
fi

# Install dependencies if needed
echo "📦 Checking and installing dependencies..."

cd backend
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi

cd ../frontend
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

cd ..

# Start backend server
echo "🚀 Starting backend server..."
cd backend
PORT=5000 npm run dev &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Run CORS test
echo "🔍 Testing CORS configuration..."
cd ..
node test-cors.js

# Start frontend
echo "🚀 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "✅ Both servers are now running:"
echo "- Backend: http://localhost:5000"
echo "- Frontend: http://localhost:3000"
echo ""
echo "📝 Remember to manually stop the servers when you're done."
echo "You can do this by pressing Ctrl+C if running in the foreground"
echo "or by using 'kill $BACKEND_PID $FRONTEND_PID' if running in the background."

# Wait for both processes
wait
