# SendGrid Setup Guide

## Why SendGrid?

- ✅ Works on all hosting platforms (Render, Heroku, Vercel, etc.)
- ✅ No SMTP blocks or timeout issues
- ✅ Better email deliverability
- ✅ Free tier: 100 emails/day (sufficient for most applications)
- ✅ Advanced analytics and bounce handling

## Setup Steps

### 1. Create SendGrid Account

1. Go to https://sendgrid.com
2. Sign up for a free account
3. Verify your email address

### 2. Generate API Key

1. Login to SendGrid dashboard
2. Go to Settings → API Keys
3. Click "Create API Key"
4. Choose "Restricted Access"
5. Give permissions: Mail Send → Full Access
6. Copy the generated API key (starts with SG.)

### 3. Update Your .env File

```env
# Email Configuration - SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.your_actual_api_key_here
EMAIL_USER=your_verified_sender@yourdomain.com
```

### 4. Verify Sender Identity

1. In SendGrid dashboard, go to Settings → Sender Authentication
2. Choose "Single Sender Verification"
3. Add your email address (same as EMAIL_USER)
4. Verify the email they send you

### 5. Test Configuration

```bash
# Test email config
curl http://localhost:5001/api/email-test/email-config

# Send test email
curl -X POST http://localhost:5001/api/email-test/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

## Production Notes

- Use a domain email (yourname@yourdomain.com) for better deliverability
- Consider upgrading to paid plan for higher limits
- Enable click tracking and open tracking in SendGrid dashboard
