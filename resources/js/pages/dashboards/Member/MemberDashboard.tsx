import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Bell,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    CreditCard,
    Eye,
    EyeOff,
    FileText,
    HandCoins,
    Loader2,
    Users,
    UserCheck,
    Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { LiveClock } from '@/components/live-clock';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Member Dashboard',
        href: dashboard().url,
    },
];

interface LoanProgress {
    loan_id: number;
    loan_type: string;
    total_amount: number;
    remaining_balance: number;
    total_months: number;
    paid_months: number;
    next_due_date: string | null;
    next_due_amount: number;
    payment_status: 'paid' | 'due_soon' | 'upcoming';
}

interface LoanEligibility {
    max_loan_allowed: number;
    basic_salary: number;
    max_monthly_payment: number;
    has_active_loan: boolean;
    active_loans_at_least_half_paid: boolean;
}

interface LoanNotification {
    id: number;
    loan_type: string;
    date: string;
    from: string;
    description: string;
    comment: string;
    status: string;
    target_url?: string | null;
}

interface CoMakerLoan {
    loan_id: number;
    loan_type: string;
    borrower: {
        name: string;
        member_id: string;
    };
    principal_amount: number;
    total_amount_due: number;
    remaining_balance: number;
    status: string;
    monthly_payment: number;
    next_due_date: string | null;
    next_due_amount: number;
}

interface DashboardProps {
    comakerRequestCount?: number;
    share_capital_balance?: number;
    loan_balance?: number;
    active_loan_count?: number;
    completed_loan_count?: number;
    has_pending_loan?: boolean;
    loan_progress?: LoanProgress | null;
    loan_eligibility?: LoanEligibility | null;
    profileCompleted?: boolean;
    loan_notifications?: LoanNotification[];
}

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
type Tone = 'emerald' | 'blue' | 'green' | 'amber' | 'red' | 'slate';

