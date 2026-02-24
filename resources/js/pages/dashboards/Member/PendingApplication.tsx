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
    DollarSign,
    Calendar,
    User,
    ArrowRight
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
}

export default function PendingApplication({ loan, hasPendingLoan }: PendingApplicationProps) {
    const [currentLoan, setCurrentLoan] = useState<LoanData | null>(loan);
    const [isPolling, setIsPolling] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Poll for status updates every 10 seconds when waiting for decision
    useEffect(() => {
        if (!hasPendingLoan || !currentLoan) {
            setIsPolling(false);
            return;
        }

        // Stop polling if loan is approved or rejected
        if (['approved', 'rejected', 'released'].includes(currentLoan.status)) {
            setIsPolling(false);
            return;
        }

        const interval = setInterval(() => {
            window.location.reload();
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(interval);
    }, [hasPendingLoan, currentLoan?.status]);

    // Update last checked time
    useEffect(() => {
        if (isPolling) {
            const interval = setInterval(() => {
                setLastUpdated(new Date());
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [isPolling]);

    // Get status badge variant
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
            case 'pending_secretary_review':
                return <Badge className="bg-purple-500">Pending Secretary Review</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    }

    // Get status message
    function getStatusMessage(status: string) {
        switch (status) {
            case 'approved':
                return {
                    icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
                    title: 'Loan Approved! 🎉',
                    description: 'Your loan application has been approved. You can now view your active loan details.',
                    color: 'bg-green-50 border-green-200'
                };
            case 'released':
                return {
                    icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
                    title: 'Loan Released! 🎉',
                    description: 'Your loan has been released. Please check your active loan for payment details.',
                    color: 'bg-green-50 border-green-200'
                };
            case 'rejected':
                return {
                    icon: <XCircle className="h-12 w-12 text-red-500" />,
                    title: 'Loan Rejected',
                    description: 'Your loan application was not approved. Please contact support for more information.',
                    color: 'bg-red-50 border-red-200'
                };
            case 'awaiting_comaker':
                return {
                    icon: <Clock className="h-12 w-12 text-yellow-500" />,
                    title: 'Awaiting Co-Maker Confirmation',
                    description: 'Your selected co-maker needs to confirm their commitment to your loan. They will receive a notification.',
                    color: 'bg-yellow-50 border-yellow-200'
                };
            case 'pending_gm_review':
                return {
                    icon: <Clock className="h-12 w-12 text-blue-500" />,
                    title: 'Pending GM Review',
                    description: 'Your loan application is under review by the General Manager. This may take a few days.',
                    color: 'bg-blue-50 border-blue-200'
                };
            case 'pending_secretary_review':
                return {
                    icon: <Clock className="h-12 w-12 text-purple-500" />,
                    title: 'Pending Secretary Review',
                    description: 'Your loan application is under review by the Secretary.',
                    color: 'bg-purple-50 border-purple-200'
                };
            default:
                return {
                    icon: <AlertCircle className="h-12 w-12 text-gray-500" />,
                    title: 'Status Unknown',
                    description: 'Please contact support if you have questions about your application.',
                    color: 'bg-gray-50 border-gray-200'
                };
        }
    }

    // Format date
    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Format currency
    function formatCurrency(amount: number): string {
        return `₱${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    // No pending loan state
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

                {/* Status Card */}
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

                {/* Loan Details */}
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

                {/* Co-Maker Information */}
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

                {/* Action Buttons */}
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
                    ) : null}
                    
                    <Link
                        href="/dashboards/Member/MemberDashboard"
                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted transition"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {/* Last Updated */}
                {isPolling && (
                    <p className="text-sm text-muted-foreground text-center">
                        Last checked: {lastUpdated.toLocaleTimeString()}
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
