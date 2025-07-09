#!/bin/bash

echo "====================================="
echo "Cleaning up unnecessary files from Student Feedback System"
echo "====================================="

# Navigate to project root directory
cd "$(dirname "$0")"

echo "Removing test files and documentation..."

# Remove test files from root directory
rm -f admin-login-test.html
rm -f api-test.html
rm -f comprehensive-test.js
rm -f cors-test.html
rm -f create-admin.js
rm -f create-test-dean.js
rm -f dean-dashboard-tester.html
rm -f fix-cors.sh
rm -f fix-path-to-regexp.sh
rm -f fix-server-responding.js
rm -f fixes-summary.js
rm -f force-delete-test.js
rm -f frontend-test.html
rm -f gmail-troubleshoot.js
rm -f health-check.js
rm -f list-users.js
rm -f login-test.html
rm -f restart-servers.sh
rm -f sample-students.csv
rm -f seed-branches.js
rm -f test-api-helper.js
rm -f test-api.html
rm -f test-api.js
rm -f test-branches-endpoint.js
rm -f test-bulk-register.html
rm -f test-cors-fixes.js
rm -f test-cors.js
rm -f test-dean-dashboard.js
rm -f test-dean-endpoints.js
rm -f test-dean-feedback.js
rm -f test-dean-with-token.js
rm -f test-delete-subject.js
rm -f test-email-service.html
rm -f test-endpoints.js
rm -f test-feedback-direct.js
rm -f test-ports.js
rm -f test-reports.html
rm -f test-students.csv
rm -f test-subject-deletion.js
rm -f update-user.js

# Remove documentation files that are no longer needed
rm -f CORS-FIX-GUIDE.md
rm -f EMAIL_SETUP.md
rm -f GITHUB_STRUCTURE.md
rm -f GMAIL_SETUP_GUIDE.md
rm -f HIERARCHICAL_SELECTION.md
rm -f TESTING_SUMMARY.md
rm -f dean-dashboard-fix-summary.md
rm -f fix-summary.md

# Remove docs directory if it exists
rm -rf docs/

# Remove root package.json and node_modules if they exist (they shouldn't be needed)
rm -f package.json
rm -f package-lock.json
rm -rf node_modules/

# Remove log files
rm -f backend-logs.txt
rm -f frontend-logs.txt

echo "Cleaning up backend directory..."
cd backend

# Remove test files from backend
rm -f admin_token.json
rm -f create-dean-user.js
rm -f createUsers.js
rm -f debug-login.js
rm -f generate-test-feedback.js
rm -f login_response.json
rm -f test-bulk-upload.js
rm -f test-email-config.js
rm -f test-email.ts
rm -f test-login-server.js
rm -f test-password.js

echo "Cleaning up frontend directory..."
cd ../frontend

# Remove test directories and files from frontend
rm -rf tailwind-test/
rm -rf docs/
rm -f .eslintrc.js
rm -f README.md

# Remove duplicate config files (keep the .ts versions)
rm -f next.config.js
rm -f postcss.config.js

# Remove TypeScript build info
rm -f tsconfig.tsbuildinfo

# Remove .DS_Store files (Mac specific)
find . -name ".DS_Store" -delete

echo "Cleaning up build artifacts..."
cd ..

# Remove build artifacts
rm -rf backend/dist/
rm -rf frontend/.next/

echo "====================================="
echo "Cleanup completed!"
echo "====================================="
echo "Removed files:"
echo "- All test files (*.test.*, *-test.*, test-*.*, etc.)"
echo "- Documentation files (*.md except main README)"
echo "- Temporary and log files"
echo "- Build artifacts"
echo "- Duplicate configuration files"
echo "- .DS_Store files"
echo "====================================="
echo "Remaining essential files:"
echo "- Source code (backend/src/, frontend/app/, frontend/components/)"
echo "- Configuration files (.env, package.json, tsconfig.json, etc.)"
echo "- Main README.md"
echo "- fix-and-start-all.sh script"
echo "====================================="
