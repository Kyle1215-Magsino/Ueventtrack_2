# U-EventTrack Hostinger Deployment Guide

## Architecture
This setup serves:
- **React Frontend** (built static files from `frontend/dist`)
- **Laravel Backend API** (proxied through Node.js to PHP)
- **Node.js Express Server** (handles routing and proxy)

## Prerequisites
1. Hostinger account with Node.js hosting support
2. PHP 8.2+ enabled
3. MySQL database
4. Composer installed on server

## Deployment Steps

### 1. Upload Files to Hostinger
Upload these files/folders to your hosting root (e.g., `public_html` or `domains/ueventtrack.online/public_html`):
```
├── backend/              (Laravel backend)
├── frontend/             (React source - will be built)
├── package.json
├── server.js
├── .htaccess
└── README.md
```

### 2. Setup Laravel Backend

#### A. Configure Environment
```bash
cd backend
cp .env.example .env
nano .env
```

Update these values:
```env
APP_NAME="U-EventTrack"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://ueventtrack.online

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

# Frontend URL for CORS
FRONTEND_URL=https://ueventtrack.online
```

#### B. Install Dependencies & Setup
```bash
# Install Composer dependencies
composer install --optimize-autoloader --no-dev

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed database (optional)
php artisan db:seed --force

# Cache config for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link
php artisan storage:link
```

#### C. Set Permissions
```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 3. Build Frontend

```bash
cd frontend
npm ci
npm run build
```

This creates `frontend/dist/` with the production React build.

### 4. Install Node.js Dependencies

From project root:
```bash
npm install
```

### 5. Setup Node.js Application in Hostinger

#### A. Using Hostinger Panel:
1. Go to **Advanced → Node.js**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 18.x or higher
   - **Application mode**: Production
   - **Application root**: `/domains/ueventtrack.online/public_html` (or your path)
   - **Application URL**: `https://ueventtrack.online`
   - **Application startup file**: `server.js`
   - **Port**: Use the port assigned by Hostinger (usually 3000)

4. Click **Create**

#### B. Environment Variables (Optional):
Add in Node.js app settings:
```
PORT=3000
NODE_ENV=production
```

### 6. Start the Application

The Node.js app should auto-start. If not:
```bash
npm start
```

Or using PM2 (if available):
```bash
pm2 start server.js --name ueventtrack
pm2 save
pm2 startup
```

### 7. Setup Laravel Backend to Run

Create a PHP-FPM service or use Hostinger's PHP-CGI to run Laravel on port 8000:

**Option A: Using PHP Built-in Server (Development/Testing)**
```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000 &
```

**Option B: Using Apache/Nginx (Production - Recommended)**
Create a separate subdomain or virtual host pointing to `backend/public/` running on port 8000.

### 8. Test the Deployment

1. **Test Frontend**: 
   - Visit `https://ueventtrack.online`
   - Should show the React login page

2. **Test API**:
   - Visit `https://ueventtrack.online/api/health`
   - Should return: `{"message":"U-EventTrack API Backend..."}`

3. **Test Login**:
   - Login with admin credentials
   - Dashboard should load

### 9. Update Mobile App

After deployment, rebuild mobile APK with production URL:

In `USG_app/App.jsx`:
```javascript
const API_URL = 'https://ueventtrack.online/api'; // ✅ Already updated!
```

Then rebuild:
```bash
cd USG_app
eas build --platform android --profile preview
```

## Troubleshooting

### API Returns 404
- Check that Laravel backend is running on port 8000
- Verify proxy configuration in `server.js`

### Frontend Shows Blank Page
- Check browser console for errors
- Verify `frontend/dist/` exists and has files
- Check `server.js` paths are correct

### CORS Errors
- Update `backend/config/cors.php`
- Ensure `FRONTEND_URL` in `.env` matches your domain

### Database Connection Fails
- Verify database credentials in `backend/.env`
- Check MySQL is running
- Test connection: `php artisan tinker` → `DB::connection()->getPdo();`

### Permission Errors
```bash
cd backend
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

## Production Checklist

- [ ] `APP_DEBUG=false` in `.env`
- [ ] `APP_ENV=production` in `.env`
- [ ] Composer dependencies installed with `--no-dev`
- [ ] Laravel caches created (config, route, view)
- [ ] Frontend built (`npm run build`)
- [ ] Database migrated
- [ ] Storage permissions set
- [ ] HTTPS enabled (Hostinger provides free SSL)
- [ ] Mobile APK rebuilt with production URL
- [ ] Backups configured

## Maintenance

### Update Application
```bash
# Pull latest changes
git pull

# Update backend
cd backend
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Update frontend
cd ../frontend
npm ci
npm run build

# Restart Node.js app
pm2 restart ueventtrack
```

### Clear Caches
```bash
cd backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

## Support
For issues, check Laravel logs: `backend/storage/logs/laravel.log`
