import { Head, usePage } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    RefreshCw, 
    FileText,
    Calendar,
    User,
    ArrowRight,
    Edit,
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Member Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Pending Application',
        href: '/dashboards/Member/PendingApplication',
    },
];

interface LoanData {
    id: number;
    loan_type_name: string;
    principal_amount: number;
    terms_months: number;
    interest_amount: number;
    total_amount_due: number;
    monthly_amortization: number;
    status: string;
    remarks: string | null;
    rejected_by: string | null;
    rejected_at: string | null;
    created_at: string;
    has_edited: boolean;
    co_makers: Array<{
        id: number;
        name: string;
        email: string;
        status: string;
    }>;
}

interface PendingApplicationProps {
    loan: LoanData | null;
    hasPendingLoan: boolean;
    loanHistory: LoanData[];
}

export default function PendingApplication({ loan, hasPendingLoan, loanHistory }: PendingApplicationProps) {
    const [currentLoan, setCurrentLoan] = useState<LoanData | null>(loan);
    const [isPolling, setIsPolling] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Toast removed to prevent showing on every page load

    // Auto-refresh removed per user request

    // Last updated timer removed with auto-refresh

    function getStatusBadge(status: string) {
        switch (status) {
            case 'approved':
            case 'released':
                return <Badge className="bg-green-500">Approved</Badge>;
            case 'rejected':
            case 'rejected_by_co_maker':
            case 'rejected_by_gm':
            case 'rejected_by_credit_com':
                return <Badge className="bg-red-500">Rejected</Badge>;
            case 'awaiting_comaker':
                return <Badge className="bg-yellow-500">Awaiting Co-Maker</Badge>;
            case 'pending_gm_review':
                return <Badge className="bg-blue-500">Pending GM Review</Badge>;
            case 'pending_cc_review':
                return <Badge className="bg-purple-500">Pending CC Review</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    }

    function getStatusMessage(status: string, rejectedBy: string | null = null, rejectedAt: string | null = null) {
        switch (status) {
            case 'approved':
                return {
                    icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
                    title: 'Loan Approved! 🎉',
                    description: 'Your loan application has been approved.',
                    color: 'bg-green-50 border-green-200'
                };
            case 'released':
                return {
                    icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
                    title: 'Loan Released! 🎉',
                    description: 'Your loan has been released.',
                    color: 'bg-green-50 border-green-200'
                };
            case 'rejected':
            case 'rejected_by_co_maker':
            case 'rejected_by_gm':
            case 'rejected_by_credit_com':
                let rejectedByText = '';
                if (rejectedBy === 'gm') {
                    rejectedByText = ' by the General Manager';
                } else if (rejectedBy === 'credit_com') {
                    rejectedByText = ' by the Credit Coordinator';
                } else if (rejectedBy === 'co_maker') {
                    rejectedByText = ' by your Co-Maker';
                }
                return {
                    icon: <XCircle className="h-12 w-12 text-red-500" />,
                    title: 'Loan Rejected',
                    description: `Your loan application was not approved${rejectedByText}.${rejectedAt ? ` Rejected on ${rejectedAt}.` : ''}`,
                    color: 'bg-red-50 border-red-200'
                };
            case 'awaiting_comaker':
                return {
                    icon: <Clock className="h-12 w-12 text-yellow-500" />,
                    title: 'Awaiting Co-Maker Confirmation',
                    description: 'Your selected co-maker needs to confirm.',
                    color: 'bg-yellow-50 border-yellow-200'
                };
            case 'pending_gm_review':
                return {
                    icon: <Clock className="h-12 w-12 text-blue-500" />,
                    title: 'Pending GM Review',
                    description: 'Your loan application is under review.',
                    color: 'bg-blue-50 border-blue-200'
                };
            case 'pending_cc_review':
                return {
                    icon: <Clock className="h-12 w-12 text-purple-500" />,
                    title: 'Pending Credit Coordinator Review',
                    description: 'Your loan application is under final review.',
                    color: 'bg-purple-50 border-purple-200'
                };
            default:
                return {
                    icon: <AlertCircle className="h-12 w-12 text-gray-500" />,
                    title: 'Status Unknown',
                    description: 'Please contact support.',
                    color: 'bg-gray-50 border-gray-200'
                };
        }
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatCurrency(amount: number | string): string {
    if (amount === null || amount === undefined || amount === '') return '₱0.00';

    const number = typeof amount === 'string' ? Number(amount) : amount;

    if (isNaN(number)) return '₱0.00';

    return `₱${number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

    const [historyPage, setHistoryPage] = useState(1);
    const historyPerPage = 5;
    const historyTotalPages = Math.max(1, Math.ceil((loanHistory?.length ?? 0) / historyPerPage));
    const historyStart = (historyPage - 1) * historyPerPage;
    const historyEnd = historyStart + historyPerPage;
    const paginatedHistory = (loanHistory ?? []).slice(historyStart, historyEnd);

    useEffect(() => {
        setHistoryPage(1);
    }, [loanHistory?.length]);

    if (!hasPendingLoan || !currentLoan) {
        return (
            <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
                <Head title="Pending Application" />
                
                <div className="space-y-6 px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Pending Application</h1>
                            <p className="text-muted-foreground">Track your loan application status</p>
                        </div>
                    </div>

                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Application</h3>
                            <p className="text-gray-500 text-center mb-6">
                                You don't have any loan applications awaiting approval.
                            </p>
                            <Link
                                href="/dashboards/Member/ApplyLoan"
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white hover:opacity-90 transition"
                            >
                                Apply for a Loan
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </CardContent>
                    </Card>

                    {loanHistory && loanHistory.length > 0 && (
                        <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg text-emerald-900 dark:text-emerald-100">
                                    <Clock className="h-5 w-5 text-emerald-600" />
                                    Loan Application History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {paginatedHistory.map((historyLoan) => (
                                        <div 
                                            key={historyLoan.id}
                                            className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">
                                                        {historyLoan.loan_type_name}
                                                    </span>
                                                    {getStatusBadge(historyLoan.status)}
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                    <span>
                                                        Principal: {formatCurrency(historyLoan.principal_amount)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(historyLoan.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Monthly</p>
                                                <p className="font-semibold">
                                                    {formatCurrency(historyLoan.monthly_amortization)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {loanHistory.length > 0 && (
                                    <DataTablePagination
                                        currentPage={historyPage}
                                        pageSize={historyPerPage}
                                        totalPages={historyTotalPages}
                                        totalRows={loanHistory.length}
                                        onFirstPage={() => setHistoryPage(1)}
                                        onPreviousPage={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                                        onNextPage={() => setHistoryPage((prev) => Math.min(prev + 1, historyTotalPages))}
                                        onLastPage={() => setHistoryPage(historyTotalPages)}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </AppLayout>
        );
    }

    const statusInfo = getStatusMessage(currentLoan.status, currentLoan.rejected_by, currentLoan.rejected_at);

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Pending Application" />
            
            <div className="space-y-6 px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Pending Application</h1>
                        <p className="text-muted-foreground">Track your loan application status</p>
                    </div>
                </div>

                <Card className={`border-l-4 ${statusInfo.color.replace('bg-', 'border-').split(' ')[0]}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                {statusInfo.icon}
                                {statusInfo.title}
                            </CardTitle>
                            {getStatusBadge(currentLoan.status)}
                        </div>
                        <CardDescription className="text-base mt-2">
                            {statusInfo.description}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg text-emerald-900 dark:text-emerald-100">
                            <FileText className="h-5 w-5 text-emerald-600" />
                            Loan Details
                        </CardTitle>
                        <CardDescription>
                            Applied on {formatDate(currentLoan.created_at)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                <p className="text-sm text-emerald-600">Loan Type</p>
                                <p className="font-semibold text-lg text-emerald-700">{currentLoan.loan_type_name}</p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                <p className="text-sm text-emerald-600">Principal Amount</p>
                                <p className="font-semibold text-lg text-emerald-700">{formatCurrency(currentLoan.principal_amount)}</p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                <p className="text-sm text-emerald-600">Term</p>
                                <p className="font-semibold text-lg text-emerald-700">{currentLoan.terms_months} Months</p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                <p className="text-sm text-emerald-600">Interest</p>
                                <p className="font-semibold text-lg text-emerald-700">{formatCurrency(currentLoan.interest_amount)}</p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                <p className="text-sm text-emerald-600">Monthly Payment</p>
                                <p className="font-semibold text-lg text-emerald-700">{formatCurrency(currentLoan.monthly_amortization)}</p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                <p className="text-sm text-emerald-600">Total Payable</p>
                                <p className="font-semibold text-lg text-emerald-700">{formatCurrency(currentLoan.total_amount_due)}</p>
                            </div>
                            {currentLoan.remarks && (
                                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                    <p className="text-sm text-emerald-600">Remarks</p>
                                    <p className="font-semibold text-lg text-emerald-700">{currentLoan.remarks}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {currentLoan.co_makers && currentLoan.co_makers.length > 0 && (
                    <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-emerald-900 dark:text-emerald-100">
                                <User className="h-5 w-5 text-emerald-600" />
                                Co-Maker Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {currentLoan.co_makers.map((coMaker) => (
                                    <div 
                                        key={coMaker.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{coMaker.name}</p>
                                                <p className="text-sm text-gray-500">{coMaker.email}</p>
                                            </div>
                                        </div>
                                        <div>
                                            {coMaker.status === 'confirmed' ? (
                                                <Badge className="bg-green-500">Confirmed</Badge>
                                            ) : coMaker.status === 'rejected' ? (
                                                <Badge className="bg-red-500">Rejected</Badge>
                                            ) : (
                                                <Badge className="bg-yellow-500">Pending</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-xl border">
                    {currentLoan.status === 'approved' || currentLoan.status === 'released' ? (
                        <Button asChild className="flex-1 sm:flex-none min-w-[180px]">
                            <Link href="/dashboards/Member/MemberActiveLoan" className="w-full">
                                <span className="text-sm font-semibold">₱</span>
                                View Active Loan
                            </Link>
                        </Button>
                    ) : currentLoan.status === 'rejected' || currentLoan.status === 'rejected_by_co_maker' || currentLoan.status === 'rejected_by_gm' || currentLoan.status === 'rejected_by_credit_com' ? (
                        <Button asChild className="flex-1 sm:flex-none min-w-[180px] bg-primary hover:bg-primary/90">
                            <Link href="/dashboards/Member/ApplyLoan">
                                <FileText className="h-4 w-4" />
                                Apply Again
                            </Link>
                        </Button>
                    ) : currentLoan.has_edited ? (
                        <Alert className="flex-1 border-yellow-200 bg-yellow-50 text-yellow-800">
                            <Edit className="h-4 w-4 opacity-70 mt-0.5" />
                            <AlertTitle className="font-medium">Edit Locked</AlertTitle>
                            <AlertDescription className="text-sm">
                                You have already edited this application once. Changes are now locked.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Button asChild className="flex-1 sm:flex-none min-w-[180px] bg-blue-600 hover:bg-blue-700">
                            <Link href={`/dashboards/Member/Loan/${currentLoan.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit Application
                            </Link>
                        </Button>
                    )}
                    
                    <Button asChild variant="outline" className="flex-1 sm:flex-none min-w-[160px]">
                        <Link href="/dashboards/Member/MemberDashboard">
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>



                {loanHistory && loanHistory.length > 0 && (
                    <Card className="mt-6 border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-emerald-900 dark:text-emerald-100">
                                <Clock className="h-5 w-5 text-emerald-600" />
                                Loan Application History
                            </CardTitle>
                            <CardDescription>
                                Your past and current loan applications
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {paginatedHistory.map((historyLoan) => (
                                    <div 
                                        key={historyLoan.id}
                                        className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">
                                                    {historyLoan.loan_type_name}
                                                </span>
                                                {getStatusBadge(historyLoan.status)}
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                <span>
                                                    Principal: {formatCurrency(historyLoan.principal_amount)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(historyLoan.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Monthly</p>
                                            <p className="font-semibold">
                                                {formatCurrency(historyLoan.monthly_amortization)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {loanHistory.length > 0 && (
                                <DataTablePagination
                                    currentPage={historyPage}
                                    pageSize={historyPerPage}
                                    totalPages={historyTotalPages}
                                    totalRows={loanHistory.length}
                                    onFirstPage={() => setHistoryPage(1)}
                                    onPreviousPage={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                                    onNextPage={() => setHistoryPage((prev) => Math.min(prev + 1, historyTotalPages))}
                                    onLastPage={() => setHistoryPage(historyTotalPages)}
                                />
                            )}
                        </CardContent>
                    </Card>
                )}
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
