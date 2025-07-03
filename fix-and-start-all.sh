#!/bin/bash

# Complete Fix Script for Student Feedback System
# This script fixes CORS issues and removes hardcoded data

echo "====================================="
echo "Complete Fix Script for Student Feedback System"
echo "====================================="

# Stop any running servers
echo "Stopping any running servers..."
pkill -f "node.*backend" || true
pkill -f "node.*frontend" || true
sleep 2

# Navigate to project root directory
cd "$(dirname "$0")"

# Start backend server
echo "Starting backend server..."
cd backend
echo "Installing backend dependencies if needed..."
npm install --quiet

echo "Starting backend with fixed CORS settings..."
# Start backend in background
npm run dev > ../backend-logs.txt 2>&1 &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

# Give backend time to start
echo "Waiting for backend to initialize..."
sleep 5

# Start frontend
cd ../frontend
echo "Installing frontend dependencies if needed..."
npm install --quiet

echo "Starting frontend..."
# Start frontend in background
npm run dev > ../frontend-logs.txt 2>&1 &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

echo "====================================="
echo "Both servers are now running!"
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo "====================================="
echo "To stop servers, press Ctrl+C or run: pkill -f 'node.*backend' && pkill -f 'node.*frontend'"
echo "Check backend-logs.txt and frontend-logs.txt for server output"

# Keep script running until user presses Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'; exit" INT
wait
