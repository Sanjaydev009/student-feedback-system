# Gmail Email Configuration - Step-by-Step Guide

## ⚠️ IMPORTANT: Gmail Authentication Error

If you're seeing the error "Username and Password not accepted", this means you're trying to use your regular Gmail password instead of an App Password.

Gmail requires **App Passwords** for third-party applications like this system.

## 🔧 Fix the Authentication Error

### Step 1: Enable 2-Factor Authentication (Required)

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **"Security"** in the left sidebar
3. Under "Signing in to Google", click **"2-Step Verification"**
4. Follow the setup process to enable 2FA (you'll need your phone)

### Step 2: Generate App Password

1. Return to [Google Account Settings](https://myaccount.google.com/) → **Security**
2. Under "Signing in to Google", click **"App passwords"**
   - If you don't see this option, see troubleshooting below
3. At the bottom, click **"Select app"** and choose **"Mail"**
4. Click **"Select device"** and choose **"Other (Custom name)"**
5. Type "Student Feedback System" or any name you prefer
6. Click **"Generate"**
7. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

#### 🚨 Troubleshooting: "App passwords" Option Not Visible

If you don't see the "App passwords" option even with 2FA enabled, try these solutions:

**Solution 1: Direct Link Method**

1. Try this direct link: https://myaccount.google.com/apppasswords
2. If it says "App passwords aren't available for your account", proceed to Solution 2

**Solution 2: Account Type Check**

- **Work/School accounts**: App passwords might be disabled by your organization
- **Personal Gmail**: Should work after 2FA is enabled
- **G Suite legacy**: May have different requirements

**Solution 3: Alternative Setup Methods**

1. Try logging out of all Google services and back in
2. Wait 24-48 hours after enabling 2FA (sometimes there's a delay)
3. Use an incognito/private browser window
4. Clear browser cache and cookies for Google sites

**Solution 4: Use Different Authentication Method**
If App passwords still don't work, we can switch to OAuth2 authentication (see Alternative Setup section below)

### Step 3: Update Your .env File

Edit `/Users/bandisanjay/student-feedback-system/backend/.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-actual-gmail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

**Important Notes:**

- Use the **16-character App Password**, not your regular Gmail password
- Include spaces in the App Password exactly as shown by Google
- Use your full Gmail address (including @gmail.com)

### Step 4: Restart the Server

```bash
cd /Users/bandisanjay/student-feedback-system/backend
npm start
```

## 🔍 Verify Configuration

1. Start the server and check for: `✅ Email service initialized successfully`
2. Go to Admin Dashboard → Email Settings
3. Click "Check Email Configuration"
4. Send a test email to verify it works

## 🆘 Still Having Issues?

### Common Problems:

1. **"App passwords" option not visible**

   - Make sure 2-Factor Authentication is fully enabled
   - Wait a few minutes and refresh the page

2. **"Invalid login" error persists**

   - Double-check the App Password was copied correctly
   - Make sure there are no extra spaces at the beginning/end
   - Try generating a new App Password

3. **"Less secure app access" messages**
   - Ignore these - App Passwords are the new secure method
   - Don't enable "Less secure app access"

## 🔄 Alternative: OAuth2 Authentication (If App Passwords Don't Work)

If you can't access App Passwords, you can use OAuth2. This is more complex but works for all Gmail accounts.

### OAuth2 Setup Steps:

1. **Create Google Cloud Project**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Gmail API

2. **Create OAuth2 Credentials**

   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/auth/callback`
   - Download the credentials JSON file

3. **Get Refresh Token**

   - Use the OAuth2 playground: https://developers.google.com/oauthplayground/
   - Select Gmail API v1 → https://mail.google.com/
   - Follow the authorization flow to get a refresh token

4. **Update .env File**

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_CLIENT_ID=your-client-id-from-google-cloud
EMAIL_CLIENT_SECRET=your-client-secret-from-google-cloud
EMAIL_REFRESH_TOKEN=your-refresh-token-from-playground
EMAIL_USE_OAUTH=true
```

## 📧 Alternative Email Providers (Easiest Solution)

If Gmail is too complicated, consider these alternatives:

### Option 1: Outlook/Hotmail

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-regular-password
```

### Option 2: SendGrid (Professional)

```env
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Option 3: Mailtrap (Testing)

```env
EMAIL_SERVICE=mailtrap
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
```

### Quick Test Commands

Test your email config from the terminal:

```bash
# Check if environment variables are loaded
node -e "console.log('EMAIL_USER:', process.env.EMAIL_USER)"
node -e "console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET')"
```

## ✅ Success Indicators

You'll know it's working when you see:

- `✅ Email service initialized successfully` in server logs
- Test emails are delivered successfully
- New user registrations automatically send welcome emails

## 📞 Need Help?

If you're still having trouble:

1. Check the server logs for specific error messages
2. Try the email test panel in the admin dashboard
3. Verify your Gmail account settings
4. Consider using a different email provider temporarily

---

**Security Note**: Never share your App Passwords or commit them to version control. They provide full access to your email account.
