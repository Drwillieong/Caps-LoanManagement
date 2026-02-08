import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

// Define the auth layout props type
interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export default function AuthSimpleLayout({
  children,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <div 
      className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative overflow-hidden"
      style={{
        backgroundImage: 'url("/bg2.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Green overlay for better readability */}
      <div className="absolute inset-0 bg-white/55 z-0" />
      
      {/* Decorative green gradient accents */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600 z-0" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 via-green-500 to-green-400 z-0" />
      
      {/* Green accent circles for visual interest */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-300/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-green-400/15 rounded-full blur-3xl" />
      
      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4">
            <Link
              href={home()}
              className="flex flex-col items-center gap-2 font-medium group"
            >
              <div className="mb-1 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                <AppLogoIcon className="h-20 w-auto drop-shadow-lg" />
              </div>
              <span className="sr-only">{title}</span>
            </Link>

            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-green-800 bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-center text-sm text-green-600/80 font-medium">
                {description}
              </p>
            </div>
          </div>
          
          {/* White card with subtle green border */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl shadow-green-900/10 border border-green-100/50 p-8">
            {children}
          </div>
          
          {/* Footer info */}
          <div className="text-center">
            <p className="text-xs text-green-500/70">
              Secure Login • Powered by LEIMCO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

