# Email Configuration Guide

This guide explains how to set up email functionality in the Student Feedback System to automatically send login credentials to users.

## Overview

The system uses Nodemailer to send welcome emails with auto-generated passwords when:

- Individual users are created through the admin panel
- Bulk student uploads are performed
- Admin receives summary reports for bulk operations

## Email Setup Instructions

### 1. Gmail Configuration (Recommended)

For Gmail accounts, you'll need to use an App Password instead of your regular Gmail password.

#### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security" in the left panel
3. Enable "2-Step Verification" if not already enabled

#### Step 2: Generate App Password

1. In Google Account Settings → Security
2. Click on "App passwords"
3. Select "Mail" as the app and choose your device
4. Copy the 16-character app password generated

#### Step 3: Update Environment Variables

Edit your `/backend/.env` file:

```env
# Email Configuration for Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

### 2. Outlook/Hotmail Configuration

For Outlook/Hotmail accounts:

```env
# Email Configuration for Outlook
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### 3. Custom SMTP Server Configuration

For other email providers or custom SMTP servers:

```env
# Custom SMTP Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

Common SMTP settings:

- **Gmail**: smtp.gmail.com, port 587
- **Outlook**: smtp-mail.outlook.com, port 587
- **Yahoo**: smtp.mail.yahoo.com, port 587
- **SendGrid**: smtp.sendgrid.net, port 587

### 4. Environment Variables Reference

| Variable         | Description                            | Example                                   |
| ---------------- | -------------------------------------- | ----------------------------------------- |
| `EMAIL_SERVICE`  | Email service provider                 | `gmail`, `hotmail`, `yahoo`               |
| `EMAIL_USER`     | Your email address                     | `admin@example.com`                       |
| `EMAIL_PASSWORD` | Your email password or app password    | `your-app-password`                       |
| `SMTP_HOST`      | SMTP server hostname (for custom SMTP) | `smtp.gmail.com`                          |
| `SMTP_PORT`      | SMTP server port                       | `587`                                     |
| `SMTP_SECURE`    | Use SSL/TLS                            | `false` for port 587, `true` for port 465 |

## Email Templates

The system sends beautifully formatted HTML emails with:

### Welcome Email Features:

- 🎓 Professional header with system branding
- 📧 Clear display of login credentials
- ⚠️ Security warnings and best practices
- 🚀 Step-by-step getting started instructions
- 📚 Role-specific guidance (student/faculty features)
- 🔒 Password security recommendations

### Bulk Registration Summary:

- 📊 Registration statistics
- ✅ Success/failure breakdown
- 📝 Detailed failure reasons
- 📧 Confirmation that emails were sent

## Testing Email Configuration

1. Start the backend server
2. Check console logs for email service status:

   - ✅ "Email service initialized successfully"
   - ⚠️ "Email service not configured properly"

3. Create a test user through the admin panel
4. Verify the email is received

## Troubleshooting

### Common Issues:

1. **"Email service not configured properly"**

   - Check your environment variables
   - Verify EMAIL_USER and EMAIL_PASSWORD are set correctly

2. **"Authentication failed"**

   - For Gmail: Use App Password, not regular password
   - Ensure 2-Factor Authentication is enabled
   - Check email and password are correct

3. **"Connection timeout"**

   - Check SMTP_HOST and SMTP_PORT settings
   - Verify your network allows SMTP connections
   - Try different SMTP servers

4. **Emails not being received**
   - Check spam/junk folders
   - Verify recipient email addresses
   - Check email provider's sending limits

### Debug Mode:

To enable detailed email logs, add to your `.env`:

```env
DEBUG=nodemailer*
```

## Security Best Practices

1. **Never commit email credentials to version control**
2. **Use environment variables for all sensitive data**
3. **Use App Passwords instead of regular passwords**
4. **Enable 2-Factor Authentication on email accounts**
5. **Regularly rotate email passwords**
6. **Monitor email sending limits and quotas**

## Production Deployment

For production environments:

1. **Use a dedicated email service** (SendGrid, Mailgun, AWS SES)
2. **Set up proper DNS records** (SPF, DKIM, DMARC)
3. **Monitor email delivery rates**
4. **Implement rate limiting** to prevent abuse
5. **Use environment-specific configurations**

## Email Limits

Be aware of sending limits:

- **Gmail**: 500 emails/day for personal accounts
- **Google Workspace**: 2000 emails/day
- **Outlook**: 300 emails/day
- **SendGrid**: 100 emails/day (free tier)

For bulk operations with many users, consider using professional email services.

## Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify your email configuration
3. Test with a simple email service like Gmail first
4. Consult your email provider's SMTP documentation

---

**Note**: The system gracefully handles email failures - users are still created successfully even if email delivery fails. The admin panel will show the email status and generated passwords for manual distribution if needed.
