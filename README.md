# Student Feedback System

A comprehensive web application for managing student feedback in educational institutions, built with React (Next.js) frontend and Node.js backend.

## 🚀 Features

- **Role-based Access Control**: Admin, Dean, HOD, Faculty, and Student roles
- **Real-time Feedback Management**: Submit, view, and analyze feedback
- **Advanced Analytics**: Visual reports and statistics
- **Branch-wise Filtering**: Filter feedback by branch, term, and status
- **Bulk Operations**: Bulk student registration with automatic password generation
- **Email Integration**: Automated email notifications for user accounts
- **Responsive Design**: Works seamlessly on all devices

## 📋 Requirements

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Gmail account (for email functionality)

## 🛠️ Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd student-feedback-system
   ```

2. **Run the setup script**
   ```bash
   chmod +x fix-and-start-all.sh
   ./fix-and-start-all.sh
   ```
   This will:
   - Install dependencies for both frontend and backend
   - Start both servers
   - Backend: http://localhost:5001
   - Frontend: http://localhost:3000

## 📁 Project Structure

```
student-feedback-system/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Authentication middleware
│   │   ├── interfaces/      # TypeScript interfaces
│   │   ├── services/        # Email and other services
│   │   └── server.ts        # Main server file
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Next.js frontend
│   ├── app/                 # Next.js app directory
│   │   ├── admin-dashboard/
│   │   ├── dean-dashboard/
│   │   ├── hod-dashboard/
│   │   ├── login/
│   │   └── ...
│   ├── components/          # React components
│   ├── utils/               # Utility functions
│   ├── package.json
│   └── next.config.ts
├── fix-and-start-all.sh     # Quick start script
└── README.md
```

## 🔧 Manual Setup

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string and Gmail credentials
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the frontend server**
   ```bash
   npm run dev
   ```

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/student-feedback

# JWT Secret
JWT_SECRET=your-jwt-secret-here

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server
PORT=5001
NODE_ENV=development
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## 👥 User Roles

1. **Admin**: Full system access, user management, system settings
2. **Dean**: Branch-wide feedback access, advanced reports
3. **HOD**: Department-specific feedback access and management
4. **Faculty**: View feedback for their subjects
5. **Student**: Submit feedback for enrolled subjects

## 📊 Key Features

### For Administrators

- User management (create, update, delete users)
- Bulk student registration
- System-wide analytics
- Email notifications management

### For HODs

- Real-time feedback status tracking
- Branch-wise filtering and analytics
- Term-wise submission statistics
- Export capabilities

### For Students

- Submit feedback for enrolled subjects
- View submission history
- Password reset functionality

## 🔍 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/bulk-register` - Bulk student registration

### Feedback Management

- `GET /api/feedback` - Get feedback data
- `POST /api/feedback` - Submit feedback
- `GET /api/hod/feedback-status` - Get feedback status

### User Management

- `GET /api/auth/users` - Get users list
- `PUT /api/auth/users/:id` - Update user
- `DELETE /api/auth/users/:id` - Delete user

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend is running on port 5001
2. **Database Connection**: Check MongoDB connection string
3. **Email Issues**: Verify Gmail app password configuration
4. **Port Conflicts**: Frontend may run on port 3001 if 3000 is occupied
5. **Backend Connection**: Check `NEXT_PUBLIC_API_URL` in `.env.local`

### Frontend Issues

6. **"Module not found: Can't resolve '@tailwindcss/postcss'"**:

   ```bash
   cd frontend
   npm uninstall @tailwindcss/postcss
   rm -rf .next
   npm cache clean --force
   npm run dev
   ```

7. **"Invalid next.config.ts options detected"**:

   - Check that your `next.config.ts` follows the latest Next.js format
   - Remove deprecated options like `swcMinify`
   - Use `turbopack` instead of `experimental.turbo`

8. **PostCSS Configuration Error**:

   - Ensure `postcss.config.mjs` has the correct format:

   ```javascript
   const config = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };
   ```

9. **Build cache issues**:

   ```bash
   cd frontend
   rm -rf .next
   rm -rf node_modules/.cache
   npm run dev
   ```

10. **Internal Server Error**:
    - Check that both frontend and backend are running
    - Verify API endpoints are accessible: `curl http://localhost:5001/api/health`
    - Check browser console for specific error messages
    - Ensure environment variables are properly set

### Port Information

- Backend: `http://localhost:5001`
- Frontend: `http://localhost:3000` (or `http://localhost:3001` if 3000 is in use)

### Restart Servers

```bash
# Stop all servers
pkill -f "node.*backend" && pkill -f "node.*frontend"

# Restart using the script
./fix-and-start-all.sh
```

## 📧 Email Setup

1. Enable 2-factor authentication in Gmail
2. Generate an app password
3. Use the app password in your .env file
4. Test email functionality through the admin panel

## 🔄 Development Workflow

1. Make changes to source code
2. Backend auto-restarts with nodemon
3. Frontend auto-reloads with Next.js hot reload
4. Test functionality in browser
5. Commit changes to git

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please contact the development team.