export default function MemberDashboard({
    comakerRequestCount = 0,
    share_capital_balance = 0,
    loan_balance = 0,
    active_loan_count = 0,
    completed_loan_count = 0,
    has_pending_loan = false,
    loan_progress = null,
    loan_eligibility = null,
    profileCompleted = true,
    loan_notifications = [],
}: DashboardProps) {
    const [coMakerCount, setCoMakerCount] = useState(comakerRequestCount);
    const [coMakerLoans, setCoMakerLoans] = useState<CoMakerLoan[]>([]);
    const [coMakerLoading, setCoMakerLoading] = useState(true);
    const [showValues, setShowValues] = useState(true);
    const [showMaxLoanAllowed, setShowMaxLoanAllowed] = useState(true);
    const [showBasicSalary, setShowBasicSalary] = useState(true);
    const [showMaxMonthlyPayment, setShowMaxMonthlyPayment] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const notificationsPerPage = 20;
    const totalPages = Math.ceil(
        loan_notifications.length / notificationsPerPage,
    );
    const startIndex = (currentPage - 1) * notificationsPerPage;
    const endIndex = startIndex + notificationsPerPage;
    const paginatedNotifications = loan_notifications.slice(
        startIndex,
        endIndex,
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [loan_notifications.length]);

    useEffect(() => {
        fetch('/dashboards/Member/CoMaker/Count')
            .then((res) => res.json())
            .then((data) => {
                if (data.count !== undefined) {
                    setCoMakerCount(data.count);
                }
            })
            .catch((err) =>
                console.error('Error fetching co-maker count:', err),
            );
    }, []);

    useEffect(() => {
        setCoMakerLoading(true);
        fetch('/api/loans/co-maker')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data.comaker_loans)) {
                    setCoMakerLoans(data.comaker_loans);
                }
            })
            .catch((err) =>
                console.error('Error fetching co-maker loans:', err),
            )
            .finally(() => setCoMakerLoading(false));
    }, []);

    function toggleAllVisibility() {
        setShowValues((prev) => {
            const next = !prev;
            setShowMaxLoanAllowed(next);
            setShowBasicSalary(next);
            setShowMaxMonthlyPayment(next);
            return next;
        });
    }

    function maskCurrency(value: number | string, visible: boolean): string {
        if (!visible) return 'PHP *****';

        return formatCurrency(value);
    }

    function formatCurrency(amount: number | string): string {
        if (amount === null || amount === undefined || amount === '')
            return 'PHP 0.00';

        const number = typeof amount === 'string' ? Number(amount) : amount;

        if (isNaN(number)) return 'PHP 0.00';

        return `PHP ${number.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return 'N/A';

        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    function getEligibilityBadge() {
        if (!profileCompleted) {
            return (
                <Badge
                    variant="secondary"
                    className="gap-1 text-muted-foreground"
                >
                    <AlertCircle className="size-3" />
                    Profile Incomplete
                </Badge>
            );
        }

        if (loan_eligibility?.has_active_loan) {
            if (loan_eligibility?.active_loans_at_least_half_paid) {
                return (
                    <Badge
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                        <CheckCircle2 className="size-3" />
                        Eligible to Apply
                    </Badge>
                );
            }

            return (
                <Badge
                    variant="secondary"
                    className="gap-1 text-muted-foreground"
                >
                    <Clock className="size-3" />
                    Has Active Loan
                </Badge>
            );
        }

        return (
            <Badge
                variant="outline"
                className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
            >
                <CheckCircle2 className="size-3" />
                Eligible to Apply
            </Badge>
        );
    }

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

    function getCoMakerLoanStatusBadge(status: string) {
        if (status === 'paid_off') {
            return (
                <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-blue-700"
                >
                    <CheckCircle2 className="size-3" />
                    Paid off
                </Badge>
            );
        }

        if (status === 'released' || status === 'approved') {
            return (
                <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                    <CheckCircle2 className="size-3" />
                    Active
                </Badge>
            );
        }

        if (rejectedStatuses.includes(status)) {
            return <Badge variant="destructive">Rejected</Badge>;
        }

        if (pendingStatuses.includes(status) || status === 'awaiting_comaker') {
            return (
                <Badge
                    variant="secondary"
                    className="gap-1 text-amber-700"
                >
                    <Clock className="size-3" />
                    Pending
                </Badge>
            );
        }

        return (
            <Badge variant="outline">{status.replaceAll('_', ' ')}</Badge>
        );
    }

    const progressPercentage =
        loan_progress && loan_progress.total_months > 0
            ? Math.round(
                  (loan_progress.paid_months / loan_progress.total_months) *
                      100,
              )
            : 0;
    const canApply =
        Boolean(loan_eligibility) &&
        profileCompleted &&
        (loan_eligibility?.max_loan_allowed ?? 0) > 0 &&
        (!loan_eligibility?.has_active_loan ||
            loan_eligibility?.active_loans_at_least_half_paid);

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Member Dashboard" />

            <div className="flex flex-1 flex-col bg-muted/20 px-4 py-6 sm:px-6">
                <main className="mx-auto flex w-full max-w-7xl flex-col gap-4">
                    <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-emerald-700">
                                Overview
                            </p>
                           
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleAllVisibility}
                        >
                            {showValues ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                            {showValues ? 'Hide amounts' : 'Show amounts'}
                        </Button>
                    </section>

                    <section className="space-y-3">
                        {coMakerCount > 0 && (
                            <Alert className="rounded-2xl border-orange-200 bg-orange-50 text-orange-950 shadow-sm">
                                <Bell className="size-4" />
                                <AlertTitle>
                                    Pending co-maker request
                                    {coMakerCount > 1 ? 's' : ''}
                                </AlertTitle>
                                <AlertDescription className="flex flex-col gap-3 text-orange-800 sm:flex-row sm:items-center sm:justify-between">
                                    <span>
                                        You have {coMakerCount} request
                                        {coMakerCount > 1 ? 's' : ''} waiting
                                        for your review.
                                    </span>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="w-full bg-white sm:w-auto"
                                    >
                                        <Link href="/dashboards/Member/CoMaker">
                                            View Requests
                                        </Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        {has_pending_loan && (
                            <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-950 shadow-sm">
                                <Clock className="size-4" />
                                <AlertTitle>
                                    Loan application under review
                                </AlertTitle>
                                <AlertDescription className="flex flex-col gap-3 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                                    <span>
                                        Your pending application is available
                                        for status review.
                                    </span>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="w-full bg-white sm:w-auto"
                                    >
                                        <Link href="/dashboards/Member/PendingApplication">
                                            View Application
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        {!profileCompleted && (
                            <Alert className="rounded-2xl border-muted bg-background shadow-sm">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Complete your profile</AlertTitle>
                                <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <span>
                                        Finish your required profile details
                                        before applying for a loan.
                                    </span>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                    >
                                        <Link href="/dashboards/Member/UserProfile">
                                            Complete Profile
                                        </Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}
                    </section>

                    {loan_eligibility ? (
                        <Card className="rounded-2xl border-emerald-100 bg-white/80 shadow-sm dark:bg-emerald-950/10">
                            <CardHeader className="gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">
                                        Loan Eligibility
                                    </CardTitle>
                                    <CardDescription>
                                        Your current limits based on your
                                        profile and account standing.
                                    </CardDescription>
                                </div>
                                {getEligibilityBadge()}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <MetricItem
                                        icon={Wallet}
                                        label="Max Loan Allowed"
                                        value={maskCurrency(
                                            loan_eligibility.max_loan_allowed,
                                            showValues && showMaxLoanAllowed,
                                        )}
                                        description="Based on share capital"
                                        tone="emerald"
                                        visible={showValues && showMaxLoanAllowed}
                                        onToggleVisibility={() =>
                                            setShowMaxLoanAllowed((prev) => !prev)
                                        }
                                    />
                                    <MetricItem
                                        icon={CreditCard}
                                        label="Basic Salary"
                                        value={maskCurrency(
                                            loan_eligibility.basic_salary,
                                            showValues && showBasicSalary,
                                        )}
                                        description="Monthly income"
                                        tone="blue"
                                        visible={showValues && showBasicSalary}
                                        onToggleVisibility={() =>
                                            setShowBasicSalary((prev) => !prev)
                                        }
                                    />
                                    <MetricItem
                                        icon={HandCoins}
                                        label="Max Monthly Payment"
                                        value={maskCurrency(
                                            loan_eligibility.max_monthly_payment,
                                            showValues && showMaxMonthlyPayment,
                                        )}
                                        description="Payment capacity"
                                        tone="green"
                                        visible={showValues && showMaxMonthlyPayment}
                                        onToggleVisibility={() =>
                                            setShowMaxMonthlyPayment((prev) => !prev)
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Current Eligibility Status
                                        </p>
                                        <p className="text-base font-medium text-emerald-900 dark:text-emerald-100">
                                            {canApply
                                                ? 'You can start a loan application.'
                                                : !profileCompleted
                                                  ? 'Your profile must be completed first.'
                                                  : loan_eligibility?.has_active_loan &&
                                                      !loan_eligibility?.active_loans_at_least_half_paid
                                                    ? 'Active loans must be at least 50% paid before applying.'
                                                    : 'Loan application is currently unavailable.'}
                                        </p>
                                    </div>
                                    {canApply ? (
                                        <Button
                                            asChild
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
                                        >
                                            <Link href="/dashboards/Member/ApplyLoan">
                                                <FileText className="size-4" />
                                                Apply for Loan
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button
                                            disabled
                                            className="w-full sm:w-auto"
                                        >
                                            <FileText className="size-4" />
                                            Apply for Loan
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <EmptyCard
                            icon={Wallet}
                            title="Loan eligibility unavailable"
                            description="Eligibility details will appear here once your account information is ready."
                        />
                    )}

                    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {loan_progress ? (
                            <Card className="rounded-2xl border-emerald-100 bg-white/80 shadow-sm dark:bg-emerald-950/10">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">
                                                Loan Progress
                                            </CardTitle>
                                            <CardDescription>
                                                Payment status for your active
                                                loan.
                                            </CardDescription>
                                        </div>
                                        <Badge
                                            variant={
                                                loan_progress.payment_status ===
                                                'paid'
                                                    ? 'outline'
                                                    : 'secondary'
                                            }
                                        >
                                            {loan_progress.payment_status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <InfoBlock
                                            label="Loan Type"
                                            value={loan_progress.loan_type}
                                            tone="emerald"
                                        />
                                        <InfoBlock
                                            label="Total Amount"
                                            value={formatCurrency(
                                                loan_progress.total_amount,
                                            )}
                                            align="right"
                                            tone="blue"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-4 text-sm">
                                            <span className="text-muted-foreground">
                                                Paid months
                                            </span>
                                            <span className="font-medium text-emerald-700">
                                                {loan_progress.paid_months} /{' '}
                                                {loan_progress.total_months}
                                            </span>
                                        </div>
                                        <progress
                                            className="h-2 w-full overflow-hidden rounded-full accent-emerald-600"
                                            max={100}
                                            value={progressPercentage}
                                        />
                                        <p className="text-right text-sm font-medium text-emerald-700">
                                            {progressPercentage}% complete
                                        </p>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <InfoBlock
                                            label="Remaining Balance"
                                            value={maskCurrency(
                                                loan_progress.remaining_balance,
                                                showValues,
                                            )}
                                            tone="red"
                                        />
                                        <InfoBlock
                                            label="Next Due"
                                            value={formatDate(
                                                loan_progress.next_due_date,
                                            )}
                                            description={maskCurrency(
                                                loan_progress.next_due_amount,
                                                showValues,
                                            )}
                                            tone="amber"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <EmptyCard
                                icon={HandCoins}
                                title="No active loan"
                                description="Active loan progress will appear here when you have an ongoing loan."
                            />
                        )}

                        <Card className="rounded-2xl border-emerald-100 bg-white/80 shadow-sm dark:bg-emerald-950/10">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">
                                    Account Summary
                                </CardTitle>
                                <CardDescription>
                                    A quick view of your balances and loan
                                    activity.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <InfoBlock
                                        label="Loan Balance"
                                        value={maskCurrency(loan_balance, showValues)}
                                        icon={Wallet}
                                        tone="red"
                                    />
                                    <InfoBlock
                                        label="Share Capital"
                                        value={maskCurrency(
                                            share_capital_balance,
                                            showValues,
                                        )}
                                        icon={CreditCard}
                                        tone="emerald"
                                    />
                                    <InfoBlock
                                        label="Active Loans"
                                        value={active_loan_count.toString()}
                                        tone="blue"
                                    />
                                    <InfoBlock
                                        label="Completed Loans"
                                        value={completed_loan_count.toString()}
                                        tone="green"
                                    />
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                                        Quick Actions
                                    </p>
                                    <ActionLink
                                        href="/dashboards/Member/PendingApplication"
                                        icon={
                                            has_pending_loan
                                                ? Clock
                                                : CheckCircle2
                                        }
                                        label="View Pending Application"
                                        description={
                                            has_pending_loan
                                                ? 'Under review'
                                                : 'Check application status'
                                        }
                                    />
                                    {loan_progress &&
                                        loan_progress.payment_status !==
                                            'paid' && (
                                            <ActionLink
                                                href="/dashboards/Member/MemberActiveLoan"
                                                icon={FileText}
                                                label="View Active Loan Details"
                                                description="Review payment schedule and balance"
                                            />
                                        )}
                                </div>

                                {loan_progress &&
                                    loan_progress.payment_status !== 'paid' && (
                                        <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-950">
                                            <Calendar className="size-4" />
                                            <AlertTitle>
                                                Next payment reminder
                                            </AlertTitle>
                                            <AlertDescription>
                                                Due{' '}
                                                {formatDate(
                                                    loan_progress.next_due_date,
                                                )}{' '}
                                             for{' '}
                                             {maskCurrency(
                                                 loan_progress.next_due_amount,
                                                 showValues,
                                             )}
                                             .
                                            </AlertDescription>
                                        </Alert>
                                    )}
                            </CardContent>
                        </Card>
                    </section>

                    <Card className="rounded-2xl border-emerald-100 bg-white/80 shadow-sm dark:bg-emerald-950/10">
                        <CardHeader className="gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">
                                    Co-Maker Loans
                                </CardTitle>
                                <CardDescription>
                                    Loans you have co-signed, with borrower
                                    details and current status.
                                </CardDescription>
                            </div>
                            {!coMakerLoading && (
                                <Badge variant="secondary">
                                    {coMakerLoans.length} total
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {coMakerLoading ? (
                                <div className="flex items-center justify-center gap-3 rounded-2xl bg-muted/30 px-4 py-10 text-muted-foreground">
                                    <Loader2 className="size-5 animate-spin" />
                                    <span>Loading co-maker loans…</span>
                                </div>
                            ) : coMakerLoans.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {coMakerLoans.map((loan) => (
                                        <div
                                            key={loan.loan_id}
                                            className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                                        <UserCheck className="size-4 text-emerald-700" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                                                            {loan.borrower.name}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            Member ID:{' '}
                                                            {loan.borrower.member_id}
                                                        </p>
                                                    </div>
                                                </div>
                                                {getCoMakerLoanStatusBadge(
                                                    loan.status,
                                                )}
                                            </div>

                                            <Separator className="my-4" />

                                            <div className="grid grid-cols-2 gap-3">
                                                <InfoBlock
                                                    label="Loan Type"
                                                    value={loan.loan_type}
                                                    tone="emerald"
                                                />
                                                <InfoBlock
                                                    label="Loan ID"
                                                    value={`#${loan.loan_id}`}
                                                    tone="slate"
                                                    align="right"
                                                />
                                                <InfoBlock
                                                    label="Principal"
                                                    value={maskCurrency(
                                                        loan.principal_amount,
                                                        showValues,
                                                    )}
                                                    tone="blue"
                                                />
                                                <InfoBlock
                                                    label="Remaining"
                                                    value={maskCurrency(
                                                        loan.remaining_balance,
                                                        showValues,
                                                    )}
                                                    tone="red"
                                                    align="right"
                                                />
                                                <InfoBlock
                                                    label="Monthly Payment"
                                                    value={maskCurrency(
                                                        loan.monthly_payment,
                                                        showValues,
                                                    )}
                                                    tone="green"
                                                />
                                                <InfoBlock
                                                    label="Next Due"
                                                    value={formatDate(
                                                        loan.next_due_date,
                                                    )}
                                                    description={maskCurrency(
                                                        loan.next_due_amount,
                                                        showValues,
                                                    )}
                                                    tone="amber"
                                                    align="right"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/30 px-4 py-10 text-center">
                                    <Users className="mb-3 size-10 text-muted-foreground/60" />
                                    <p className="text-base font-medium">
                                        No co-maker loans
                                    </p>
                                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                        You are not currently listed as a
                                        co-maker for any active loans.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-emerald-100 bg-white/80 shadow-sm dark:bg-emerald-950/10">
                        <CardHeader className="gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">
                                    Loan Notifications
                                </CardTitle>
                                <CardDescription>
                                    Recent updates on your loan applications.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary">
                                {loan_notifications.length} total
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loan_notifications.length > 0 ? (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-emerald-700">
                                                    Date & Time
                                                </TableHead>
                                                <TableHead className="text-emerald-700">
                                                    Admin
                                                </TableHead>
                                                <TableHead className="text-emerald-700">
                                                    Loan Type
                                                </TableHead>
                                                <TableHead className="text-emerald-700">
                                                    Status
                                                </TableHead>
                                                <TableHead className="text-emerald-700">
                                                    Message
                                                </TableHead>
                                                <TableHead className="text-emerald-700">
                                                    Reason
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedNotifications.map(
                                                (notification) => (
                                                    <TableRow
                                                        key={notification.id}
                                                        className={notification.target_url ? 'cursor-pointer hover:bg-muted/50' : undefined}
                                                        onClick={() => {
                                                            if (notification.target_url) {
                                                                router.visit(notification.target_url);
                                                            }
                                                        }}
                                                    >
                                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                                            {formatDate(
                                                                notification.date,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {notification.from}
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                notification.loan_type
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {getNotificationBadge(
                                                                notification.status,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="max-w-md min-w-56 font-medium whitespace-normal">
                                                            {
                                                                notification.description
                                                            }
                                                        </TableCell>
                                                        <TableCell className="max-w-xs min-w-48 whitespace-normal text-muted-foreground">
                                                            {notification.comment ||
                                                                'No additional comments'}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>

                                    <DataTablePagination
                                        currentPage={currentPage}
                                        pageSize={notificationsPerPage}
                                        totalPages={totalPages}
                                        totalRows={loan_notifications.length}
                                        onFirstPage={() => setCurrentPage(1)}
                                        onPreviousPage={() =>
                                            setCurrentPage((prev) =>
                                                Math.max(prev - 1, 1),
                                            )
                                        }
                                        onNextPage={() =>
                                            setCurrentPage((prev) =>
                                                Math.min(prev + 1, totalPages),
                                            )
                                        }
                                        onLastPage={() =>
                                            setCurrentPage(totalPages)
                                        }
                                    />
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/30 px-4 py-10 text-center">
                                    <Bell className="mb-3 size-10 text-muted-foreground/60" />
                                    <p className="text-base font-medium">
                                        No loan notifications yet
                                    </p>
                                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                        Updates about approvals, releases, or
                                        returned applications will appear here.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </AppLayout>
    );
}

function MetricItem({
    icon: Icon,
    label,
    value,
    description,
    tone = 'emerald',
    visible,
    onToggleVisibility,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    description: string;
    tone?: Tone;
    visible?: boolean;
    onToggleVisibility?: () => void;
}) {
    const colors = getToneClasses(tone);

    return (
        <div className={cn('rounded-2xl border p-4', colors.surface)}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className={cn('text-sm font-medium', colors.label)}>
                    {label}
                </p>
                <Icon className={cn('size-4', colors.icon)} />
            </div>
            <div className="flex items-center justify-between gap-3">
                <p className={cn('text-base font-semibold', colors.value)}>
                    {value}
                </p>
                {onToggleVisibility && (
                    <button
                        type="button"
                        onClick={onToggleVisibility}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {visible ? (
                            <EyeOff className="size-4" />
                        ) : (
                            <Eye className="size-4" />
                        )}
                    </button>
                )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function InfoBlock({
    label,
    value,
    description,
    align = 'left',
    icon: Icon,
    tone = 'slate',
}: {
    label: string;
    value: string;
    description?: string;
    align?: 'left' | 'right';
    icon?: React.ElementType;
    tone?: Tone;
}) {
    const colors = getToneClasses(tone);

    return (
        <div
            className={cn(
                'rounded-2xl border p-4',
                colors.surface,
                align === 'right' && 'sm:text-right',
            )}
        >
            <div
                className={cn(
                    'mb-2 flex items-center gap-2',
                    align === 'right' && 'sm:justify-end',
                )}
            >
                {Icon && <Icon className={cn('size-4', colors.icon)} />}
                <p className={cn('text-sm font-medium', colors.label)}>
                    {label}
                </p>
            </div>
            <p
                className={cn(
                    'text-base font-semibold break-words',
                    colors.value,
                )}
            >
                {value}
            </p>
            {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
}

function ActionLink({
    href,
    icon: Icon,
    label,
    description,
}: {
    href: string;
    icon: React.ElementType;
    label: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between gap-4 rounded-2xl p-3 transition-colors hover:bg-emerald-50/70"
        >
            <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Icon className="size-4 text-emerald-700" />
                </span>
                <span className="min-w-0">
                    <span className="block text-sm font-medium text-emerald-950">
                        {label}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                        {description}
                    </span>
                </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-emerald-600" />
        </Link>
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

function EmptyCard({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
}) {
    return (
        <Card className="rounded-2xl border-emerald-100 bg-white/80 shadow-sm dark:bg-emerald-950/10">
            <CardContent className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
                <Icon className="mb-3 size-10 text-emerald-500" />
                <p className="text-base font-semibold text-emerald-950 dark:text-emerald-100">
                    {title}
                </p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

function getToneClasses(tone: Tone) {
    const tones: Record<
        Tone,
        {
            surface: string;
            label: string;
            value: string;
            icon: string;
        }
    > = {
        emerald: {
            surface: 'border-emerald-100 bg-emerald-50/70',
            label: 'text-emerald-700',
            value: 'text-emerald-700',
            icon: 'text-emerald-600',
        },
        blue: {
            surface: 'border-blue-100 bg-blue-50/70',
            label: 'text-blue-700',
            value: 'text-blue-700',
            icon: 'text-blue-600',
        },
        green: {
            surface: 'border-green-100 bg-green-50/70',
            label: 'text-green-700',
            value: 'text-green-700',
            icon: 'text-green-600',
        },
        amber: {
            surface: 'border-amber-100 bg-amber-50/70',
            label: 'text-amber-700',
            value: 'text-amber-700',
            icon: 'text-amber-600',
        },
        red: {
            surface: 'border-red-100 bg-red-50/70',
            label: 'text-red-700',
            value: 'text-red-700',
            icon: 'text-red-600',
        },
        slate: {
            surface: 'border-slate-100 bg-slate-50/70',
            label: 'text-slate-600',
            value: 'text-slate-800',
            icon: 'text-slate-500',
        },
    };

    return tones[tone];
}
