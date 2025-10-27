// src/routes/testEmailRoutes.ts
import express, { Request, Response } from 'express';
import { emailService } from '../services/emailService';

const router = express.Router();

// Test email configuration endpoint
router.get('/email-config', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔧 Testing email configuration...');
    
    // Check configuration
    const configCheck = emailService.checkConfiguration();
    
    // Test connection
    console.log('🔄 Attempting connection verification...');
    const isConnected = await emailService.verifyConnection(1); // Only 1 retry for quick testing
    
    res.json({
      success: true,
      emailConfig: {
        isConfigured: configCheck.isConfigured,
        issues: configCheck.issues,
        suggestions: configCheck.suggestions,
        connectionStatus: isConnected ? 'Connected' : 'Failed to connect',
        environment: {
          EMAIL_SERVICE: process.env.EMAIL_SERVICE,
          EMAIL_USER: process.env.EMAIL_USER?.replace(/(.{3})(.*)(@.*)/, '$1***$3'), // Mask email
          hasPassword: !!process.env.EMAIL_PASSWORD,
          NODE_ENV: process.env.NODE_ENV || 'development'
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Email configuration test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Email configuration test failed',
      message: error.message,
      suggestions: [
        'Check your .env file for EMAIL_USER and EMAIL_PASSWORD',
        'Ensure Gmail App Password is correctly set',
        'Consider using SendGrid for production hosting',
        'Check server logs for detailed error information'
      ]
    });
  }
});

// Send test email endpoint
router.post('/send-test-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
      return;
    }

    console.log(`🧪 Sending test email to: ${email}`);
    
    const testUser = {
      name: 'Test User',
      email: email,
      id: 'test123',
      role: 'student'
    };
    
    const testPassword = 'TestPass123!';
    
    const result = await emailService.sendPasswordEmail(testUser, testPassword);
    
    if (result) {
      res.json({
        success: true,
        message: 'Test email sent successfully!',
        details: {
          to: email,
          status: 'Email sent'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        message: 'Email service returned false'
      });
    }
  } catch (error: any) {
    console.error('❌ Test email sending failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test email sending failed',
      message: error.message
    });
  }
});

export default router;