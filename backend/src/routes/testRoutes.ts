// src/routes/testRoutes.ts
import express from 'express';
import { emailService } from '../services/emailService';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

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

// Check email service status
router.get('/email-status', protect, isAdmin, async (req, res): Promise<void> => {
  try {
    const configCheck = emailService.checkConfiguration();
    const isReady = await emailService.verifyConnection();
    
    res.json({
      emailServiceReady: isReady,
      configuration: {
        emailUser: process.env.EMAIL_USER ? 'Configured' : 'Not configured',
        emailPassword: process.env.EMAIL_PASSWORD ? 'Configured' : 'Not configured',
        emailService: process.env.EMAIL_SERVICE || 'Not configured',
        smtpHost: process.env.SMTP_HOST || 'Not configured'
      },
      configurationCheck: configCheck
    });
  } catch (error: any) {
    res.status(500).json({
      emailServiceReady: false,
      error: error.message
    });
  }
});

export default router;
