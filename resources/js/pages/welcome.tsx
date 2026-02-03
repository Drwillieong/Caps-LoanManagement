import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { login } from '@/routes';

export default function Welcome() {
    useEffect(() => {
        router.visit(login());
    }, []);

    return null;
}
