import { Head, Link, usePage } from '@inertiajs/react';
import { LiveClock } from '@/components/live-clock';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { FileText, Clock, CheckCircle, HandCoins, Wallet, Users, Bell, Calendar, TrendingUp, CreditCard, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

            <div className="flex flex-col gap-6 p-6">

                {/* === HEADER WITH TOGGLE === */}
                <div className="flex items-center justify-between">
                    {/* === <h1 className="text-2xl font-bold">Member Dashboard</h1> === */}
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


                {/* === LOAN ELIGIBILITY SNAPSHOT === */}
                {loan_eligibility && (
                    <Card className="border-l-4 border-l-green-500 shadow-md">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-green-500" />
                                Loan Eligibility
                            </CardTitle>
                            
                            {/* Show / Hide Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowValues(!showValues)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {showValues ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                {/* Max Loan Allowed */}
                                <div className="rounded-lg bg-green-50 p-4 border border-green-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wallet className="h-4 w-4 text-green-600" />
                                        <p className="text-sm text-green-700">Max Loan Allowed</p>
                                    </div>
                                    <p className="text-2xl font-bold text-green-700">
                                        {maskCurrency(loan_eligibility.max_loan_allowed)}
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                        Based on 2x share capital
                                    </p>
                                </div>

                                {/* Basic Salary */}
                                <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard className="h-4 w-4 text-blue-600" />
                                        <p className="text-sm text-blue-700">Basic Salary</p>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {maskCurrency(loan_eligibility.basic_salary)}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Monthly income
                                    </p>
                                </div>

                                {/* Max Monthly Payment */}
                                <div className="rounded-lg bg-purple-50 p-4 border border-purple-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <HandCoins className="h-4 w-4 text-purple-600" />
                                        <p className="text-sm text-purple-700">Max Monthly Payment</p>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-700">
                                        {maskCurrency(loan_eligibility.max_monthly_payment)}
                                    </p>
                                    <p className="text-xs text-purple-600 mt-1">
                                        50% of basic salary
                                    </p>
                                </div>
                            </div>

                            {/* Eligibility Status */}
                            <div className="mt-4 p-3 rounded-lg bg-muted">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Current Eligibility Status</span>
                                    {loan_eligibility.has_active_loan ? (
                                        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-amber-100 text-amber-700">
                                            ⚠ Has Active Loan
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-700">
                                            ✓ Eligible to Apply
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Quick Action Link */}
                            {!loan_eligibility.has_active_loan && loan_eligibility.max_loan_allowed > 0 && (
                                <Link
                                    href="/dashboards/Member/ApplyLoan"
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition"
                                >
                                    <FileText className="h-4 w-4" />
                                    Apply for Loan
                                </Link>
                                
                                
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* === LOAN PROGRESS TRACKER === */}
                {loan_progress && (
                    <>
                        <Card className="border-l-4 border-l-blue-500 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <HandCoins className="h-5 w-5 text-blue-500" />
                                    Loan Progress Tracker
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Loan Type */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Loan Type</span>
                                        <span className="font-semibold">{loan_progress.loan_type}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Paid</span>
                                            <span className="font-medium">
                                                {loan_progress.paid_months} / {loan_progress.total_months} months
                                            </span>
                                        </div>
                                        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                                            <div 
                                                className="h-full bg-blue-500 transition-all duration-300"
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
                                            <p className="text-xs text-red-600">Remaining Balance</p>
                                            <p className="font-semibold text-red-700">
                                                {maskCurrency(loan_progress.remaining_balance)}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-amber-600" />
                                                <p className="text-xs text-amber-600">Next Due Date</p>
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

                        {/* === NEXT PAYMENT REMINDER CARD === */}
                        {loan_progress.payment_status !== 'paid' && (
                            <Card className={`border-l-4 shadow-md ${
                                loan_progress.payment_status === 'due_soon'
                                    ? 'border-l-orange-500 bg-orange-50'
                                    : 'border-l-green-500 bg-green-50'
                            }`}>
                            <CardContent className="flex items-center justify-between py-4">
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
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                    loan_progress.payment_status === 'due_soon'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-green-100 text-green-700'
                                }`}>
                                    {loan_progress.payment_status === 'due_soon' ? '⏰ Due Soon' : '✓ Upcoming'}
                                </span>
                            </CardContent>
                        </Card>
                        )}
                    </>
                )}

                {/* === QUICK ACTIONS === */}
                <Card className="shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Clock className="h-5 w-5" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/dashboards/Member/PendingApplication"
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted transition"
                        >
                            <Clock className="h-4 w-4" />
                            View Pending Application
                        </Link>
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
