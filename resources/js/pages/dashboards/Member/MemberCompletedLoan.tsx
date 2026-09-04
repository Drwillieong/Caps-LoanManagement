import { useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { LoanTablePagination } from '@/components/loan-table-pagination';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

import {
    CheckCircle2,
    FileText,
    Calendar,
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Completed Loan',
        href: dashboard().url,
    },
];

interface Props {
    completedLoans: any[];
    hasCompletedLoans: boolean;
    totalCompletedCount: number;
    totalPrincipalRepaid: number;
    totalInterestPaid: number;
    avgLoanAmount: number;
}

export default function MemberCompletedLoan({
    completedLoans = [],
    hasCompletedLoans = false,
    totalCompletedCount = 0,
    totalPrincipalRepaid = 0,
    totalInterestPaid = 0,
    avgLoanAmount = 0,
}: Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const totalPages = Math.max(1, Math.ceil(completedLoans.length / rowsPerPage));
    const paginatedLoans = useMemo(
        () => completedLoans.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
        [completedLoans, currentPage, rowsPerPage],
    );

    useEffect(() => setCurrentPage(1), [rowsPerPage]);
    useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

    function formatCurrency(amount: number | string): string {
        if (amount === null || amount === undefined || amount === '') return '₱0.00';
        const number = typeof amount === 'string' ? Number(amount) : amount;
        if (isNaN(number)) return '₱0.00';
        return `₱${number.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    function getStatusConfig(status: string) {
        const map: Record<string, { variant: 'default' | 'outline'; label: string; color: string }> = {
            completed: { variant: 'default' as const, label: 'Completed', color: 'bg-emerald-500' },
            paid_off: { variant: 'default' as const, label: 'Paid Off', color: 'bg-green-500' },
        };
        return map[status] ?? { variant: 'outline' as const, label: status.replace(/_/g, ' '), color: 'bg-gray-500' };
    }

    // Always show table headers

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Completed Loans" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Completed Loans</h1>
                    <p className="text-muted-foreground">Your successfully repaid loans ({totalCompletedCount})</p>
                </div>

                <Separator />

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-emerald-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{totalCompletedCount}</div>
                            <p className="text-xs text-muted-foreground">Loans fully repaid</p>
                        </CardContent>
                    </Card>

                    <Card className="border-green-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Repaid</CardTitle>
                            <FileText className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPrincipalRepaid)}</div>
                            <p className="text-xs text-muted-foreground">Principal repaid</p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalInterestPaid)}</div>
                            <p className="text-xs text-muted-foreground">Interest paid</p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Loan</CardTitle>
                            <FileText className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(avgLoanAmount)}</div>
                            <p className="text-xs text-muted-foreground">Per completed loan</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-emerald-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>Loan History</CardTitle>
                        <CardDescription>{hasCompletedLoans ? 'View details of your completed loans.' : 'No completed loans yet. Complete payments to see them here.'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/60 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loan Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loan #</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Principal</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Repaid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Term</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {completedLoans.length > 0 ? paginatedLoans.map((loan: any) => {
                                        const { variant, label, color } = getStatusConfig(loan.status || 'completed');
                                        return (
                                            <tr key={loan.id} className="hover:bg-emerald-50/50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={variant} className={cn(color === 'bg-emerald-500' ? 'bg-emerald-100 text-emerald-700' : color === 'bg-green-500' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                                                            {label}
                                                        </Badge>
                                                        <span className="font-medium">{loan.loan_type_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm font-medium text-emerald-900">#${loan.id}</td>
                                                <td className="px-4 py-4 text-right font-semibold tabular-nums">{formatCurrency(loan.principal_amount || 0)}</td>
                                                <td className="px-4 py-4 text-right font-semibold text-emerald-600 tabular-nums">{formatCurrency(loan.total_paid || 0)}</td>
                                                <td className="px-4 py-4 text-right font-medium tabular-nums">{loan.terms_months || 0} mo</td>
                                                <td className="px-4 py-4 text-right text-sm text-muted-foreground">{formatDate(loan.completion_date)}</td>
                                                <td className="px-4 py-4 text-right">
                                                    <Button asChild variant="outline" size="sm" className="min-w-[80px]">
<Link href={`/dashboards/Member/completed-loans/${loan.id}/view`}>View</Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                                Loan Type	Loan #	Principal	Total Repaid	Term	Completed	Actions
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <LoanTablePagination
                            currentPage={currentPage}
                            rowsPerPage={rowsPerPage}
                            totalItems={completedLoans.length}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={setRowsPerPage}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
