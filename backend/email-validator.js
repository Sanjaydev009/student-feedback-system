#!/usr/bin/env node
// Email Configuration Validator
// Run with: node email-validator.js

const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔧 Email Configuration Validator\n');

async function validateEmailConfig() {
  console.log('📋 Current Configuration:');
  console.log(`   EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'Not set'}`);
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'Not set'}`);
  console.log(`   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set'}`);
  console.log(`   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'Not set'}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'Not set'}`);
  console.log(`   SMTP_SECURE: ${process.env.SMTP_SECURE || 'Not set'}\n`);

  // Validate required fields
  const issues = [];
  if (!process.env.EMAIL_USER) issues.push('EMAIL_USER is required');
  
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    if (!process.env.SENDGRID_API_KEY) issues.push('SENDGRID_API_KEY is required for SendGrid');
  } else {
    if (!process.env.EMAIL_PASSWORD) issues.push('EMAIL_PASSWORD is required for SMTP');
  }

  if (issues.length > 0) {
    console.log('❌ Configuration Issues:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    return false;
  }

  console.log('✅ Configuration looks good! Testing connection...\n');

  // Create transporter based on configuration
  let transporter;
  try {
    if (process.env.EMAIL_SERVICE === 'sendgrid') {
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else {
      transporter = nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }

    console.log('🔄 Testing connection...');
    const verified = await transporter.verify();
    
    if (verified) {
      console.log('✅ Email connection successful!');
      console.log('🎉 Your email configuration is working properly.\n');
      
      // Ask if user wants to send a test email
      console.log('💡 You can now test sending an email using:');
      console.log('   curl -X POST http://localhost:5001/api/email-test/send-test-email \\');
      console.log('     -H "Content-Type: application/json" \\');
      console.log('     -d \'{"email":"your-test-email@example.com"}\'');
      
      return true;
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    // Provide specific guidance
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication Error Solutions:');
      console.log('   For Gmail:');
      console.log('   1. Enable 2-Factor Authentication');
      console.log('   2. Generate App Password: https://myaccount.google.com/apppasswords');
      console.log('   3. Use the 16-character App Password (no spaces)');
      console.log('\n   For SendGrid:');
      console.log('   1. Verify your API key is correct');
      console.log('   2. Ensure API key has Mail Send permissions');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection Timeout Solutions:');
      console.log('   1. Switch to SendGrid (recommended for production)');
      console.log('   2. Try Gmail with port 465 and SSL');
      console.log('   3. Check if your hosting platform blocks SMTP');
    }
    
    return false;
  }
}

// Run the validator
validateEmailConfig().then(success => {
  if (success) {
    process.exit(0);
  } else {
    console.log('\n❌ Email configuration needs attention.');
    console.log('📖 Check SENDGRID_SETUP.md or EMAIL_TROUBLESHOOTING.md for detailed guides.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Validator error:', error.message);
  process.exit(1);
});