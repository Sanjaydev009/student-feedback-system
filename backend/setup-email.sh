#!/bin/bash
# Email Configuration Setup Script

echo "🎯 Student Feedback System - Email Configuration Setup"
echo "======================================================"
echo ""

echo "Choose your email service:"
echo "1. SendGrid (Recommended for production)"
echo "2. Gmail (Good for development/testing)"
echo "3. Custom SMTP (Advanced users)"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "🚀 Setting up SendGrid..."
    echo ""
    echo "1. Sign up at https://sendgrid.com"
    echo "2. Create an API key in Settings → API Keys"
    echo "3. Verify your sender email in Settings → Sender Authentication"
    echo ""
    read -p "Enter your SendGrid API key: " api_key
    read -p "Enter your verified sender email: " sender_email
    
    cat > .env.email << EOL
# SendGrid Configuration
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=$api_key
EMAIL_USER=$sender_email
EOL
    
    echo ""
    echo "✅ SendGrid configuration saved to .env.email"
    echo "Copy the contents to your .env file"
    ;;
    
  2)
    echo ""
    echo "📧 Setting up Gmail..."
    echo ""
    echo "Prerequisites:"
    echo "1. Enable 2-Factor Authentication on your Google account"
    echo "2. Generate App Password: https://myaccount.google.com/apppasswords"
    echo ""
    read -p "Enter your Gmail address: " gmail_user
    read -p "Enter your App Password (16 characters): " gmail_password
    
    cat > .env.email << EOL
# Gmail Configuration (Optimized)
EMAIL_SERVICE=custom
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=$gmail_user
EMAIL_PASSWORD=$gmail_password
EOL
    
    echo ""
    echo "✅ Gmail configuration saved to .env.email"
    echo "Copy the contents to your .env file"
    ;;
    
  3)
    echo ""
    echo "⚙️  Setting up Custom SMTP..."
    echo ""
    read -p "Enter SMTP host: " smtp_host
    read -p "Enter SMTP port (587/465/25): " smtp_port
    read -p "Use SSL/TLS? (true/false): " smtp_secure
    read -p "Enter email username: " smtp_user
    read -p "Enter email password: " smtp_password
    
    cat > .env.email << EOL
# Custom SMTP Configuration
EMAIL_SERVICE=custom
SMTP_HOST=$smtp_host
SMTP_PORT=$smtp_port
SMTP_SECURE=$smtp_secure
EMAIL_USER=$smtp_user
EMAIL_PASSWORD=$smtp_password
EOL
    
    echo ""
    echo "✅ Custom SMTP configuration saved to .env.email"
    echo "Copy the contents to your .env file"
    ;;
    
  *)
    echo "Invalid choice. Please run the script again."
    exit 1
    ;;
esac

echo ""
echo "🧪 Testing your configuration..."
echo "Run: node email-validator.js"
echo ""
echo "📝 Next steps:"
echo "1. Copy the configuration from .env.email to your .env file"
echo "2. Start your server: npm run dev"
echo "3. Test email: curl -X POST http://localhost:5001/api/email-test/email-config"