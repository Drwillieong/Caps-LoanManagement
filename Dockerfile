FROM dunglas/frankenphp:php8.4-bookworm

# System dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    zip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22 + npm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions
RUN install-php-extensions \
    pdo_mysql \
    gd \
    redis \
    intl \
    zip

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Composer dependencies
COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts

# Node dependencies
COPY package.json package-lock.json ./

RUN npm install

# Application
COPY . .

# Build React/Vite
RUN npm run build

# Laravel directories
RUN mkdir -p \
    storage/framework/sessions \
    storage/framework/views \
    storage/framework/cache \
    storage/logs \
    bootstrap/cache

RUN chmod -R 775 storage bootstrap/cache

# Composer autoload
RUN composer dump-autoload --optimize

# Laravel package discovery
RUN php artisan package:discover --ansi

# Start application (Runs migrations & seeders before launching FrankenPHP)
CMD ["sh", "-c", "php artisan migrate --force --seed && frankenphp php-server --listen 0.0.0.0:${PORT:-8080} --root /app/public"]