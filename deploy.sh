#!/bin/bash

# DEPLOYMENT SCRIPT FOR VEINOVEL
# Run this script on your server after uploading files

echo "🚀 Starting VeiNovel Deployment..."

# 1. Install Composer dependencies
echo "📦 Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev

# 2. Generate APP_KEY if not exists
echo "🔑 Generating application key..."
php artisan key:generate

# 3. Run database migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# 4. Seed basic data
echo "🌱 Seeding database..."
php artisan db:seed --class=DatabaseSeeder

# 5. Clear and cache config
echo "⚡ Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Create storage symlink
echo "🔗 Creating storage symlink..."
php artisan storage:link

# 7. Set proper permissions
echo "🔒 Setting file permissions..."
chmod -R 755 storage
chmod -R 755 bootstrap/cache
chmod -R 644 storage/logs/*

echo "✅ Deployment completed successfully!"
echo "🌐 Your VeiNovel application is ready!"

# 8. Show important URLs
echo ""
echo "📋 Important URLs:"
echo "   Main Site: https://yourdomain.com"
echo "   Admin Panel: https://yourdomain.com/admin"
echo "   Login: https://yourdomain.com/login"
echo ""
echo "👤 Default Admin Account:"
echo "   Email: admin@fantl.com"
echo "   Password: Check DatabaseSeeder.php"
