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

            <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">Available Co-Makers</h1>
                </div>

                <p className="text-muted-foreground">
                    Select a co-maker for your loan application. 
                    The selected member must approve your request before being officially assigned.
                </p>

                {/* Co-Maker List */}
                <div className="grid md:grid-cols-3 gap-6">

                    {coMakers.map((member) => {
                        const isPending = pendingRequests.includes(member.id);

                        return (
                            <div
                                key={member.id}
                                className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="font-semibold">{member.name}</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Cooperative Member
                                        </p>
                                    </div>
                                    <UserCheck className="h-6 w-6 text-green-600" />
                                </div>

                                {isPending ? (
                                    <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                                        <Clock className="h-4 w-4" />
                                        Pending Approval
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => requestCoMaker(member.id)}
                                        className="w-full rounded-xl bg-primary text-white py-2 hover:opacity-90 transition"
                                    >
                                        Request as Co-Maker
                                    </button>
                                )}
                            </div>
                        );
                    })}

                </div>

            </div>
        </AppLayout>
    );
}
