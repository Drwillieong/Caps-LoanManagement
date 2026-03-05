import { Head, usePage } from '@inertiajs/react';
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
    DollarSign
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
    created_at: string;
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

    useEffect(() => {
        if (!hasPendingLoan || !currentLoan) {
            setIsPolling(false);
            return;
        }

        if (['approved', 'rejected', 'released'].includes(currentLoan.status)) {
            setIsPolling(false);
            return;
        }

        const interval = setInterval(() => {
            window.location.reload();
        }, 10000);

        return () => clearInterval(interval);
    }, [hasPendingLoan, currentLoan?.status]);

    useEffect(() => {
        if (isPolling) {
            const interval = setInterval(() => {
                setLastUpdated(new Date());
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [isPolling]);

    function getStatusBadge(status: string) {
        switch (status) {
            case 'approved':
            case 'released':
                return <Badge className="bg-green-500">Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500">Rejected</Badge>;
            case 'awaiting_comaker':
                return <Badge className="bg-yellow-500">Awaiting Co-Maker</Badge>;
            case 'pending_gm_review':
                return <Badge className="bg-blue-500">Pending GM Review</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    }

    function getStatusMessage(status: string) {
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
                return {
                    icon: <XCircle className="h-12 w-12 text-red-500" />,
                    title: 'Loan Rejected',
                    description: 'Your loan application was not approved.',
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
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Clock className="h-5 w-5" />
                                    Loan Application History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {loanHistory.map((historyLoan) => (
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
                            </CardContent>
                        </Card>
                    )}
                </div>
            </AppLayout>
        );
    }

    const statusInfo = getStatusMessage(currentLoan.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Pending Application" />
            
            <div className="space-y-6 px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Pending Application</h1>
                        <p className="text-muted-foreground">Track your loan application status</p>
                    </div>
                    {isPolling && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Auto-refreshing every 10s</span>
                        </div>
                    )}
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

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5" />
                            Loan Details
                        </CardTitle>
                        <CardDescription>
                            Applied on {formatDate(currentLoan.created_at)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-gray-500">Loan Type</p>
                                <p className="font-semibold text-lg">{currentLoan.loan_type_name}</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-gray-500">Principal Amount</p>
                                <p className="font-semibold text-lg">{formatCurrency(currentLoan.principal_amount)}</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-gray-500">Term</p>
                                <p className="font-semibold text-lg">{currentLoan.terms_months} Months</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-gray-500">Interest</p>
                                <p className="font-semibold text-lg">{formatCurrency(currentLoan.interest_amount)}</p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-gray-500">Monthly Payment</p>
                                <p className="font-semibold text-lg text-blue-600">{formatCurrency(currentLoan.monthly_amortization)}</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-gray-500">Total Payable</p>
                                <p className="font-semibold text-lg">{formatCurrency(currentLoan.total_amount_due)}</p>
                            </div>
                            {currentLoan.remarks && (
                                <div className="rounded-lg bg-muted p-4">
                                    <p className="text-sm text-gray-500">Remarks</p>
                                    <p className="font-semibold text-lg">{currentLoan.remarks}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {currentLoan.co_makers && currentLoan.co_makers.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="h-5 w-5" />
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

                <div className="flex gap-4">
                    {currentLoan.status === 'approved' || currentLoan.status === 'released' ? (
                        <Link
                            href="/dashboards/Member/ActiveLoan"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white hover:opacity-90 transition"
                        >
                            <DollarSign className="h-4 w-4" />
                            View Active Loan
                        </Link>
                    ) : currentLoan.status === 'rejected' ? (
                        <Link
                            href="/dashboards/Member/ApplyLoan"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white hover:opacity-90 transition"
                        >
                            <FileText className="h-4 w-4" />
                            Apply Again
                        </Link>
                    ) : (
                        <Link
                            href={`/dashboards/Member/Loan/${currentLoan.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:opacity-90 transition"
                        >
                            <Edit className="h-4 w-4" />
                            Edit Application
                        </Link>
                    )}
                    
                    <Link
                        href="/dashboards/Member/MemberDashboard"
                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted transition"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {isPolling && (
                    <p className="text-sm text-muted-foreground text-center">
                        Last checked: {lastUpdated.toLocaleTimeString()}
                    </p>
                )}

                {loanHistory && loanHistory.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="h-5 w-5" />
                                Loan Application History
                            </CardTitle>
                            <CardDescription>
                                Your past and current loan applications
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loanHistory.map((historyLoan) => (
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
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
