import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    Bell, 
    ChevronsLeft, 
    ChevronsRight, 
    ChevronLeft, 
    ChevronRight 
} from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';

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
    const [currentPage, setCurrentPage] = useState(1);

    const notificationsPerPage = 20;
    const totalPages = Math.ceil(loan_notifications.length / notificationsPerPage);
    const startIndex = (currentPage - 1) * notificationsPerPage;
    const endIndex = startIndex + notificationsPerPage;
    const paginatedNotifications = loan_notifications.slice(startIndex, endIndex);

    const rejectedStatuses = [
        'rejected_by_co_maker',
        'rejected_by_gm',
        'rejected_by_credit_com',
    ];
    const pendingStatuses = [
        'pending_gm_review',
        'pending_cc_review',
        'comaker_request',
    ];

    useEffect(() => {
        setCurrentPage(1);
    }, [loan_notifications.length]);

    function getNotificationBadge(status: string) {
        if (rejectedStatuses.includes(status)) {
            return <Badge variant="destructive">Rejected</Badge>;
        }

        if (status === 'released') {
            return (
                <Badge
                    variant="outline"
                    className="border-sky-200 bg-sky-50 text-sky-700"
                >
                    Released
                </Badge>
            );
        }

        if (pendingStatuses.includes(status)) {
            return <Badge variant="secondary">Pending</Badge>;
        }

        return <Badge variant="outline">{status.replaceAll('_', ' ')}</Badge>;
    }

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
                        <Badge variant="secondary">
                            {loan_notifications.length} total
                        </Badge>
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
                                            <TableHead className="text-emerald-700">Date & Time</TableHead>
                                            <TableHead className="text-emerald-700">Admin</TableHead>
                                            <TableHead className="text-emerald-700">Loan Type</TableHead>
                                            <TableHead className="text-emerald-700">Status</TableHead>
                                            <TableHead className="text-emerald-700">Message</TableHead>
                                            <TableHead className="text-emerald-700">Reason</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedNotifications.map((notification) => (
                                            <TableRow key={notification.id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {formatDate(notification.date)}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {notification.from}
                                                </TableCell>
                                                <TableCell>
                                                    {notification.loan_type}
                                                </TableCell>
                                                <TableCell>
                                                    {getNotificationBadge(notification.status)}
                                                </TableCell>
                                                <TableCell className="max-w-md min-w-56 font-medium whitespace-normal">
                                                    {notification.description}
                                                </TableCell>
                                                <TableCell className="max-w-xs min-w-48 whitespace-normal text-muted-foreground">
                                                    {notification.comment || 'No additional comments'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <DataTablePagination
                                    currentPage={currentPage}
                                    pageSize={notificationsPerPage}
                                    totalPages={totalPages}
                                    totalRows={loan_notifications.length}
                                    onFirstPage={() => setCurrentPage(1)}
                                    onPreviousPage={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    onNextPage={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    onLastPage={() => setCurrentPage(totalPages)}
                                />
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

function DataTablePagination({
    currentPage,
    pageSize,
    totalPages,
    totalRows,
    onFirstPage,
    onPreviousPage,
    onNextPage,
    onLastPage,
}: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalRows: number;
    onFirstPage: () => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    onLastPage: () => void;
}) {
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
                0 of {totalRows} row(s) selected.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 min-w-12 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-xs">
                        {pageSize}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={onFirstPage}
                        disabled={isFirstPage}
                        aria-label="Go to first page"
                        title="Go to first page"
                    >
                        <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={onPreviousPage}
                        disabled={isFirstPage}
                        aria-label="Go to previous page"
                        title="Go to previous page"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={onNextPage}
                        disabled={isLastPage}
                        aria-label="Go to next page"
                        title="Go to next page"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={onLastPage}
                        disabled={isLastPage}
                        aria-label="Go to last page"
                        title="Go to last page"
                    >
                        <ChevronsRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
