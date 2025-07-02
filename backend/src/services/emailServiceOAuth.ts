import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

interface EmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  from: string;
}

class EmailServiceOAuth {
  private config: EmailConfig;

  constructor() {
    this.config = {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
      from: process.env.EMAIL_FROM || ''
    };
  }

  private async createTransporter() {
    const oauth2Client = new OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: this.config.refreshToken
    });

    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token || '';

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.config.from,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        refreshToken: this.config.refreshToken,
        accessToken: accessToken
      }
    });
  }

  async sendWelcomeEmail(email: string, password: string, name: string = 'Student') {
    try {
      const transporter = await this.createTransporter();
      
      const mailOptions = {
        from: this.config.from,
        to: email,
        subject: 'Welcome to Student Feedback System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to Student Feedback System</h2>
            <p>Dear ${name},</p>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> <span style="font-family: monospace; background-color: #e5e7eb; padding: 2px 4px; border-radius: 3px;">${password}</span></p>
            </div>
            <p><strong>Important:</strong> Please change your password after your first login for security.</p>
            <p>You can access the system at: <a href="http://localhost:3000">http://localhost:3000</a></p>
            <p>Best regards,<br>Student Feedback System Team</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error: any) {
      console.error('OAuth Email Error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailServiceOAuth();
