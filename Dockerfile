FROM dunglas/frankenphp:php8.4-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    zip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 LTS and npm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions required by Laravel and PhpSpreadsheet
RUN install-php-extensions \
    pdo_mysql \
    gd \
    redis \
    intl \
    zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install PHP dependencies first
COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts

# Install JavaScript dependencies
COPY package.json package-lock.json ./

RUN npm install

# Copy application
COPY . .

# Build React/Vite frontend
RUN npm run build

# Laravel directories
RUN mkdir -p \
    storage/framework/sessions \
    storage/framework/views \
    storage/framework/cache \
    storage/logs \
    bootstrap/cache

RUN chmod -R 775 storage bootstrap/cache

# Generate optimized autoload files
RUN composer dump-autoload --optimize

# Laravel package discovery
RUN php artisan package:discover --ansi

# Railway uses the PORT environment variable
CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}"]