<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureUrl();
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    protected function configureUrl(): void
    {
        // Force HTTPS in production
        if (app()->isProduction()) {
            URL::forceScheme('https');
        }

        // Force the root URL for asset/url generation (emails, signed URLs, etc.)
        // This ensures emails use the correct domain instead of localhost.
        // It is skipped while running in the console (e.g. wayfinder route
        // generation during `npm run build`): otherwise the generated client
        // routes would embed an absolute domain that does not exist on the
        // deployment host, breaking every client-side request there.
        if (! app()->runningInConsole()) {
            URL::forceRootUrl(config('app.url', 'http://localhost'));
        }
    }
}
