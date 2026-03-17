import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Bell, 
    Calendar,
    ChevronLeft,
    ArrowLeft
} from 'lucide-react';
import { useState, useEffect } from 'react';

import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    const [currentPage, setCurrentPage] = useState(1);
    const notificationsPerPage = 10;
    const totalPages = Math.ceil(loan_notifications.length / notificationsPerPage);

    // Reset to page 1 when notifications change
    useEffect(() => {
        setCurrentPage(1);
    }, [loan_notifications.length]);

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
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-emerald-900 dark:text-emerald-100 text-2xl">Loan Notifications</CardTitle>
                            <CardDescription className="text-lg">All updates on your loan applications and status changes.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-emerald-600" />
                            <span className="text-2xl font-bold text-emerald-700">
                                {loan_notifications.length}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loan_notifications && loan_notifications.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-emerald-200 bg-emerald-50">
                                                <th className="text-left py-4 px-6 text-sm font-semibold text-emerald-800 uppercase tracking-wider">Date & Time</th>
                                                <th className="text-left py-4 px-6 text-sm font-semibold text-emerald-800 uppercase tracking-wider">From</th>
                                                <th className="text-left py-4 px-6 text-sm font-semibold text-emerald-800 uppercase tracking-wider">Loan Type</th>
                                                <th className="text-left py-4 px-6 text-sm font-semibold text-emerald-800 uppercase tracking-wider">Message</th>
                                                <th className="text-left py-4 px-6 text-sm font-semibold text-emerald-800 uppercase tracking-wider">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const startIndex = (currentPage - 1) * notificationsPerPage;
                                                const endIndex = startIndex + notificationsPerPage;
                                                const paginatedNotifications = loan_notifications.slice(startIndex, endIndex);
                                                return paginatedNotifications.map((notification) => (
                                                    <tr 
                                                        key={notification.id} 
                                                        className={`border-b border-emerald-50 hover:bg-emerald-50/50 transition-colors duration-200 ${
                                                            notification.status === 'rejected_by_co_maker' || 
                                                            notification.status === 'rejected_by_gm' || 
                                                            notification.status === 'rejected_by_credit_com' 
                                                                ? 'bg-red-50/50 border-red-200 hover:bg-red-50/75' 
                                                                : notification.status === 'released'
                                                                    ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50/75'
                                                                    : notification.status === 'pending_gm_review' || 
                                                                      notification.status === 'pending_cc_review'
                                                                        ? 'bg-yellow-50/50 border-yellow-200 hover:bg-yellow-50/75'
                                                                        : 'bg-gray-50/50'
                                                        }`}
                                                    >
                                                        <td className="py-4 px-6 text-sm text-gray-700 font-mono text-xs font-medium">
                                                            {formatDate(notification.date)}
                                                        </td>
                                                        <td className="py-4 px-6 text-sm font-semibold text-gray-800 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg px-2 py-1">
                                                            {notification.from}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                                {notification.loan_type}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-sm font-semibold text-gray-900 max-w-lg" title={notification.description}>
                                                            {notification.description}
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-gray-600 max-w-md" title={notification.comment}>
                                                            {notification.comment || 'No additional comments'}
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Enhanced Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 px-6 py-4 bg-emerald-50 border-t-2 border-emerald-200 rounded-b-xl">
                                        <div className="text-sm text-emerald-800 font-medium mb-4 sm:mb-0">
                                            Showing {Math.min((currentPage - 1) * notificationsPerPage + 1, loan_notifications.length)} to{' '}
                                            {Math.min(currentPage * notificationsPerPage, loan_notifications.length)} of{' '}
                                            <strong>{loan_notifications.length}</strong> notifications
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Previous
                                            </Button>
                                            <div className="px-4 py-2 text-sm font-semibold text-emerald-800 bg-emerald-200 rounded-lg min-w-[100px] text-center shadow-sm">
                                                Page {currentPage} of {totalPages}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                            >
                                                Next
                                                <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
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

