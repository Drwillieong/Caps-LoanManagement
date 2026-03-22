import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Bell } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
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
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Notifications', href: '/dashboards/Member/Notification' },
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

export default function Notification({ loan_notifications = [] }: Props) {
    const [markingAsRead, setMarkingAsRead] = useState(false);

    const markAllAsRead = () => {
        router.post('/dashboards/Member/Notification/mark-read', {}, {
            onBefore: () => setMarkingAsRead(true),
            onFinish: () => setMarkingAsRead(false),
            preserveScroll: true,
            // Automatically refreshes these props from the server after the post
            only: ['loan_notifications', 'unread_notifications_count'],
        });
    };

    function formatDate(dateStr: string): string {
        if (!dateStr || dateStr === 'null') return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Invalid Date';

        return date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Notifications" />
            
            <div className="flex flex-1 flex-col gap-6 p-6">
                <Card className="border-emerald-100 w-full">
                    <CardHeader>
                        <CardTitle className="text-emerald-900 dark:text-emerald-100 text-2xl">
                            Loan Notifications
                        </CardTitle>
                        <CardDescription className="text-lg">
                            All updates on your loan applications and status changes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loan_notifications.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <Button 
                                        onClick={markAllAsRead} 
                                        disabled={markingAsRead}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Bell className={`h-4 w-4 ${markingAsRead ? 'animate-spin' : ''}`} />
                                        {markingAsRead ? 'Marking as read...' : 'Mark all as read'}
                                    </Button>
                                </div>
                                
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-semibold">Date & Time</TableHead>
                                            <TableHead className="font-semibold">From</TableHead>
                                            <TableHead className="font-semibold">Type</TableHead>
                                            <TableHead className="max-w-md">Message</TableHead>
                                            <TableHead>Comment</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loan_notifications.map((notification) => (
                                            <TableRow key={notification.id}>
                                                <TableCell className="font-mono text-sm whitespace-nowrap">
                                                    {formatDate(notification.date)}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {notification.from}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        notification.status === 'comaker_request' 
                                                            ? 'bg-orange-100 text-orange-800' 
                                                            : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {notification.status === 'comaker_request' ? '🤝 Co-Maker Request' : notification.loan_type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-md break-words">
                                                    {notification.description}
                                                </TableCell>
                                                <TableCell className="text-gray-500 italic">
                                                    {notification.comment || 'No comments'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                <Bell className="h-16 w-16 text-gray-300 mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Notifications Yet</h3>
                                <p className="text-gray-500 max-w-md">
                                    You'll see updates here regarding your loan applications and approvals.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}