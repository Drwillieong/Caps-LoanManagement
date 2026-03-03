import { Head, Link, usePage } from '@inertiajs/react';
import { 
    TrendingUp, 
    Wallet, 
    CreditCard, 
    HandCoins, 
    Clock, 
    CheckCircle2,
    AlertCircle,
    Bell,
    Calendar,
    FileText,
    Eye,
    EyeOff,
    Users,
    ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
}

interface DashboardProps {
    comakerRequestCount?: number;
    share_capital_balance?: number;
    loan_balance?: number;
    active_loan_count?: number;
    completed_loan_count?: number;
    loan_progress?: LoanProgress | null;
    loan_eligibility?: LoanEligibility | null;
}

export default function MemberDashboard({ 
    comakerRequestCount = 0,
    share_capital_balance = 0,
    loan_balance = 0,
    active_loan_count = 0,
    completed_loan_count = 0,
    loan_progress = null,
    loan_eligibility = null,
}: DashboardProps) {
    const [coMakerCount, setCoMakerCount] = useState(comakerRequestCount);
    const [showValues, setShowValues] = useState(true);

    // Fetch co-maker request count on mount
    useEffect(() => {
        fetch('/dashboards/Member/CoMaker/Count')
            .then(res => res.json())
            .then(data => {
                if (data.count !== undefined) {
                    setCoMakerCount(data.count);
                }
            })
            .catch(err => console.error('Error fetching co-maker count:', err));
    }, []);

    // Toggle visibility of confidential values
    function toggleVisibility() {
        setShowValues(!showValues);
    }

    // Mask currency when hidden
    function maskCurrency(value: number | string): string {
        if (!showValues) return '₱•••••';
        return formatCurrency(value);
    }

    // Format currency with commas and 2 decimal places
    function formatCurrency(amount: number | string): string {
        if (amount === null || amount === undefined || amount === '') return '₱0.00';

        const number = typeof amount === 'string' ? Number(amount) : amount;

        if (isNaN(number)) return '₱0.00';

        return `₱${number.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    // Format date for display
    function formatDate(dateStr: string | null): string {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    // Calculate progress percentage
    const progressPercentage = loan_progress 
        ? Math.round((loan_progress.paid_months / loan_progress.total_months) * 100)
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Member Dashboard" />
            
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Welcome Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">Member Dashboard</h1>
                    <p className="text-muted-foreground text-sm">View your loan eligibility, track payments, and manage applications.</p>
                </div>

                {/* === CO-MAKER NOTIFICATION BANNER === */}
                {coMakerCount > 0 && (
                    <Card className="border-l-4 border-l-orange-500 bg-orange-50">
                        <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                                    <Bell className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-orange-800">
                                        You have {coMakerCount} pending co-maker request{coMakerCount > 1 ? 's' : ''}!
                                    </p>
                                    <p className="text-sm text-orange-700">
                                        A member has selected you as their co-maker. Please review and respond.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/dashboards/Member/CoMaker"
                                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 transition"
                            >
                                View Requests
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* === LOAN ELIGIBILITY SECTION - KPI Stats Grid Style === */}
                {loan_eligibility && (
                    <Card className="border-emerald-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-emerald-900 dark:text-emerald-100 text-lg">
                                    Loan Eligibility
                                </CardTitle>
                                <button
                                    type="button"
                                    onClick={() => setShowValues(!showValues)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    {showValues ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* KPI Stats Grid - Same style as GmDashboard */}
                            <div className="grid gap-4 md:grid-cols-3">
                                {/* Max Loan Allowed */}
                                <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Max Loan Allowed</CardTitle>
                                        <Wallet className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-700">
                                            {maskCurrency(loan_eligibility.max_loan_allowed)}
                                        </div>
                                        <p className="text-xs text-emerald-600 font-medium mt-1">
                                            Based on 2x share capital
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Basic Salary */}
                                <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Basic Salary</CardTitle>
                                        <CreditCard className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-700">
                                            {maskCurrency(loan_eligibility.basic_salary)}
                                        </div>
                                        <p className="text-xs text-emerald-600 font-medium mt-1">
                                            Monthly income
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Max Monthly Payment */}
                                <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Max Monthly Payment</CardTitle>
                                        <HandCoins className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-700">
                                            {maskCurrency(loan_eligibility.max_monthly_payment)}
                                        </div>
                                        <p className="text-xs text-emerald-600 font-medium mt-1">
                                            50% of basic salary
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Eligibility Status - Same style as GmDashboard */}
                            <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Current Eligibility Status</span>
                                    </div>
                                    {loan_eligibility.has_active_loan ? (
                                        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-amber-100 text-amber-700">
                                            <AlertCircle className="size-3 mr-1" />
                                            Has Active Loan
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-700">
                                            <CheckCircle2 className="size-3 mr-1" />
                                            Eligible to Apply
                                        </span>
                                    )}
                                </div>

                                {/* Quick Action Link - Only show if eligible */}
                                {!loan_eligibility.has_active_loan && loan_eligibility.max_loan_allowed > 0 && (
                                    <Link
                                        href="/dashboards/Member/ApplyLoan"
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Apply for Loan
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content Area - Grid Layout like GmDashboard */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* === LOAN PROGRESS TRACKER === */}
                    {loan_progress && (
                        <Card className="lg:col-span-4 border-emerald-100">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-emerald-900 dark:text-emerald-100">Loan Progress Tracker</CardTitle>
                                    <CardDescription>Track your active loan payment status.</CardDescription>
                                </div>
                                <HandCoins className="h-5 w-5 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Loan Type */}
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-emerald-600 font-medium">Loan Type</span>
                                            <span className="font-semibold text-emerald-900">{loan_progress.loan_type}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-emerald-600 font-medium">Total Amount</span>
                                            <span className="font-mono font-bold text-emerald-700">{formatCurrency(loan_progress.total_amount)}</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Paid</span>
                                            <span className="font-medium">
                                                {loan_progress.paid_months} / {loan_progress.total_months} months
                                            </span>
                                        </div>
                                        <div className="h-3 w-full overflow-hidden rounded-full bg-emerald-100">
                                            <div 
                                                className="h-full bg-emerald-600 transition-all duration-300"
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>
                                        <p className="text-right text-xs text-muted-foreground">
                                            {progressPercentage}% complete
                                        </p>
                                    </div>

                                    {/* Remaining Balance & Next Due */}
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                                            <p className="text-xs text-red-600 font-medium">Remaining Balance</p>
                                            <p className="font-semibold text-red-700">
                                                {maskCurrency(loan_progress.remaining_balance)}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-amber-600" />
                                                <p className="text-xs text-amber-600 font-medium">Next Due Date</p>
                                            </div>
                                            <p className="font-semibold text-amber-700">
                                                {formatDate(loan_progress.next_due_date)}
                                            </p>
                                            <p className="text-xs text-amber-600">
                                                {maskCurrency(loan_progress.next_due_amount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* === SUMMARY / QUICK ACTIONS === */}
                    <Card className={`${loan_progress ? 'lg:col-span-3' : 'lg:col-span-7'} border-emerald-100`}>
                        <CardHeader>
                            <CardTitle className="text-emerald-900 dark:text-emerald-100">Account Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {/* Loan Statistics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Wallet className="size-4 text-blue-600" />
                                        <p className="text-xs text-blue-600 font-medium">Loan Balance</p>
                                    </div>
                                    <p className="text-xl font-bold text-blue-700">{maskCurrency(loan_balance)}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users className="size-4 text-purple-600" />
                                        <p className="text-xs text-purple-600 font-medium">Share Capital</p>
                                    </div>
                                    <p className="text-xl font-bold text-purple-700">{maskCurrency(share_capital_balance)}</p>
                                </div>
                            </div>

                            {/* Loan Counts */}
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                                    <p className="text-xs text-emerald-600 font-medium">Active Loans</p>
                                    <p className="text-xl font-bold text-emerald-700">{active_loan_count}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <p className="text-xs text-gray-600 font-medium">Completed</p>
                                    <p className="text-xl font-bold text-gray-700">{completed_loan_count}</p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-3">Quick Actions</p>
                                <Link
                                    href="/dashboards/Member/PendingApplication"
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-4 w-4 text-emerald-600" />
                                        <span className="text-sm font-medium">View Pending Application</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-emerald-400" />
                                </Link>
                                
                                {loan_progress && loan_progress.payment_status !== 'paid' && (
                                    <Link
                                        href="/dashboards/Member/MemberActiveLoan"
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-emerald-600" />
                                            <span className="text-sm font-medium">View Active Loan Details</span>
                                       </div>
                                        <ArrowRight className="h-4 w-4 text-emerald-400" />
                                    </Link>
                                )}
                            </div>

                            {/* Next Payment Reminder */}
                            {loan_progress && loan_progress.payment_status !== 'paid' && (
                                <div className={`mt-4 p-4 rounded-xl border ${
                                    loan_progress.payment_status === 'due_soon'
                                        ? 'border-orange-200 bg-orange-50'
                                        : 'border-green-200 bg-green-50'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                            loan_progress.payment_status === 'due_soon'
                                                ? 'bg-orange-100'
                                                : 'bg-green-100'
                                        }`}>
                                            <Calendar className={`h-5 w-5 ${
                                                loan_progress.payment_status === 'due_soon'
                                                    ? 'text-orange-600'
                                                    : 'text-green-600'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                Next Payment Reminder
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Due: {formatDate(loan_progress.next_due_date)} • {maskCurrency(loan_progress.next_due_amount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
