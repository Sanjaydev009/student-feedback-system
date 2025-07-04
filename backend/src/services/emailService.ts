// src/services/emailService.ts
import nodemailer from 'nodemailer';
import { IUser } from '../interfaces/User';

// Email configuration interface
interface EmailConfig {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user: string;
    pass?: string;
  };
}

// Email template interface
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter!: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Email configuration - you can customize this based on your email provider
    const emailConfig: EmailConfig = {
      service: process.env.EMAIL_SERVICE || 'gmail', // Gmail, Outlook, etc.
      auth: {
        user: process.env.EMAIL_USER || '', // Your email
        pass: process.env.EMAIL_PASSWORD || '', // Your email password or app password
      },
    };

    // Alternative configuration for custom SMTP servers
    if (process.env.SMTP_HOST) {
      emailConfig.host = process.env.SMTP_HOST;
      emailConfig.port = parseInt(process.env.SMTP_PORT || '587');
      emailConfig.secure = process.env.SMTP_SECURE === 'true';
      delete emailConfig.service;
    }

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  // Check configuration and provide guidance
  checkConfiguration(): { isConfigured: boolean; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!process.env.EMAIL_USER) {
      issues.push('EMAIL_USER is not set');
      suggestions.push('Set EMAIL_USER to your email address in .env file');
    }

    if (!process.env.EMAIL_PASSWORD) {
      issues.push('EMAIL_PASSWORD is not set');
      suggestions.push('Set EMAIL_PASSWORD to your app password in .env file');
    }

    if (!process.env.EMAIL_SERVICE && !process.env.SMTP_HOST) {
      issues.push('Neither EMAIL_SERVICE nor SMTP_HOST is configured');
      suggestions.push('Set EMAIL_SERVICE=gmail or configure custom SMTP settings');
    }

    // Gmail-specific checks
    if (process.env.EMAIL_SERVICE === 'gmail') {
      if (process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('@gmail.com')) {
        issues.push('EMAIL_USER should be a Gmail address when using Gmail service');
        suggestions.push('Use your full Gmail address (e.g., user@gmail.com)');
      }

      if (process.env.EMAIL_PASSWORD && process.env.EMAIL_PASSWORD.length < 16) {
        issues.push('EMAIL_PASSWORD appears to be too short for Gmail App Password');
        suggestions.push('Gmail requires a 16-character App Password, not your regular password');
      }
    }

    return {
      isConfigured: issues.length === 0,
      issues,
      suggestions
    };
  }

  // Verify email connection
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready to send emails');
      return true;
    } catch (error: any) {
      console.error('❌ Email service configuration error:', error.message);
      
      // Provide specific guidance for common Gmail errors
      if (error.code === 'EAUTH' && error.response?.includes('Username and Password not accepted')) {
        console.error('\n🔧 GMAIL AUTHENTICATION ERROR - ACTION REQUIRED:');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Gmail requires an App Password, not your regular password!');
        console.error('');
        console.error('Quick Fix:');
        console.error('1. Go to https://myaccount.google.com/security');
        console.error('2. Enable "2-Step Verification" if not already enabled');
        console.error('3. Click "App passwords" → "Mail" → "Other"');
        console.error('4. Generate a 16-character App Password');
        console.error('5. Update your .env file with the App Password');
        console.error('');
        console.error('See GMAIL_SETUP_GUIDE.md for detailed instructions');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } else if (error.code === 'ECONNECTION') {
        console.error('\n🌐 CONNECTION ERROR:');
        console.error('Check your internet connection and SMTP server settings');
      } else if (error.code === 'ESOCKET') {
        console.error('\n🔌 SOCKET ERROR:');
        console.error('SMTP server connection failed. Check host and port settings');
      }
      
      return false;
    }
  }

  // Generate password creation email template
  private generatePasswordEmail(user: any, password: string): EmailTemplate {
    const subject = `Welcome to Student Feedback System - Your Account Details`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Student Feedback System</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4f46e5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
          }
          .credentials {
            background-color: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
          .password {
            font-size: 18px;
            font-weight: bold;
            color: #d63384;
            background-color: #fff;
            padding: 10px;
            border-radius: 3px;
            border: 2px dashed #d63384;
            text-align: center;
            margin: 10px 0;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            background-color: #6c757d;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 0 0 5px 5px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎓 Student Feedback System</h1>
          <p>Welcome to Your Account</p>
        </div>
        
        <div class="content">
          <h2>Hello ${user.name}!</h2>
          <p>Your account has been successfully created in the Student Feedback System. Below are your login credentials:</p>
          
          <div class="credentials">
            <h3>📧 Login Credentials</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            <div class="password">
              <strong>Password:</strong> ${password}
            </div>
          </div>
          
          <div class="warning">
            <h3>⚠️ Important Security Notice</h3>
            <ul>
              <li><strong>Change your password immediately</strong> after your first login</li>
              <li>Do not share your login credentials with anyone</li>
              <li>Use a strong, unique password for your account</li>
              <li>Log out completely when using shared computers</li>
            </ul>
          </div>
          
          <h3>🚀 Getting Started</h3>
          <ol>
            <li>Visit the Student Feedback System portal</li>
            <li>Log in using your email and the password provided above</li>
            <li>You will be prompted to change your password on first login</li>
            <li>Complete your profile if required</li>
            <li>Start using the system based on your role</li>
          </ol>
          
          ${user.role === 'student' ? `
          <h3>📚 For Students</h3>
          <p>As a student, you can:</p>
          <ul>
            <li>View your assigned subjects</li>
            <li>Submit feedback for your courses</li>
            <li>View your feedback history</li>
            <li>Update your profile information</li>
          </ul>
          ` : ''}
          
          ${user.role === 'faculty' ? `
          <h3>👨‍🏫 For Faculty</h3>
          <p>As a faculty member, you can:</p>
          <ul>
            <li>View feedback for your subjects</li>
            <li>Generate reports</li>
            <li>Monitor student responses</li>
            <li>Access analytical insights</li>
          </ul>
          ` : ''}
          
          <p>If you have any questions or need assistance, please contact the system administrator.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from the Student Feedback System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Student Feedback System!
      
      Hello ${user.name},
      
      Your account has been successfully created with the following details:
      
      Email: ${user.email}
      Role: ${user.role}
      Password: ${password}
      
      IMPORTANT SECURITY NOTICE:
      - Change your password immediately after your first login
      - Do not share your login credentials with anyone
      - Use a strong, unique password for your account
      
      Getting Started:
      1. Visit the Student Feedback System portal
      2. Log in using your email and password
      3. Change your password when prompted
      4. Complete your profile if required
      
      If you have any questions, please contact the system administrator.
      
      This is an automated message. Please do not reply to this email.
    `;

    return { subject, html, text };
  }

  // Send welcome email with password
  async sendPasswordEmail(user: any, password: string): Promise<boolean> {
    try {
      const template = this.generatePasswordEmail(user, password);
      
      const mailOptions = {
        from: `"Student Feedback System" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Password email sent to ${user.email}:`, info.messageId);
      return true;
    } catch (error) {
      console.error(`Failed to send password email to ${user.email}:`, error);
      return false;
    }
  }

  // Send bulk registration summary email (to admin)
  async sendBulkRegistrationSummary(
    adminEmail: string, 
    results: any, 
    totalProcessed: number
  ): Promise<boolean> {
    try {
      const subject = `Bulk Registration Summary - ${results.success} Users Created`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Bulk Registration Summary</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h3>Registration Results</h3>
            <p><strong>Total Processed:</strong> ${totalProcessed}</p>
            <p><strong>Successfully Created:</strong> ${results.success}</p>
            <p><strong>Failed:</strong> ${results.failed}</p>
          </div>
          
          ${results.failures && results.failures.length > 0 ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <h4>Failed Registrations:</h4>
            <ul>
              ${results.failures.map((failure: any) => 
                `<li>${failure.email}: ${failure.reason}</li>`
              ).join('')}
            </ul>
          </div>
          ` : ''}
          
          <p style="margin-top: 20px;">All successfully registered users have been sent their login credentials via email.</p>
        </div>
      `;

      const mailOptions = {
        from: `"Student Feedback System" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Bulk registration summary sent to admin');
      return true;
    } catch (error) {
      console.error('Failed to send bulk registration summary:', error);
      return false;
    }
  }

  // Send test email
  async sendTestEmail(toEmail: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Student Feedback System" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: '📧 Test Email - Student Feedback System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
              <h1>✅ Test Email Successful!</h1>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px;">
              <p>Congratulations! Your email service is working correctly.</p>
              <p><strong>Email Service:</strong> ${process.env.EMAIL_SERVICE || 'Custom SMTP'}</p>
              <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p>You can now send welcome emails to new users when they are registered.</p>
            </div>
          </div>
        `,
        text: `
          Test Email Successful!
          
          Your email service is working correctly.
          Email Service: ${process.env.EMAIL_SERVICE || 'Custom SMTP'}
          From: ${process.env.EMAIL_USER}
          Time: ${new Date().toLocaleString()}
          
          You can now send welcome emails to new users when they are registered.
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Test email sent to ${toEmail}:`, info.messageId);
      return true;
    } catch (error) {
      console.error(`Failed to send test email to ${toEmail}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default EmailService;
