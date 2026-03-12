import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to check internet connectivity
 * Uses navigator.onLine and attempts a fetch to verify actual connectivity
 */
export function useInternetCheck() {
    const [isOnline, setIsOnline] = useState(true);
    const [isChecking, setIsChecking] = useState(false);

    const checkConnection = useCallback(async () => {
        // First check navigator.onLine
        if (!navigator.onLine) {
            setIsOnline(false);
            return false;
        }

        setIsChecking(true);
        try {
            // Try to fetch a small resource to verify actual connectivity
            // Using a simple reliable CDN that is likely to be accessible
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Using a simple reliable endpoint - Google Fonts API (very reliable)
            const response = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap', {
                method: 'HEAD',
                cache: 'no-cache',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            setIsOnline(true);
            return true;
        } catch {
            // If the fetch fails, check navigator.onLine again as fallback
            setIsOnline(navigator.onLine);
            return navigator.onLine;
        } finally {
            setIsChecking(false);
        }
    }, []);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            // When coming back online, verify with a quick check
            checkConnection();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic check every 30 seconds when online
        const intervalId = setInterval(() => {
            if (navigator.onLine) {
                checkConnection();
            }
        }, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(intervalId);
        };
    }, [checkConnection]);

    return { isOnline, isChecking, checkConnection };
}

/**
 * Helper function to check if we can send emails (has internet)
 * Returns true if online, false otherwise
 */
export async function canSendEmail(): Promise<boolean> {
    // First check basic browser online status
    if (!navigator.onLine) {
        return false;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Try to reach a reliable external resource
        await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap', {
            method: 'HEAD',
            cache: 'no-cache',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return true;
    } catch {
        // Fallback to navigator.onLine if fetch fails
        return navigator.onLine;
    }
}

