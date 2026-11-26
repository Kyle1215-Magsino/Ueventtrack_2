#!/bin/bash
# U-EventTrack Startup Script for Hostinger

echo "🚀 Starting U-EventTrack..."

# Navigate to backend directory and start Laravel
cd backend
echo "📦 Starting Laravel backend..."
php artisan serve --host=0.0.0.0 --port=8000 > ../laravel.log 2>&1 &
LARAVEL_PID=$!
echo "✅ Laravel backend started (PID: $LARAVEL_PID)"

# Navigate back to root and start Node.js server
cd ..
echo "🌐 Starting Node.js frontend server..."
NODE_ENV=production node server.js

# If Node.js exits, kill Laravel too
kill $LARAVEL_PID 2>/dev/null
