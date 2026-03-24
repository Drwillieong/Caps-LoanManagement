FROM dunglas/frankenphp:1.3-php8.4-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libzip-dev zip unzip git \
    && install-php-extensions pdo_mysql redis bcmath gd intl zip

WORKDIR /app
COPY . .

# Install Composer dependencies
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --optimize-autoloader --no-dev

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache

ENTRYPOINT ["php", "artisan", "migrate", "--force", "&&", "frankenphp", "php-server"]