# # Student Feedback System

A comprehensive web application for collecting and managing student feedback on courses and instructors. Built with Next.js frontend and Node.js backend.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and Framer Motion
- **Backend**: Node.js with Express, TypeScript, and MongoDB
- **Authentication**: JWT-based authentication with role-based access control
- **Database**: MongoDB with Mongoose ODM

## 👥 User Roles

1. **Students**: Submit feedback for their courses
2. **Faculty**: View feedback for their courses (future feature)
3. **HOD (Head of Department)**: View department-wide feedback reports
4. **Dean**: View college-wide feedback reports
5. **Admin**: Manage users, subjects, and system configuration

## ✨ Features

### For Students

- View subjects based on their year and branch
- Submit detailed feedback for courses and instructors
- View their feedback submission history
- Update password and profile

### For Administrators

- User management (Create, Read, Update, Delete)
- Subject management with branch and term filtering
- Bulk student upload via CSV
- Email notifications for new user accounts
- Comprehensive feedback reports and analytics

### For HODs and Deans

- Department/college-wide feedback reports
- Analytics and insights on teaching quality
- Export reports in various formats

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd student-feedback-system
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your actual values
   npm run dev
   ```

3. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

### Environment Variables

#### Backend (`.env`)

```env
MONGODB_URI=mongodb://localhost:27017/student-feedback
JWT_SECRET=your-very-secure-jwt-secret-key-here
PORT=5001
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
NODE_ENV=development
```

## 📊 Database Schema

### User Model

```typescript
{
  name: string
  email: string (unique)
  rollNumber?: string (for students)
  password: string (hashed)
  role: 'student' | 'faculty' | 'hod' | 'dean' | 'admin'
  branch?: string
  year?: number (1-4, for students)
  passwordResetRequired: boolean
}
```

### Subject Model

```typescript
{
  name: string
  code: string
  instructor: string
  department: string
  year: number
  term: number
  branch: string[] (supports multiple branches)
  questions: string[] (feedback questions)
}
```

### Feedback Model

```typescript
{
  student: ObjectId (ref: User)
  subject: ObjectId (ref: Subject)
  responses: {
    question: string
    rating: number (1-5)
    comment?: string
  }[]
  submittedAt: Date
}
```

## 🛠️ API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/reset-password` - Reset password

### Users (Admin only)

- `GET /api/auth/users` - Get all users
- `POST /api/auth/users` - Create new user
- `PUT /api/auth/users/:id` - Update user
- `DELETE /api/auth/users/:id` - Delete user
- `POST /api/auth/bulk-register` - Bulk register students

### Subjects

- `GET /api/subjects` - Get all subjects (Admin/HOD)
- `GET /api/subjects/student` - Get student's subjects (filtered)
- `POST /api/subjects` - Create subject (Admin)
- `PUT /api/subjects/:id` - Update subject (Admin)
- `DELETE /api/subjects/:id` - Delete subject (Admin)

### Feedback

- `POST /api/feedback` - Submit feedback (Student)
- `GET /api/feedback/student/me` - Get student's feedback history
- `GET /api/feedback/subject/:id` - Get feedback for subject (Faculty/HOD/Admin)

## 🎨 Frontend Structure

```
frontend/
├── app/                    # Next.js app router pages
├── components/             # Reusable React components
├── utils/                 # Utility functions
│   ├── api.ts            # API client with interceptors
│   └── auth.ts           # Authentication utilities
└── public/               # Static assets
```

## 🔧 Development

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

### Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## 📱 Responsive Design

The application is fully responsive and works on:

- Desktop computers
- Tablets
- Mobile phones

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Rate limiting (future enhancement)

## 📧 Email Integration

The system sends email notifications for:

- New user account creation with temporary passwords
- Password reset requests
- Feedback submission confirmations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. Check the documentation in the `docs/` folder
2. Review the `EMAIL_SETUP.md` for email configuration
3. Check `GITHUB_STRUCTURE.md` for project organization

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User management system
  - Subject and feedback management
  - Role-based dashboards
  - Email notifications

## 🎯 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics and reporting
- [ ] Mobile app version
- [ ] Integration with existing college systems
- [ ] Automated report generation
- [ ] Multi-language support

A comprehensive web application for collecting and managing student feedback on courses and instructors.

## Features

### 🎓 Multi-Role Support

- **Students**: Submit feedback, view subjects, track submissions
- **Faculty**: View feedback reports, analyze ratings
- **HOD**: Department-level analytics and reports
- **Admin**: Complete system management

### 📧 Automated Email System

- **Auto-generated secure passwords** for new users
- **Welcome emails** with login credentials
- **Bulk registration** with email notifications
- **Professional HTML templates**

### 🏫 Multi-Branch Support

- **MCA Regular** and **MCA DS** branch support
- **Common subjects** can be assigned to multiple branches
- **Smart filtering** shows relevant subjects per student

