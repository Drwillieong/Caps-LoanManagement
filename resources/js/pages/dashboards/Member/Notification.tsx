import { Head, Link, usePage, router } from '@inertiajs/react';
import { 
    Bell, 
    Calendar
} from 'lucide-react';
import { useEffect } from 'react';

import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Notifications',
        href: '/dashboards/Member/Notification',
    },
];

interface LoanNotification {
    id: number;
    loan_type: string;
    date: string;
    from: string;
    description: string;
    comment: string;
    status: string;
}

interface Props {
    loan_notifications?: LoanNotification[];
}

export default function Notification({ 
    loan_notifications = [],
}: Props) {
    // Mark notifications as read on mount (non-Inertia request)
    useEffect(() => {
        fetch('/dashboards/Member/Notification/mark-read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        });
    }, []);


    function formatDate(dateStr: string): string {
        if (!dateStr || dateStr === 'null') return 'N/A';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Notifications" />
            
            <div className="flex flex-1 flex-col gap-6 p-6">
              
                <Card className="border-emerald-100 w-full">
                    <CardHeader>
                        <CardTitle className="text-emerald-900 dark:text-emerald-100 text-2xl">Loan Notifications</CardTitle>
                        <CardDescription className="text-lg">All updates on your loan applications and status changes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loan_notifications && loan_notifications.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-semibold">Date & Time</TableHead>
                                        <TableHead className="font-semibold">From</TableHead>
                                        <TableHead className="font-semibold">Loan Type</TableHead>
                                        <TableHead className="max-w-md">Message</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loan_notifications.map((notification) => (
                                        <TableRow key={notification.id}>
                                            <TableCell className="font-mono text-sm">
                                                {formatDate(notification.date)}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {notification.from}
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    {notification.loan_type}
                                                </span>
                                            </TableCell>
                                            <TableCell title={notification.description}>
                                                {notification.description}
                                            </TableCell>
                                            <TableCell title={notification.comment}>
                                                {notification.comment || 'No additional comments'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gradient-to-b from-gray-50 to-white">
                                <Bell className="h-16 w-16 text-gray-300 mb-6 animate-pulse" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Notifications Yet</h3>
                                <p className="text-gray-500 mb-8 max-w-md">
                                    You'll see notifications here when there are updates on your loan applications, 
                                    such as approvals, rejections, or status changes from co-makers, GM, or Credit Coordinator.
                                </p>
                                <div className="space-y-2 text-sm text-gray-500">
                                    <p>• Loan application submitted</p>
                                    <p>• Co-maker response received</p>
                                    <p>• GM/Credit Com decision made</p>
                                    <p>• Loan released for payment</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

