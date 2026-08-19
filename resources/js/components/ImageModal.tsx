import { useEffect, useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    src?: string;
    alt?: string;
}

export default function ImageModal({ isOpen, onClose, src, alt = 'Profile Picture' }: ImageModalProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const frame = requestAnimationFrame(() => setShow(true));
            return () => cancelAnimationFrame(frame);
        }
        setShow(false);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            onClick={onClose}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm transition-opacity duration-300 ${
                show ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
                <X className="h-5 w-5" />
            </button>

            {src ? (
                <img
                    src={src}
                    alt={alt}
                    onClick={(event) => event.stopPropagation()}
                    className={`max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl transition-all duration-300 ${
                        show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                />
            ) : (
                <div
                    onClick={(event) => event.stopPropagation()}
                    className={`flex flex-col items-center gap-3 rounded-xl bg-white/5 px-10 py-12 text-center text-white shadow-2xl transition-all duration-300 ${
                        show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                >
                    <ZoomIn className="h-12 w-12 text-white/70" />
                    <p className="text-sm text-white/80">No profile picture uploaded.</p>
                </div>
            )}
        </div>
    );
}