### 📊 Analytics & Reports

- Real-time feedback analytics
- Department-wise performance reports
- Export capabilities (CSV, PDF)
- Visual charts and graphs

## Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd student-feedback-system

# Backend setup
cd backend
npm install
npm run build

# Frontend setup
cd ../frontend
npm install
npm run build
```

### 2. Database Setup

```bash
# Start MongoDB
brew services start mongodb/brew/mongodb-community
# or
sudo systemctl start mongod
```

### 3. Email Configuration (Important!)

```bash
# Copy and edit environment file
cp backend/.env.example backend/.env
```

**For Gmail users** (most common):

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Generate an App Password: Security → App passwords → Mail → Other
4. Update `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

📖 **Detailed setup**: See `GMAIL_SETUP_GUIDE.md`

### 4. Run the Application

```bash
# Start backend (from backend/)
npm start

# Start frontend (from frontend/)
npm run dev
```

Visit `http://localhost:3000` (or the port shown in terminal)

## Email Setup Guide

### ⚠️ IMPORTANT: Gmail Authentication

If you see "Username and Password not accepted" errors:

- Gmail requires **App Passwords**, not regular passwords
- See `GMAIL_SETUP_GUIDE.md` for step-by-step instructions
- Use the email test panel in Admin Dashboard → Email Settings

### Supported Email Providers

- **Gmail** (recommended) - requires App Password
- **Outlook/Hotmail**
- **Custom SMTP** servers
- **Professional services** (SendGrid, Mailgun, etc.)

### Test Your Configuration

```bash
# Quick config check
cd backend
node test-email-config.js

# Or use the web interface:
# Admin Dashboard → Email Settings → Check Configuration
```

## System Architecture

```
Frontend (Next.js/React)
├── Student Dashboard
├── Faculty Dashboard
├── HOD Dashboard
├── Admin Dashboard
└── Authentication

Backend (Node.js/Express)
├── REST API
├── Email Service (Nodemailer)
├── Authentication (JWT)
├── Database (MongoDB)
└── File Upload (CSV)
```

## Key Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose
- **Email**: Nodemailer with HTML templates
- **Auth**: JWT tokens with role-based access
- **File Processing**: CSV parsing for bulk uploads

## Project Structure

```
student-feedback-system/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API logic
│   │   ├── models/         # Database schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Email service
│   │   └── middleware/     # Auth & validation
│   ├── .env               # Configuration
│   └── package.json
├── frontend/
│   ├── app/               # Next.js pages
│   ├── components/        # Reusable components
│   ├── utils/            # Helper functions
│   └── package.json
├── EMAIL_SETUP.md        # Email configuration guide
├── GMAIL_SETUP_GUIDE.md  # Gmail-specific setup
└── README.md            # This file
```

## Common Issues & Solutions

### 🔧 Email Issues

**Problem**: "Username and Password not accepted"

- **Solution**: Use Gmail App Password, not regular password
- **Guide**: See `GMAIL_SETUP_GUIDE.md`

**Problem**: Emails not being received

- **Solution**: Check spam folder, verify email address
- **Test**: Use Admin Dashboard → Email Settings

### 🔐 Authentication Issues

**Problem**: "Token expired" or login failures

- **Solution**: Check JWT_SECRET in .env, clear browser storage

**Problem**: Role access denied

- **Solution**: Verify user role in database

### 📊 Data Issues

**Problem**: Subjects not showing for students

- **Solution**: Check year, term, and branch matching
- **Note**: Students only see subjects for their year/term/branch

## Default Credentials

**Admin Account** (create manually in database):

```
Email: admin@example.com
Password: admin@123
Role: admin
```

**Student/Faculty**: Created through Admin Dashboard

- Automatic password generation
- Welcome emails with credentials
- Forced password reset on first login

## Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/student-feedback
JWT_SECRET=your-secret-key
PORT=5001

# Email (Gmail example)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Custom SMTP (alternative)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/users` - Create user (admin)
- `POST /api/auth/bulk-register` - Bulk student upload

### Subjects

- `GET /api/subjects` - All subjects (admin)
- `GET /api/subjects/student` - Student's subjects
- `POST /api/subjects` - Create subject

### Feedback

- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/student/me` - Student's feedback
- `GET /api/feedback/reports` - Analytics reports

### Email Testing

- `GET /api/test/email-status` - Check email config
- `POST /api/test/test-email` - Send test email

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially email functionality)
5. Submit a pull request

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing (bcrypt)
- Environment variable protection
- Input validation and sanitization
- CORS configuration

## Performance Features

- Database indexing
- Efficient queries with pagination
- Optimized frontend builds
- Lazy loading components
- CSV streaming for large uploads

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. Check the relevant setup guides
2. Review common issues above
3. Test email configuration using provided tools
4. Check server logs for detailed error messages

---

**Important**: Always configure email settings before creating users in production!
