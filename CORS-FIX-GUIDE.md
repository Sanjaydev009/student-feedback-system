# CORS Issue Resolution Guide

This document provides solutions for CORS issues in the Student Feedback System.

## Quick Fix Steps

1. **Restart both servers with the correct configuration**:

   ```bash
   ./restart-servers.sh
   ```

2. **Run the CORS test script** to verify configuration:

   ```bash
   node test-cors.js
   ```

3. **Check backend health**:
   ```bash
   node health-check.js
   ```

## Understanding the Fix

The primary changes made to resolve CORS issues:

1. **Backend CORS Configuration**:

   - Used the `cors` package with permissive settings
   - Removed duplicate/conflicting CORS settings
   - Added explicit CORS headers to health and root endpoints

2. **Frontend API Configuration**:

   - Updated API URL to use the correct port (5000)
   - Enhanced health check to explicitly test CORS
   - Improved error detection and reporting

3. **Created Testing Tools**:
   - `test-cors.js` - Tests all CORS configurations
   - `health-check.js` - Tests backend health
   - `restart-servers.sh` - Restarts both servers with correct settings

## Troubleshooting

If you still experience CORS issues:

1. **Check Browser Console** for specific errors

2. **Verify Backend Port**:

   - Backend should run on port 5000
   - Frontend should connect to http://localhost:5000

3. **Clear Browser Cache and Cookies**:

   - Try in Incognito/Private mode
   - Use `Ctrl+Shift+R` to force refresh

4. **Check Network Traffic**:

   - Use browser developer tools (Network tab)
   - Look for failed requests with CORS errors

5. **Verify API URLs**:
   - Double-check `API_URL` in `frontend/utils/api.ts`
   - Make sure there are no hardcoded URLs using wrong ports

## Production Considerations

For production deployment:

1. **Restrict CORS Origins**:

   - Replace `'*'` with specific allowed origins
   - Example: `origin: ['https://your-frontend-domain.com']`

2. **Use Environment Variables**:
   - Set `NEXT_PUBLIC_API_URL` for frontend
   - Set `CORS_ALLOWED_ORIGINS` for backend

## Additional Resources

- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS Package](https://www.npmjs.com/package/cors)
- [NextJS API with CORS](https://nextjs.org/docs/api-routes/api-middlewares)
