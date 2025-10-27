# Email Configuration Troubleshooting Guide

## Current Issue: Connection Timeout ❌

The system is experiencing email connection timeouts with Gmail SMTP. This is common when deploying to hosting platforms like Render, Heroku, Railway, or Vercel.

## Quick Solutions

### 1. Test Current Configuration
```bash
# Visit this endpoint to test your current email configuration:
GET http://localhost:5001/api/email-test/email-config

# Send a test email:
POST http://localhost:5001/api/email-test/send-test-email
{
  "email": "your-test-email@example.com"
}
```

### 2. Gmail Configuration (Current Setup)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=sanjaybandi1999@gmail.com
EMAIL_PASSWORD=ygzp ofoe rocx zijt
```

**Issues with Gmail:**
- Many hosting platforms block outgoing SMTP connections
- Gmail has strict rate limiting
- Connection timeouts are common in production

### 3. SendGrid (Recommended for Production)
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

**Benefits:**
- No SMTP blocks on hosting platforms
- Better reliability and deliverability
- Detailed analytics and bounce handling
- Free tier: 100 emails/day

**Setup Steps:**
1. Sign up at https://sendgrid.com
2. Create an API key in SendGrid dashboard
3. Update your .env file with SendGrid settings
4. Restart your server

### 4. Alternative Gmail Settings (If Gmail Required)
```env
EMAIL_SERVICE=custom
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=sanjaybandi1999@gmail.com
EMAIL_PASSWORD=ygzp ofoe rocx zijt
```

### 5. Other Email Services

#### Mailgun
```env
EMAIL_SERVICE=custom
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your_mailgun_password
```

#### AWS SES
```env
EMAIL_SERVICE=custom
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your_aws_access_key
EMAIL_PASSWORD=your_aws_secret_key
```

## Debugging Steps

### Step 1: Check Environment Variables
```bash
# Ensure all required variables are set
echo $EMAIL_SERVICE
echo $EMAIL_USER
echo $EMAIL_PASSWORD
```

### Step 2: Test Connection
```bash
# Use the test endpoint
curl http://localhost:5001/api/email-test/email-config
```

### Step 3: Check Server Logs
Look for these error codes:
- `ETIMEDOUT`: Connection timeout (common on hosting platforms)
- `EAUTH`: Authentication failed (wrong password/app password)
- `ECONNECTION`: Network/firewall issues
- `ESOCKET`: SMTP server unreachable

### Step 4: Verify Gmail App Password
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Generate new App Password: Security → App passwords → Mail → Other
4. Use the 16-character password (without spaces)

## Production Deployment Solutions

### Option 1: Use SendGrid (Recommended)
- Free tier sufficient for most applications
- Works on all hosting platforms
- Better deliverability than Gmail

### Option 2: Hosting Platform Email Service
- **Heroku**: Use SendGrid add-on
- **Render**: Configure custom SMTP
- **Railway**: Use external email service
- **Vercel**: Use external email service (serverless functions)

### Option 3: Graceful Degradation
The system already handles email failures gracefully:
- User registration works without email
- Password reset requires manual admin intervention
- System continues functioning without email service

## Testing Commands

```bash
# 1. Test configuration
curl -X GET http://localhost:5001/api/email-test/email-config

# 2. Send test email
curl -X POST http://localhost:5001/api/email-test/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 3. Check server health
curl http://localhost:5001/health
```

## Current Configuration Analysis

**Detected Issues:**
- Gmail SMTP connection timing out after 30 seconds
- Likely blocked by hosting platform or network
- App password appears correctly formatted

**Recommended Next Steps:**
1. Switch to SendGrid for production reliability
2. Keep Gmail as fallback for development
3. Test with the provided endpoints
4. Monitor server logs for specific error codes

**Priority:** High - Email functionality needed for user registration workflow