# Dean Dashboard - Troubleshooting Guide

This document provides guidance for fixing and maintaining the Dean Dashboard in the Student Feedback System.

## Common Issues and Solutions

### Authentication Issues

The most common problem with the Dean Dashboard is authentication-related. Here's how to troubleshoot:

1. **Missing or Invalid JWT Token**

   - Use the `/debug/token` page to check if your token is valid
   - Use the `/debug/setup-dean` page to create a test dean account with proper credentials
   - Ensure the JWT_SECRET in the backend `.env` file matches what's expected by the frontend

2. **API Response Handling**

   - The dashboard is designed to handle different API response formats
   - Some endpoints return arrays directly, while others wrap data in objects
   - Type definitions include handling for both object and string formats for branch/faculty fields

3. **Server Connectivity**
   - Ensure the backend server is running on port 5001
   - Check that CORS is properly configured in the backend

## Testing the API Directly

You can test the API endpoints directly with curl:

```bash
# Health check
curl http://localhost:5001/api/health

# Login to get a token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "dean@test.com", "password": "dean123"}'

# Test endpoints with token
TOKEN="your_token_here"
curl http://localhost:5001/api/dean/subjects \
  -H "Authorization: Bearer $TOKEN"
```

## Creating a Test Dean Account

1. Create a dean account if one doesn't exist:

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Dean","email":"dean@test.com","password":"dean123","role":"dean"}'
```

2. Login with the dean account:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dean@test.com","password":"dean123"}'
```

## Available Debug Pages

- `/debug/token` - Check your current authentication token
- `/debug/setup-dean` - Create a dean test account and store the token
- `/dean-dashboard/api-test` - Test API endpoints
- `/dean-dashboard/robust` - Robust alternative dashboard with better error handling

## Backend Routes Available for Dean

- `/api/dean/dashboard-stats` - Get statistical data for dashboard
- `/api/dean/branches` - Get all branches
- `/api/dean/users` - Get all users
- `/api/dean/subjects` - Get all subjects
- `/api/dean/reports` - Get feedback reports
- `/api/dean/feedback/:subjectId/details` - Get details for a specific subject
- `/api/dean/analytics` - Get analytics data

## Frontend Components Structure

The dean dashboard uses several components and pages:

- `dean-dashboard/page.tsx` - Main dashboard
- `dean-dashboard/subjects/page.tsx` - Subjects list view
- `dean-dashboard/reports/page.tsx` - Reports view
- `dean-dashboard/robust/page.tsx` - Alternative robust dashboard
- `utils/api-debug.ts` - API wrapper with detailed logging
- `utils/auth.ts` - Token handling utilities

## Maintaining and Extending

When extending or modifying the Dean Dashboard:

1. Always use the `api-debug` utility for API calls to get detailed logs
2. Handle both array and object response formats
3. Implement proper error boundaries
4. Use null/undefined checks for all data rendering
5. Keep the JWT authentication flow intact
