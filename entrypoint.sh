#!/bin/sh

# Cache configurations for speed
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations (Safe for production)
php artisan migrate --force

# Start PHP-FPM and Nginx
php-fpm -D && nginx -g 'daemon off;'