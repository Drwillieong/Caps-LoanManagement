import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Users, UserCheck, Clock } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Choose Co-Maker',
        href: '/dashboards/Member/CoMaker',
    },
];

interface CoMaker {
    id: number;
    name: string;
    status?: 'pending' | 'approved';
}

export default function CoMaker() {

    // Temporary mock data (replace later with backend data)
    const [coMakers, setCoMakers] = useState<CoMaker[]>([
        { id: 1, name: 'Juan Dela Cruz' },
        { id: 2, name: 'Maria Santos' },
        { id: 3, name: 'Pedro Reyes' },
    ]);

    const [pendingRequests, setPendingRequests] = useState<number[]>([]);

    const requestCoMaker = (id: number) => {
        setPendingRequests([...pendingRequests, id]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Choose Co-Maker" />

        
        </AppLayout>
    );
}
