# U-EventTrack

Modern attendance tracking system for campus events with barcode scanning, facial recognition, and real-time analytics.

## Quick Start

### Local Development

**Backend (Laravel):**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000
```

**Frontend (React):**
```bash
cd frontend
npm install
npm run dev
```

**Mobile App (React Native/Expo):**
```bash
cd USG_app
npm install
npm start
```

### Production Build

```bash
npm run build
npm start
```

## Deployment to Hostinger

1. Upload project to server
2. Run `npm run build` to build frontend and cache Laravel
3. Configure Laravel `.env` with database credentials
4. Run `npm run migrate` to setup database
5. Start server with `npm start` or setup with PM2

## Project Structure

```
├── backend/          # Laravel API
├── frontend/         # React web dashboard
├── USG_app/          # React Native mobile app
├── server.js         # Node.js proxy server
└── package.json      # Root package config
```

## Tech Stack

- **Backend:** Laravel 11, PHP 8.2+, MySQL
- **Frontend:** React, Vite, TailwindCSS
- **Mobile:** React Native, Expo SDK 58
- **Server:** Node.js Express (proxy)

## Features

- 📱 Mobile app for students (barcode check-in)
- 👤 Face recognition attendance
- 📊 Real-time analytics dashboard
- 👥 Student & officer management
- 📅 Event management
- 🔔 Announcements system
- 💰 Fines tracking
- 📝 Attendance reports (PDF/Excel)

## URLs

- **Production:** https://ueventtrack.online
- **API:** https://ueventtrack.online/api
- **Mobile API:** https://ueventtrack.online/api (configured in USG_app/App.jsx)

## Default Credentials

Check `backend/database/seeders/` for seeded accounts.

## Support

For deployment issues, check:
- `backend/storage/logs/laravel.log` - Laravel errors
- `laravel.log` - Laravel startup log (if using start.sh)
- Node.js console output
