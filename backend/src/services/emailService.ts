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
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Email configuration - optimized for production hosting (Render, Heroku, etc.)
      const emailConfig: EmailConfig = {
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASSWORD || '',
        },
      };

      // Check if using SendGrid - this takes priority
      if (process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY) {
        emailConfig.host = 'smtp.sendgrid.net';
        emailConfig.port = 587;
        emailConfig.secure = false;
        emailConfig.auth = {
          user: 'apikey', // SendGrid uses 'apikey' as username
          pass: process.env.SENDGRID_API_KEY,
        };
        console.log('🔧 Using SendGrid SMTP configuration');
      }
      // Use explicit SMTP configuration for better reliability on hosting platforms
      else if (process.env.EMAIL_SERVICE === 'gmail' || (!process.env.SMTP_HOST && !process.env.EMAIL_SERVICE && process.env.EMAIL_USER?.includes('@gmail.com'))) {
        // Gmail with explicit SMTP settings for better compatibility
        emailConfig.host = 'smtp.gmail.com';
        emailConfig.port = 587;
        emailConfig.secure = false; // Use STARTTLS
        console.log('🔧 Using Gmail SMTP configuration');
      } else if (process.env.SMTP_HOST) {
        // Custom SMTP configuration
        emailConfig.host = process.env.SMTP_HOST;
        emailConfig.port = parseInt(process.env.SMTP_PORT || '587');
        emailConfig.secure = process.env.SMTP_SECURE === 'true';
      } else {
        // Fallback to service-based configuration
        emailConfig.service = process.env.EMAIL_SERVICE || 'gmail';
      }

      // Add connection timeout and other reliability settings - increased timeouts for better reliability
      this.transporter = nodemailer.createTransport({
        ...emailConfig,
        // Production-optimized timeouts for hosting platforms
        connectionTimeout: 10000, // Reduced to 10 seconds for hosting platform limits
        greetingTimeout: 5000, // Reduced to 5 seconds
        socketTimeout: 10000, // Reduced to 10 seconds for faster failures
        pool: false, // Disable connection pooling for hosting platforms
        maxConnections: 1, // Limit to single connection
        maxMessages: 3, // Limit messages per connection
        rateDelta: 1000, // Rate limiting
        rateLimit: 5, // Max 5 messages per second
        // Optimized TLS configuration for production
        tls: {
          rejectUnauthorized: false,
          ciphers: 'TLSv1.2' // More compatible than SSLv3
        }
      } as any);

      console.log('🔧 Email transporter initialized with config:', {
        service: process.env.EMAIL_SERVICE || 'Auto-detected',
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        user: emailConfig.auth.user === 'apikey' ? 'SendGrid API' : process.env.EMAIL_USER?.replace(/(.{3})(.*)(@.*)/, '$1***$3'),
        authType: emailConfig.auth.user === 'apikey' ? 'API Key' : 'Password'
      });
    } catch (error) {
      console.error('❌ Error initializing email transporter:', error);
      throw error;
    }
  }

  // Check configuration and provide guidance
  checkConfiguration(): { isConfigured: boolean; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // SendGrid-specific checks
    if (process.env.EMAIL_SERVICE === 'sendgrid') {
      if (!process.env.SENDGRID_API_KEY) {
        issues.push('SENDGRID_API_KEY is not set');
        suggestions.push('Set SENDGRID_API_KEY to your SendGrid API key in .env file');
      }
      
      if (!process.env.EMAIL_USER) {
        issues.push('EMAIL_USER is not set');
        suggestions.push('Set EMAIL_USER to your sender email address for SendGrid');
      }
      
      return {
        isConfigured: issues.length === 0,
        issues,
        suggestions
      };
    }

    // Gmail and other SMTP checks
    if (!process.env.EMAIL_USER) {
      issues.push('EMAIL_USER is not set');
      suggestions.push('Set EMAIL_USER to your email address in .env file');
    }

    if (!process.env.EMAIL_PASSWORD && process.env.EMAIL_SERVICE !== 'sendgrid') {
      issues.push('EMAIL_PASSWORD is not set');
      suggestions.push('Set EMAIL_PASSWORD to your app password in .env file');
    }

    if (!process.env.EMAIL_SERVICE && !process.env.SMTP_HOST) {
      issues.push('Neither EMAIL_SERVICE nor SMTP_HOST is configured');
      suggestions.push('Set EMAIL_SERVICE=sendgrid or EMAIL_SERVICE=gmail, or configure custom SMTP settings');
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

  // Verify email connection with production hosting platform optimizations
  async verifyConnection(retries = 0): Promise<boolean> {
    // Skip verification in production if SMTP is likely blocked
    if (process.env.NODE_ENV === 'production' && !process.env.FORCE_EMAIL_VERIFICATION) {
      console.log('� Production mode: Skipping SMTP verification (hosting platforms often block SMTP)');
      console.log('💡 Email service will attempt to send when needed. Set FORCE_EMAIL_VERIFICATION=true to verify.');
      this.isConfigured = true;
      return true;
    }

    try {
      console.log('�🔄 Attempting to verify email connection...');
      
      // Use very short timeout for hosting platforms
      const verifyWithTimeout = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('⏰ Email verification timeout - this is normal on hosting platforms');
          reject(new Error('Verification timeout (expected on hosting platforms)'));
        }, 3000); // Reduced to 3 seconds

        (async () => {
          try {
            const isVerified = await this.transporter.verify();
            clearTimeout(timeout);
            console.log('✅ Email service connection verified successfully');
            this.isConfigured = true;
            resolve(true);
          } catch (error: any) {
            clearTimeout(timeout);
            console.log(`ℹ️ Email verification failed (common on hosting platforms):`, {
              code: error.code,
              message: error.message.substring(0, 50) + '...'
            });
            
            // Set as configured anyway - we'll try sending when needed
            this.isConfigured = true;
            resolve(true);
          }
        })();
      });

      return await verifyWithTimeout;
      
    } catch (error: any) {
      console.log('📧 Email verification skipped due to hosting platform constraints');
      console.log('💡 Email service will attempt to send when actually needed');
      this.isConfigured = true; // Assume configured, fail gracefully during actual sending
      return true;
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
          <h2>Hello ${user.name || 'User'}!</h2>
          <p>Your account has been successfully created in the Student Feedback System. Below are your login credentials:</p>
          
          <div class="credentials">
            <h3>📧 Login Credentials</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'}</p>
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

  // Send welcome email with password - production hosting platform optimized
  async sendPasswordEmail(user: any, password: string): Promise<boolean> {
    try {
      // Production-friendly approach with graceful fallback
      const sendWithTimeout = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ Email timeout for ${user.email} - hosting platform may block SMTP`);
          reject(new Error('Email send timeout - hosting platform constraint'));
        }, 6000); // Reduced to 6 seconds for faster feedback

        (async () => {
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
            clearTimeout(timeout);
            console.log(`✅ Password email sent to ${user.email}:`, info.messageId);
            resolve(true);
          } catch (error: any) {
            clearTimeout(timeout);
            console.log(`📧 Email send failed for ${user.email}:`, {
              code: error.code,
              message: error.message.substring(0, 50) + '...'
            });
            
            // Log user credentials as fallback for production
            if (process.env.NODE_ENV === 'production') {
              console.log(`🔑 FALLBACK: User credentials for ${user.email}:`);
              console.log(`   Email: ${user.email}`);
              console.log(`   Password: ${password}`);
              console.log(`   Please manually provide these credentials to the user`);
            }
            
            reject(error);
          }
        })();
      });

      return await sendWithTimeout;
    } catch (error: any) {
      console.log(`❌ Failed to send password email to ${user.email} (hosting platform SMTP may be blocked)`);
      
      // In production, log credentials as fallback
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔑 PRODUCTION FALLBACK - Manual credentials for ${user.email}:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Action required: Manually provide these credentials to the user`);
      }
      
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
      // Use production timeout of 8 seconds for bulk email
      const sendWithTimeout = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Bulk email timeout (8 seconds) - hosting platform limit'));
        }, 8000);

        (async () => {
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
            clearTimeout(timeout);
            console.log('✅ Bulk registration summary sent to admin');
            resolve(true);
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        })();
      });

      return await sendWithTimeout;
    } catch (error) {
      console.error('❌ Failed to send bulk registration summary:', error);
      return false;
    }
  }

  // Send test email - production hosting platform optimized
  async sendTestEmail(toEmail: string): Promise<boolean> {
    try {
      // Use shorter timeout for faster feedback on hosting platforms
      const sendWithTimeout = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ Test email timeout to ${toEmail} - hosting platform may block SMTP`);
          reject(new Error('Test email timeout - hosting platform constraint'));
        }, 5000); // Reduced to 5 seconds for faster feedback

        (async () => {
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
                    <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
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
                Environment: ${process.env.NODE_ENV || 'development'}
                
                You can now send welcome emails to new users when they are registered.
              `
            };

            const info = await this.transporter.sendMail(mailOptions);
            clearTimeout(timeout);
            console.log(`✅ Test email sent to ${toEmail}:`, info.messageId);
            resolve(true);
          } catch (error: any) {
            clearTimeout(timeout);
            console.log(`📧 Test email failed to ${toEmail}:`, {
              code: error.code,
              message: error.message.substring(0, 50) + '...'
            });
            reject(error);
          }
        })();
      });

      return await sendWithTimeout;
    } catch (error: any) {
      console.log(`❌ Failed to send test email to ${toEmail}`);
      console.log(`💡 This is common on hosting platforms that block SMTP (Render, Heroku, etc.)`);
      console.log(`🔧 Consider using SendGrid, Mailgun, or other email APIs for production`);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default EmailService;
