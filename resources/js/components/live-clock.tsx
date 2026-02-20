import { useEffect, useState } from 'react';

export function LiveClock() {
    const [timeString, setTimeString] = useState<string>('');

    useEffect(() => {
        // Function to format the date and time
        const updateClock = () => {
            const now = new Date();
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            };
            const formattedDate = now.toLocaleDateString('en-US', options);
            // Extract just the time portion and reformat to get "AM/PM"
            const timePart = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
            const datePart = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            setTimeString(`${datePart} | ${timePart}`);
        };

        // Initial call
        updateClock();

        // Update every second
        const intervalId = setInterval(updateClock, 1000);

        // Cleanup on unmount to prevent memory leaks
        return () => clearInterval(intervalId);
    }, []);

    return (
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {timeString}
        </span>
    );
}
