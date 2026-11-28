# Claude AI Prompt for U-EventTrack

## Project Context

I'm working on **U-EventTrack**, a campus attendance tracking system deployed on Hostinger. The project has three main components:

### Architecture:
1. **Laravel Backend (PHP 8.2+)** - REST API at `/backend/`
   - Database: MySQL
   - Authentication: Laravel Sanctum
   - Features: Student management, events, attendance, fines, reports
   
2. **React Frontend (Vite)** - Admin dashboard at `/frontend/`
   - Built to `/frontend/dist/`
   - Served by Node.js Express on port 3000
   
3. **React Native Mobile App** - Student app at `/USG_app/`
   - Expo SDK 58
   - For student registration, login, and check-ins
   - API URL: `https://ueventtrack.online/api`

### Current Deployment Setup on Hostinger:
- **Domain**: https://ueventtrack.online
- **Hosting**: Hostinger Node.js hosting
- **Web Server**: Apache with `.htaccess` routing
- **Node.js**: Express server (`server.js`) serves React frontend
- **Laravel**: Served directly by Apache (not through Node.js proxy)

### File Structure:
```
public_html/
├── backend/              # Laravel API
│   ├── app/
│   ├── public/          # Laravel entry point
│   │   └── index.php
│   ├── storage/
│   ├── .env             # Laravel environment config
│   └── ...
├── frontend/            # React source
│   ├── src/
│   ├── dist/           # Built frontend (npm run build)
│   └── package.json
├── USG_app/            # Mobile app source (not deployed)
├── server.js           # Node.js Express server (port 3000)
├── package.json        # Root package.json
└── .htaccess          # Apache routing config
```

### Routing Configuration:
- `https://ueventtrack.online/api/*` → Apache → `backend/public/index.php`
- `https://ueventtrack.online/storage/*` → `backend/storage/app/public/`
- `https://ueventtrack.online/*` → Node.js (port 3000) → React frontend

## Current Issue

[Describe your issue here, for example:]
- Getting 403 Forbidden errors
- API not connecting
- Laravel backend returning errors
- Mobile app not connecting
- Build failures
- etc.

## What I Need Help With

[Be specific about what you want Claude to help with:]

1. Fix the [specific error/issue]
2. Optimize the deployment process
3. Debug API connection issues
4. Configure environment variables
5. Set up proper routing
6. etc.

## Environment Details

**Local Development:**
- OS: Windows
- PHP: 8.2+
- Node.js: 18+
- Database: MySQL (UE database)
- Backend runs on: `localhost:8000` (php artisan serve)
- Frontend runs on: `localhost:5173` (vite dev)

**Production (Hostinger):**
- PHP: 8.2+
- Node.js: 22.13+
- MySQL database configured in `backend/.env`
- Node.js app auto-starts through Hostinger panel
- Domain: https://ueventtrack.online

## Key Files to Review

**Backend Configuration:**
- `backend/.env` - Laravel environment (database, app URL, etc.)
- `backend/routes/api.php` - API routes
- `backend/config/cors.php` - CORS configuration

**Frontend Configuration:**
- `frontend/src/api/axiosConfig.js` - API base URL
- `frontend/vite.config.js` - Build configuration

**Deployment Configuration:**
- `.htaccess` - Apache routing rules
- `server.js` - Node.js Express server
- `package.json` - Root dependencies and build scripts

**Mobile App:**
- `USG_app/App.jsx` line 14 - API_URL configuration

## Important Notes

1. **Authentication**: 
   - Web: User model with roles (admin, officer, student)
   - Mobile: Student model with Sanctum tokens
   
2. **CORS**: Frontend at `https://ueventtrack.online` needs access to API

3. **Database**: 
   - Name: Check `backend/.env` DB_DATABASE
   - Migrations: `php artisan migrate --force`
   - Seeders: `php artisan db:seed --force`

4. **Build Process**:
   ```bash
   npm run build  # Builds frontend and caches Laravel config
   npm start      # Starts Node.js server
   ```

5. **Hostinger Specifics**:
   - Node.js app must be configured in Hostinger panel
   - Apache handles PHP/Laravel automatically
   - `.htaccess` controls routing

## Expected Behavior

- Web app login at `https://ueventtrack.online/login` should work
- API calls to `https://ueventtrack.online/api/*` should reach Laravel
- Mobile app should connect to API and login/register students
- Storage files accessible at `https://ueventtrack.online/storage/*`

## Recent Changes

[List any recent changes you made:]
- Updated API_URL in mobile app to production domain
- Modified .htaccess routing
- Changed server.js configuration
- etc.

## Error Logs (if any)

**Node.js Console:**
```
[Paste Node.js console output or logs here]
```

**Laravel Logs** (`backend/storage/logs/laravel.log`):
```
[Paste Laravel error logs here]
```

**Browser Console:**
```
[Paste browser console errors here]
```

## Questions for Claude

1. [Your specific question 1]
2. [Your specific question 2]
3. [etc.]

---

## Additional Context

**Tech Stack:**
- Backend: Laravel 11, PHP 8.2+, MySQL
- Frontend: React 19, Vite 8, TailwindCSS
- Mobile: React Native, Expo SDK 58
- Server: Node.js 22, Express 4
- Hosting: Hostinger (Apache + Node.js)

**Features:**
- Student/Officer management
- Event creation and management
- Barcode scanning check-in
- Face recognition attendance
- Real-time dashboards and analytics
- Fines tracking
- Reports (PDF/Excel export)
- Announcements system
- Mobile app for students

**GitHub Repository:** [Add if public]

**Live Site:** https://ueventtrack.online

---

Please help me resolve this issue and ensure the application deploys and runs correctly on Hostinger!
