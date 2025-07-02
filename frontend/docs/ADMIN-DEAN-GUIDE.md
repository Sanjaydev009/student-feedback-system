# Student Feedback System - Admin & Dean Dashboards

## Overview

This guide explains how to properly use and maintain both the Admin and Dean dashboards in the Student Feedback System. These dashboards provide administrative functions for managing the system, with different permission levels.

## Available Accounts

### Default Test Accounts

The following accounts are available for testing:

| Role    | Email                 | Password   | Access                                |
| ------- | --------------------- | ---------- | ------------------------------------- |
| Admin   | sanju.admin@gmail.com | admin123   | Full system access                    |
| Dean    | dean@test.com         | dean123    | Institution-wide oversight            |
| HOD     | _varies_              | _varies_   | Department-specific management        |
| Student | student@test.com      | student123 | Submit feedback for enrolled subjects |

## Setup Tools

We've created several utility tools to help with setup and troubleshooting:

1. **Dean Account Setup**: `/debug/setup-dean`

   - Creates a test dean account
   - Logs in and stores the authentication token

2. **Generate Test Data**: `/debug/generate-test-data`

   - Creates test users, subjects, and feedback

3. **Token Debugger**: `/debug/token`
   - Displays and verifies the current authentication token
   - Shows token expiration and role information

## Dashboard Features

### Admin Dashboard

- User management (create, edit, delete users)
- Subject management (create, edit, delete subjects)
- System settings and configurations
- View all feedback and reports

### Dean Dashboard

- Institution-wide subject oversight
- Comprehensive feedback reports
- Analysis of feedback trends
- Faculty performance metrics

## Troubleshooting

### Common Issues

1. **Authentication Problems**

   - Use `/debug/token` to check if token is valid and has the correct role
   - Use `/debug/setup-dean` to create a new dean account if needed
   - Ensure backend server is running with `JWT_SECRET` properly set

2. **API Connection Issues**

   - Verify backend is running on port 5001
   - Check browser console for API error messages
   - Try the robust dashboard versions with better error handling

3. **Data Not Displaying**
   - Use `/debug/generate-test-data` to create sample data
   - Check API response format in browser console
   - Verify permissions for the current user role

## Alternative Dashboard Versions

We've created robust alternative versions of the dashboards with enhanced error handling:

- **Robust Dean Dashboard**: `/dean-dashboard/robust`
  - Better error handling
  - More detailed logging
  - Fallback UI components

## JWT Authentication

Both dashboards use JWT (JSON Web Token) authentication:

1. User logs in with credentials
2. Backend validates and returns a signed JWT token
3. Token is stored in browser localStorage
4. Token is sent with API requests in Authorization header
5. Backend verifies token signature and permissions

## Debugging API Calls

The `utils/api-debug.ts` utility provides detailed logging of API requests and responses.
Check the browser console to see detailed information about API interactions, including:

- Request URLs and methods
- Request headers (including the Authorization token)
- Response status codes
- Response data structures

## Need Help?

If you encounter issues that aren't resolved with these tools:

1. Check the backend server logs for errors
2. Verify environment variables in the backend `.env` file
3. Ensure MongoDB is running and accessible
4. Check browser console for JavaScript errors
