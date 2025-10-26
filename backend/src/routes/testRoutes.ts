// src/routes/testRoutes.ts
import express from 'express';
import { emailService } from '../services/emailService';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public endpoint to check email status - accessible without authentication for testing
router.get('/email-status', async (req, res) => {
  try {
    const configCheck = emailService.checkConfiguration();
    console.log('🔍 Public email configuration check:', configCheck);
    
    let isReady = false;
    let connectionError = null;
    
    try {
      console.log('🔍 Testing email connection...');
      isReady = await emailService.verifyConnection();
      console.log('✅ Email connection successful');
    } catch (error: any) {
      connectionError = {
        message: error.message,
        code: error.code,
        response: error.response
      };
      console.error('❌ Email connection failed:', error);
    }
    
    res.json({
      configurationCheck: configCheck,
      emailServiceReady: isReady,
      configuration: {
        emailService: process.env.EMAIL_SERVICE || 'Not configured',
        emailUser: process.env.EMAIL_USER ? 
          `${process.env.EMAIL_USER.substring(0, 3)}...${process.env.EMAIL_USER.split('@')[1]}` : 
          'Not configured',
        smtpHost: process.env.SMTP_HOST || 'Not configured',
        hasEmailPassword: !!process.env.EMAIL_PASSWORD,
        emailPasswordLength: process.env.EMAIL_PASSWORD?.length || 0
      },
      connectionError: connectionError,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Email status endpoint error:', error);
    res.status(500).json({
      message: 'Failed to check email configuration',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Public endpoint to send a test email - accessible without authentication for testing
router.post('/send-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ message: 'Email address is required' });
      return;
    }
    
    const sent = await emailService.sendTestEmail(email);
    
    if (sent) {
      res.json({ success: true, message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send test email' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error sending test email',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Public endpoint to test password email - accessible without authentication for testing
router.post('/password-email', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    if (!name || !email) {
      res.status(400).json({ message: 'Name and email are required' });
      return;
    }
    
    // Create a test user object with the minimum required fields
    const testUser = {
      name,
      email,
      role: role || 'student'
    };
    
    // Generate default password based on role
    const defaultPassword = role === 'student' ? 'student@123' : 
                           role === 'faculty' ? 'faculty@123' : 
                           role === 'hod' ? 'hod@123' : 
                           role === 'dean' ? 'dean@123' : 
                           'default@123';
    
    // Send the password email
    const sent = await emailService.sendPasswordEmail(testUser, defaultPassword);
    
    if (sent) {
      res.json({ 
        success: true, 
        message: 'Password email sent successfully',
        password: defaultPassword,
        emailSent: true
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send password email',
        password: defaultPassword,
        emailSent: false
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error sending password email',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Test email endpoint (admin only)
router.post('/test-email', protect, isAdmin, async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ message: 'Email address is required' });
      return;
    }

    // Test user data
    const testUser = {
      name: 'Test User',
      email: email,
      role: 'student'
    };

    const testPassword = 'Test@123';

    // Send test email
    const emailSent = await emailService.sendPasswordEmail(testUser, testPassword);

    if (emailSent) {
      res.json({ 
        message: 'Test email sent successfully!',
        recipient: email,
        emailSent: true
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to send test email',
        recipient: email,
        emailSent: false
      });
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      message: 'Server error while sending test email',
      error: error.message
    });
  }
});

// Check email service status (admin only)
router.get('/email-status', protect, isAdmin, async (req, res): Promise<void> => {
  try {
    const configCheck = emailService.checkConfiguration();
    console.log('🔍 Email configuration check:', configCheck);
    
    let isReady = false;
    let connectionError = null;
    
    try {
      isReady = await emailService.verifyConnection();
    } catch (error: any) {
      connectionError = {
        message: error.message,
        code: error.code,
        response: error.response
      };
      console.error('❌ Email verification failed:', error);
    }
    
    res.json({
      emailServiceReady: isReady,
      configuration: {
        emailUser: process.env.EMAIL_USER ? 
          `${process.env.EMAIL_USER.substring(0, 3)}...${process.env.EMAIL_USER.split('@')[1]}` : 
          'Not configured',
        emailPassword: process.env.EMAIL_PASSWORD ? 'Configured' : 'Not configured',
        emailService: process.env.EMAIL_SERVICE || 'Not configured',
        smtpHost: process.env.SMTP_HOST || 'Not configured'
      },
      configurationCheck: configCheck,
      connectionError: connectionError,
      environmentCheck: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPassword: !!process.env.EMAIL_PASSWORD,
        emailPasswordLength: process.env.EMAIL_PASSWORD?.length || 0
      }
    });
  } catch (error: any) {
    console.error('❌ Email status check failed:', error);
    res.status(500).json({
      emailServiceReady: false,
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;
