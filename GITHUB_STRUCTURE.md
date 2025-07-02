# GitHub Repository Structure - Student Feedback System

## ✅ Files/Directories to COMMIT to GitHub

### Root Level

```
/
├── README.md                    # Project documentation
├── EMAIL_SETUP.md              # Email configuration guide
├── GMAIL_SETUP_GUIDE.md        # Gmail setup instructions
├── .gitignore                  # Root gitignore file
├── frontend/                   # Frontend application
└── backend/                    # Backend application
```

### Backend Directory (`/backend/`)

```
backend/
├── src/                        # Source code
│   ├── server.ts              # Main server file
│   ├── api/                   # API routes (if any)
│   ├── config/                # Configuration files
│   │   └── db.ts              # Database configuration
│   ├── controllers/           # Route controllers
│   │   ├── authController.ts
│   │   ├── feedbackController.ts
│   │   └── subjectController.ts
│   ├── interfaces/            # TypeScript interfaces
│   │   ├── Feedback.ts
│   │   ├── Subject.ts
│   │   └── User.ts
│   ├── middleware/            # Custom middleware
│   │   └── authMiddleware.ts
│   ├── models/                # Database models
│   │   ├── Feedback.ts
│   │   ├── Subject.ts
│   │   └── User.ts
│   ├── routes/                # API routes
│   │   ├── authRoutes.ts
│   │   ├── feedbackRoutes.ts
│   │   └── subjectRoutes.ts
│   └── services/              # Business logic services
├── types/                     # Type definitions
│   └── express.d.ts
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── .gitignore                 # Backend gitignore
```

### Frontend Directory (`/frontend/`)

```
frontend/
├── app/                       # Next.js app directory
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   ├── favicon.ico           # Favicon
│   ├── admin-dashboard/      # Admin dashboard pages
│   ├── hod-dashboard/        # HOD dashboard pages
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   ├── subjects/             # Subjects page
│   ├── submit-feedback/      # Feedback submission
│   ├── my-feedback/          # User's feedback history
│   └── update-password/      # Password update page
├── components/               # Reusable React components
│   ├── AddSubjectForm.tsx
│   ├── AdminNavbar.tsx
│   ├── AdminSidebar.tsx
│   ├── EditSubjectForm.tsx
│   ├── FeedbackCard.tsx
│   ├── FeedbackForm.tsx
│   ├── FeedbackReportChart.tsx
│   ├── HODNavbar.tsx
│   ├── Navbar.tsx
│   ├── StudentNavbar.tsx
│   ├── SubjectCard.tsx
│   ├── SubjectFeedbackForm.tsx
│   ├── SubjectManagement.tsx
│   └── UserFormModal.tsx
├── utils/                    # Utility functions
│   ├── api.ts               # API client
│   └── auth.ts              # Authentication utilities
├── public/                  # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── next.config.ts           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── postcss.config.mjs       # PostCSS configuration (module)
├── eslint.config.mjs        # ESLint configuration
├── next-env.d.ts            # Next.js type definitions
├── README.md                # Frontend documentation
└── .gitignore               # Frontend gitignore
```

## ❌ Files/Directories to EXCLUDE from GitHub (in .gitignore)

### Root Level Exclusions

- `node_modules/` - Node.js dependencies
- `.DS_Store` - macOS system files
- `.vscode/` - VS Code settings
- `test-*.html` - Temporary test files
- `test-*.js` - Temporary test scripts
- `admin-login-test.html` - Test file
- `create-admin.js` - Temporary script
- `update-user.js` - Temporary script
- `test-students.csv` - Test data
- `sample-students.csv` - Test data
- `TESTING_SUMMARY.md` - Temporary documentation

### Backend Exclusions

- `node_modules/` - Dependencies
- `dist/` - Compiled JavaScript
- `.env` - Environment variables (sensitive)
- `admin_token.json` - Temporary API tokens
- `login_response.json` - API test responses
- `createUsers.js` - Temporary scripts
- `test-*.js` - Test scripts
- `*.log` - Log files

### Frontend Exclusions

- `node_modules/` - Dependencies
- `.next/` - Next.js build cache
- `out/` - Static export directory
- `.env*` - Environment variables
- `*.tsbuildinfo` - TypeScript build info
- `tailwind-test/node_modules` - Test dependencies

## 🔧 Environment Setup

### Required Environment Variables (NOT in repo)

Create these files locally but don't commit them:

#### `/backend/.env`

```env
MONGODB_URI=mongodb://localhost:27017/student-feedback
JWT_SECRET=your-secret-key
PORT=5001
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
NODE_ENV=development
```

#### `/frontend/.env.local` (if needed)

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## 📝 Important Notes

1. **Sensitive Data**: Never commit passwords, API keys, or database credentials
2. **Test Files**: Temporary test files and scripts should not be in the repo
3. **Build Artifacts**: Compiled code and build directories are generated and shouldn't be committed
4. **Dependencies**: `node_modules` folders are large and can be recreated with `npm install`
5. **IDE Settings**: Personal editor settings should not be shared
6. **Log Files**: Runtime logs contain temporary data and grow large

## 🚀 Setup Instructions for New Developers

1. Clone the repository
2. Create `.env` files with appropriate values
3. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
4. Start development servers:

   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

This structure ensures a clean, secure, and maintainable codebase on GitHub while keeping sensitive and temporary files local.
