#!/bin/bash

echo "🔐 Getting fresh token..."
TOKEN=$(curl -s -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@college.edu","password":"admin123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token obtained"

echo ""
echo "🔍 Testing feedback summary for subject with no feedback (Engineering Physics)..."
echo "Subject ID: 68fa88476c656cd19f0a077d"

RESPONSE=$(curl -s "http://localhost:5001/api/feedback/summary/68fa88476c656cd19f0a077d" \
  -H "Authorization: Bearer $TOKEN")

echo "📋 Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "🔍 Testing feedback summary for subject WITH feedback..."
echo "Subject ID: 68fa731ac50d28cbc01222b7"

RESPONSE2=$(curl -s "http://localhost:5001/api/feedback/summary/68fa731ac50d28cbc01222b7" \
  -H "Authorization: Bearer $TOKEN")

echo "📋 Response:"
echo "$RESPONSE2" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE2"