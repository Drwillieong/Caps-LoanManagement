import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import HeadingSmall from '@/components/heading-small';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import InputError from '@/components/input-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useMemo, useState, useEffect } from 'react';
import UserAgreementModal from '@/components/modals/UserAgreementModal';
import type { ApplyLoanProps, EligibleCoMaker, PreviousLoan, SharedData, BreadcrumbItem } from '@/types';
import { toast } from 'react-hot-toast';
import { canSendEmail } from '@/hooks/use-internet-check';

// PreviousLoanWithPercent type now in index.d.ts

import { Search, User, Calendar, AlertCircle, CheckCircle2, Clock, ArrowRight, CheckCircle, EyeOff, Eye,ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
   
    {
        title: 'Apply for a Loan',
        href: '/dashboards/Member/ApplyLoan',
    },
];

export default function ApplyLoan({
    loanTypes,
    memberProfile,
    eligibleCoMakers,
    previousLoans,
    error,
    hasPendingLoan,
    hasAwaitingComaker, // Legacy
    hasActiveLoan,
    rejectedAt,
    editingLoan,
}: ApplyLoanProps) {
    
    const isEditing = !!editingLoan;

    const { data, setData, post, processing, errors, put } = useForm({
        loan_type_id: editingLoan?.loan_type_id?.toString() || '',
        principal_amount: editingLoan?.principal_amount?.toString() || '',
        terms_months: editingLoan?.terms_months?.toString() || '',
        co_maker_user_id: editingLoan?.co_maker_user_id?.toString() || '',
    });

    // UI state
    const [showApplicantInfo, setShowApplicantInfo] = useState(false);
    const [coMakerSearch, setCoMakerSearch] = useState('');
    const [preSelectedCoMaker, setPreSelectedCoMaker] = useState<EligibleCoMaker | null>(null);
    const [isPreSelecting, setIsPreSelecting] = useState(false);
    const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
    const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);

    // Handle co_maker_id from ChooseComaker page
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const coMakerId = urlParams.get('co_maker_id');
        if (coMakerId) {
            const matchingCoMaker = eligibleCoMakers.find(cm => cm.id.toString() === coMakerId);
            if (matchingCoMaker) {
                setData('co_maker_user_id', coMakerId);
                setPreSelectedCoMaker(matchingCoMaker);
                setIsPreSelecting(true);
                console.log(`✅ Co-maker "${matchingCoMaker.name}" has been pre-selected!`);
                // Clear URL param after handling
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    }, [eligibleCoMakers, setData]);

    const LOCKOUT_MS = 3 * 60 * 60 * 1000;

    const isReapplicationLocked = useMemo(() => {
        if (!rejectedAt) return false;
        const rejectedTime = new Date(rejectedAt).getTime();
        if (Number.isNaN(rejectedTime)) return false;
        return Date.now() - rejectedTime < LOCKOUT_MS;
    }, [rejectedAt]);

    const isFormLocked = isReapplicationLocked || (lockoutRemaining !== null && lockoutRemaining > 0);

    // 3-hour reapplication lockout countdown (drives the displayed remaining time)
    useEffect(() => {
        if (!rejectedAt) {
            setLockoutRemaining(null);
            return;
        }

        const checkLockout = () => {
            const rejectedTime = new Date(rejectedAt).getTime();
            const now = Date.now();
            const remaining = LOCKOUT_MS - (now - rejectedTime);
            setLockoutRemaining(remaining > 0 ? remaining : 0);
        };

        checkLockout();
        const interval = setInterval(checkLockout, 1000);
        return () => clearInterval(interval);
    }, [rejectedAt]);

    // Early returns - now after all state initialization
    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
                <Head title={isEditing ? "Edit Loan" : "Apply Loan"} />
                <div className="space-y-8 px-8">
                    <HeadingSmall
                        title={isEditing ? "Edit Loan Application" : "Apply for a Loan"}
                        description="Loan application form"
                    />
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                        <h3 className="mb-2 font-semibold text-red-800">
                            Profile Not Verified
                        </h3>
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (hasActiveLoan && !isEditing) {
        return (
            <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
                <Head title="Apply Loan" />
                <div className="space-y-6 px-6">
                    <HeadingSmall
                        title="Apply for a Loan"
                        description="Loan application form"
                    />
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                        <h3 className="mb-2 font-semibold text-red-800">
                            Active Loan Eligibility Failed
                        </h3>
                        <p className="mb-4 text-sm text-red-600">
                            You can apply for a new loan if all active loans are at least 75% paid and combined monthly payments (existing + new) do not exceed 50% of salary. Check your loan status below.
                        </p>
                        <Link
                            href="/dashboards/Member/MemberActiveLoan"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white hover:opacity-90 transition"
                        >
                            View Active Loan
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (hasPendingLoan && !isEditing) {
        return (
           <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
    <Head title="Apply Loan" />
    <div className="space-y-6 px-6">
        <HeadingSmall
            title="Loan Application"
            description="Submit a new loan request"
        />

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
            <h3 className="mb-2 font-semibold text-yellow-800">
                Pending Loan Application
            </h3>
            <p className="mb-4 text-sm text-yellow-700">
                You currently have a pending loan application. 
                Kindly wait for it to be processed before submitting a new request.
            </p>

            <Link
                href="/dashboards/Member/PendingApplication"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white transition hover:opacity-90"
            >
                View Application Status
                <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
    </div>
</AppLayout>
        );
    }

    if (isFormLocked) {
        return (
          <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
    <Head title="Apply Loan" />
    <div className="max-w-10xl mx-auto space-y-8 px-6 py-8">
        
        {/* Sleek, professional header */}
        <HeadingSmall
            title="Apply for a Loan"
            description="Manage your financing and applications"
        />
        
        {/* Modern Corporate Locked State Card */}
        <Card className="border-slate-200/80 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-950">
            <div className="p-8 md:p-12 flex flex-col items-center text-center max-w-4xl mx-auto">
                
                {/* Modern Icon Badge */}
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-50/50 dark:bg-amber-950/30 dark:text-amber-500 dark:ring-amber-950/20">
                    <Lock className="h-6 w-6" />
                </div>

                {/* Typography with better visual hierarchy */}
                <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Application Temporarily Locked
                </CardTitle>
                
                <CardDescription className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                    To maintain secure processing, there is a cool-down period following a recently declined loan application. 
                </CardDescription>

                {/* Clean Countdown Box */}
                <div className="mt-8 w-full rounded-2xl bg-slate-50 p-6 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800/60">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Time Remaining until reapplication
                    </span>
                    <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-slate-800 dark:text-slate-200">
                        {formatLockoutTime(lockoutRemaining ?? 0)}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Updates automatically
                    </div>
                </div>

                {/* Helpful, professional corporate notice */}
                <div className="mt-8 flex gap-3 text-left bg-slate-50/60 border border-slate-100 p-4 rounded-xl dark:bg-slate-900/30 dark:border-slate-800">
                    <ShieldAlert className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Need assistance or believe this is an error? You can review our lending criteria guidelines or contact your dedicated account manager for further review.
                    </p>
                </div>

                {/* Action steps so the user isn't stuck on a dead page */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900">
                        <ArrowLeft className="h-4 w-4" />
                        Return to Dashboard
                    </button>
                    <button className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 transition dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
                        View Guidelines
                    </button>
                </div>

            </div>
        </Card>
    </div>
</AppLayout>
        );
    }

    if (!memberProfile) {
        return (
            <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
                <Head title={isEditing ? "Edit Loan" : "Apply Loan"} />
                <div className="flex items-center justify-center p-6">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    // Handle co_maker_id from ChooseComaker page
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const coMakerId = urlParams.get('co_maker_id');
        if (coMakerId) {
            const matchingCoMaker = eligibleCoMakers.find(cm => cm.id.toString() === coMakerId);
            if (matchingCoMaker) {
                setData('co_maker_user_id', coMakerId);
                setPreSelectedCoMaker(matchingCoMaker);
                setIsPreSelecting(true);
                console.log(`✅ Co-maker "${matchingCoMaker.name}" has been pre-selected!`);
                // Clear URL param after handling
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    }, [eligibleCoMakers]);



    // Filter co-makers based on search
    const filteredCoMakers = useMemo(() => {
        if (!coMakerSearch.trim()) return eligibleCoMakers;
        
        const search = coMakerSearch.toLowerCase();
        return eligibleCoMakers.filter(
            (coMaker) =>
                coMaker.name.toLowerCase().includes(search) ||
                coMaker.email.toLowerCase().includes(search) ||
                coMaker.id.toString().includes(search)
        );
    }, [eligibleCoMakers, coMakerSearch]);

    // ===== UNIFIED FORMATTING FUNCTIONS =====
    // Format currency display (safe)
    const formatCurrency = (amount: number | string | null | undefined): string => {
        if (amount == null || amount === '') return '₱0.00';
        const num = typeof amount === 'string' ? parseFloat(amount.toString().replace(/,/g, '')) : Number(amount);
        return isNaN(num) ? '₱0.00' : `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format for input display (no ₱, with commas)
    const formatNumberInput = (value: string): string => {
        const num = parseFloat(value.replace(/,/g, ''));
        return isNaN(num) || num === 0 ? '' : num.toLocaleString('en-US', { maximumFractionDigits: 0 });
    };

    // Parse input to number for computations
    const parseNumber = (value: string): number => {
        const num = parseFloat(value.replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // Mask currency (kept for compatibility with existing display logic)
    const maskCurrency = (amount: number | string | null, visible: boolean): string => {
        if (!visible) return '₱•••••';
        return formatCurrency(amount);
    };

    function formatLockoutTime(ms: number): string {
        if (ms <= 0) return '0h 0m 0s';
        const totalSeconds = Math.ceil(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    // Format date
    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return 'N/A';
        }
    };

    // Status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'released':
            case 'approved':
                return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
            case 'paid_off':
                return <Badge className="bg-blue-500 hover:bg-blue-600">Paid Off</Badge>;
            default:
                return <Badge variant="secondary">{status.replace('_', ' ').toUpperCase()}</Badge>;
        }
    };

    /* ===============================
     *  REAL-TIME COMPUTATIONS
     * =============================== */
    const selectedLoanType = loanTypes.find(
        (type) => type.id === Number(data.loan_type_id)
    );

const computed = useMemo(() => {
        if (!selectedLoanType || !data.principal_amount || !data.terms_months) {
            return null;
        }

        const principal = parseNumber(data.principal_amount);
        const terms = parseNumber(data.terms_months);
        const rate = selectedLoanType.interest_rate_per_annum ?? 0;

        if (principal <= 0 || terms <= 0) return null;

        const interest = (principal * (rate / 100)) * (terms / 12);
        const total = principal + interest;
        const monthly = total / terms;

        return {
            interest: interest.toFixed(2),
            total: total.toFixed(2),
            monthly: monthly.toFixed(2),
        };
    }, [data.principal_amount, data.terms_months, data.loan_type_id, loanTypes]);

    const activeMonthlyTotal = useMemo(() => 
    (previousLoans || [])
        ?.filter((loan) => ['approved', 'released'].includes(loan.status as string))
        ?.reduce((sum, loan) => sum + Number(loan.monthly_amortization || 0), 0) || 0
, [previousLoans]);

    const allActive75Percent = useMemo(() => 
    (previousLoans || [])
        ?.filter((loan) => ['approved', 'released'].includes(loan.status as string))
        ?.every((loan) => (loan.percent_paid || 0) >= 75) || true
, [previousLoans]);

    /* ===============================
     *  ELIGIBILITY CHECK (FRONTEND)
     * =============================== */
    const maxLoanAllowed = (memberProfile.share_capital_balance || 0) * 2;
    const exceedsShareCapital =
        data.principal_amount &&
        Number(data.principal_amount) > maxLoanAllowed;

    // Frontend eligibility checks
    const maxMonthlyPayment = memberProfile.basic_salary / 2;
    const newMonthlyExceedsLimit = computed && Number(computed.monthly) > maxMonthlyPayment;
    const combinedMonthlyExceedsLimit = computed && (Number(computed.monthly) + activeMonthlyTotal) > maxMonthlyPayment;
    const eligibleForActiveLoans = allActive75Percent;

    // Calculate loan usage percentage
    const loanUsagePercentage = data.principal_amount 
        ? Math.min((parseFloat(data.principal_amount.replace(/,/g, '')) / maxLoanAllowed) * 100, 100)
        : 0;

    async function handleLoanSubmission() {
        const isConnected = await canSendEmail();

        if (!isConnected) {
            toast.error('No internet connection. The email notification cannot be sent, but your loan application will still be submitted.');
        }

        if (isEditing && editingLoan) {
            put(`/dashboards/Member/Loan/${editingLoan.id}` as string);
        } else {
            post('/dashboards/Member/ApplyLoan' as string);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (isEditing) {
            void handleLoanSubmission();
            return;
        }

        setIsAgreementModalOpen(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title={isEditing ? "Edit Loan Application" : "Apply Loan"} />

            <div className="space-y-6 px-6 py-6">
                <div className="flex items-center justify-between">
                    {isEditing && (
                        <Link
                            href="/dashboards/Member/PendingApplication"
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted transition"
                        >
                            Back to Pending
                        </Link>
                    )}
                </div>

                {/* =========================================
                    TOP SECTION: ENHANCED ELIGIBILITY CHECK
                ========================================= */}
                <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg text-emerald-900 dark:text-emerald-100">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            Eligibility Check
                        </CardTitle>
                        <CardDescription>
                            Real-time verification of your loan application
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/20 p-4">
                                <p className="text-sm font-medium">Eligibility Check</p>
                                <p className="mt-1 text-sm text-muted-foreground">Real-time verification of your loan application</p>
                            </div>

                            {/* Main eligibility status */}
                            <div
                                className={`flex items-center gap-3 rounded-lg border p-4 ${
                                    exceedsShareCapital || newMonthlyExceedsLimit || combinedMonthlyExceedsLimit || !eligibleForActiveLoans
                                        ? 'bg-destructive/5 border-destructive/15'
                                        : 'bg-emerald-500/5 border-emerald-500/15'
                                }`}
                            >
                                {exceedsShareCapital || newMonthlyExceedsLimit || combinedMonthlyExceedsLimit || !eligibleForActiveLoans ? (
                                    <>
                                        <AlertCircle className="h-6 w-6 text-red-500" />
                                        <div>
                                            {exceedsShareCapital && (
                                                <div className="mb-1">
                                                    <p className="font-semibold text-red-700">Share capital limit exceeded</p>
{formatCurrency(maxLoanAllowed)}
                                                </div>
                                            )}
                                            {combinedMonthlyExceedsLimit && (
                                                <div className="mb-1">
                                                    <p className="font-semibold text-red-700">Combined monthly exceeds 50% salary</p>
                                    <p className="text-sm text-red-600">
                                                        Combined: {formatCurrency(Number(computed?.monthly || 0) + activeMonthlyTotal)} / Max {formatCurrency(maxMonthlyPayment)}
                                                    </p>
                                                </div>
                                            )}
                                            {!eligibleForActiveLoans && (
                                                <div className="mb-1">
                                                    <p className="font-semibold text-red-700">Active loan(s) not 75% paid</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                        <div>
                                            <p className="font-semibold text-emerald-700">
                                                ✅ All checks passed
                                            </p>
                                            <p className="text-sm text-emerald-600">
                                                Active monthly: {formatCurrency(activeMonthlyTotal)} | Max: {formatCurrency(maxMonthlyPayment)}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Progress bar when entering amount */}
                            {data.principal_amount && Number(data.principal_amount) > 0 && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-emerald-600">Loan Usage</span>
                                        <span className="font-medium">
                                            {maskCurrency(data.principal_amount, showApplicantInfo)} 
                                            &nbsp;/&nbsp;
                                            {maskCurrency(maxLoanAllowed, showApplicantInfo)}
                                        </span>
                                    </div>
                                    <div className="h-3 w-full overflow-hidden rounded-full bg-emerald-100">
                                        <div 
                                            className={`h-full transition-all duration-300 ${
                                                exceedsShareCapital ? 'bg-red-500' : 'bg-emerald-600'
                                            }`}
                                            style={{ width: `${loanUsagePercentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Computation summary */}
                            {computed && (
                                <div className="grid grid-cols-3 gap-4 rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                    <div className="text-center">
                                        <p className="text-xs text-emerald-600">Interest</p>
                                        <p className="font-semibold text-emerald-700">
                                            {formatCurrency(computed.interest)}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-emerald-600">Monthly</p>
                                        <p className="font-semibold text-emerald-700">
{formatCurrency(computed.monthly)}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-emerald-600">Total Payable</p>
                                        <p className="font-semibold text-emerald-700">
{formatCurrency(computed.total)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* =========================================
                    PREVIOUS LOANS SECTION (only show when not editing)
                ========================================= */}
                {!isEditing && previousLoans && previousLoans.length > 0 && (
                    <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-emerald-900 dark:text-emerald-100">
                                <Clock className="h-5 w-5 text-emerald-600" />
                                Previous Loan: Balance as of Today
                            </CardTitle>
                            <CardDescription>
                                Your existing loan(s) and payment status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
{(previousLoans as (PreviousLoan & {percent_paid?: number; loan_type_name?: string; balance?: number | string; next_due_date?: string; monthly_amortization?: number | string})[]).map((loan) => (
                                    <div 
                                        key={loan.id}
                                        className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">
                                                    {loan.loan_type_name}
                                                </span>
                                                {getStatusBadge(loan.status)}
                                                {loan.percent_paid !== undefined && (
                                                    <Badge variant={loan.percent_paid >= 75 ? "default" : "destructive"} className="ml-1 text-xs">
                                                        {loan.percent_paid}%
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                <span>
                                        {formatCurrency(loan.principal_amount)}
                                    </span>
                                    <span>
                                        Balance: {formatCurrency(loan.balance)}
                                    </span>
                                                {loan.next_due_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Due: {formatDate(loan.next_due_date)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Monthly</p>
                                    <p className="font-semibold">
                                        {formatCurrency(loan.monthly_amortization)}
                                    </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={submit} className="space-y-6">

                   {/* =========================================
                    APPLICANT INFORMATION CARD
                    ========================================= */}
                    <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">
                                Applicant Information
                            </CardTitle>

                            {/* Show / Hide Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowApplicantInfo(!showApplicantInfo)}
                            disabled={isFormLocked}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {showApplicantInfo ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                                    <p className="text-xs text-emerald-600">Basic Salary</p>
                                    <p className="font-semibold text-lg text-emerald-700">
                                        {maskCurrency(memberProfile.basic_salary, showApplicantInfo)}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                                    <p className="text-xs text-emerald-600">Share Capital</p>
                                    <p className="font-semibold text-lg text-emerald-700">
                                        {maskCurrency(memberProfile.share_capital_balance || 0, showApplicantInfo)}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                                    <p className="text-xs text-emerald-600">Max Loan Allowed</p>
                                    <p className="font-semibold text-lg text-emerald-700">
                                        {maskCurrency(maxLoanAllowed, showApplicantInfo)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* =========================================
                        LOAN DETAILS CARD
                    ========================================= */}
                    <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">Loan Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Loan Type</Label>
                                    <Select value={data.loan_type_id} onValueChange={(value) => setData('loan_type_id', value)} disabled={isFormLocked}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select loan type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {loanTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name} ({type.interest_rate_per_annum}% p.a.)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.loan_type_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Loan Amount (₱)</Label>
 <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={formatNumberInput(data.principal_amount || '')}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/,/g, '');
                                            if (rawValue === '' || /^\d*\.?\d{0,2}$/.test(rawValue)) {
                                                setData('principal_amount', rawValue);
                                            }
                                        }}
                                        disabled={isFormLocked}
                                    />
                                    <InputError message={errors.principal_amount} />
                                </div>

                              <div className="space-y-2">
  <Label>Term (Months)</Label>

  <Select
    value={data.terms_months}
    onValueChange={(value) => setData("terms_months", value)}
    disabled={isFormLocked}
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select term" />
    </SelectTrigger>

    <SelectContent className="max-h-48 overflow-y-auto">
      {[...Array(24)].map((_, i) => (
        <SelectItem key={i + 1} value={(i + 1).toString()}>
          {i + 1} {i + 1 === 1 ? "Month" : "Months"}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <InputError message={errors.terms_months} />
</div>
                            </div>
                        </CardContent>
                    </Card>

                  {/* =========================================
                    CO-MAKER SELECTION WITH SEARCH
                    ========================================= */}
                    <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base text-emerald-900 dark:text-emerald-100">
                                <User className="h-4 w-4 text-emerald-600" />
                                Select Co-Maker
                            </CardTitle>
                            <CardDescription>
                                Search by name, user ID, or email address. Members with active co-maker loans are excluded.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-4">
                                {/* Search input */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                                    <Input
                                        type="text"
                                        placeholder="Search co-maker by name, ID, or email..."
                                        className="pl-10"
                                        value={coMakerSearch}
                                        onChange={(e) => setCoMakerSearch(e.target.value)}
                                        disabled={isPreSelecting || isFormLocked}
                                    />
                                </div>

                                {/* Co-maker dropdown */}
                                <Select value={data.co_maker_user_id} onValueChange={(value) => setData('co_maker_user_id', value)} disabled={isFormLocked}>
                                    <SelectTrigger className="w-full">
                                        {isPreSelecting && preSelectedCoMaker ? (
                                            <div className="flex items-center gap-2 p-2">
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                <span>{preSelectedCoMaker.name} ({preSelectedCoMaker.email})</span>
                                            </div>
                                        ) : (
                                            <SelectValue placeholder={filteredCoMakers.length > 0 ? `Select co-maker (${filteredCoMakers.length} available)` : 'No matching co-makers found'} />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredCoMakers.map((coMaker: EligibleCoMaker) => (
                                            <SelectItem key={coMaker.id} value={coMaker.id.toString()}>
                                                {coMaker.name} ({coMaker.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.co_maker_user_id} />

                                {/* Optional hint */}
                                {!data.loan_type_id && (
                                    <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
                                        ⚠ Please select a loan type to confirm if a co-maker is required.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* =========================================
                        PRE-SELECTED CO-MAKER SUMMARY (Visible when coming from ChooseComaker)
                    ========================================= */}
                    {isPreSelecting && preSelectedCoMaker && (
                        <Card className="border-emerald-200 bg-emerald-50 shadow-md">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-100 border border-emerald-200">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white font-bold">
                                        {preSelectedCoMaker.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-emerald-900 text-lg">{preSelectedCoMaker.name}</p>
                                        <p className="text-emerald-700">{preSelectedCoMaker.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                                            <span className="text-sm text-emerald-700 font-medium">Pre-selected from Choose Co-maker page</span>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setData('co_maker_user_id', '');
                                            setPreSelectedCoMaker(null);
                                            setIsPreSelecting(false);
                                            setCoMakerSearch('');
                                        }}
                                        disabled={isFormLocked}
                                    >
                                        Change
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* =========================================
                        SUBMIT BUTTON
                    ========================================= */}
                    <div className="flex justify-end gap-4">
                        {isEditing && (
                            <Link
                                href="/dashboards/Member/PendingApplication"
                                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                                aria-disabled={isFormLocked}
                            >
                                Cancel
                            </Link>
                        )}
                        <Button
                            size="lg"
                            disabled={processing || isFormLocked || exceedsShareCapital || newMonthlyExceedsLimit || combinedMonthlyExceedsLimit || !eligibleForActiveLoans}
                            title={processing ? 'Processing...' : isFormLocked ? 'Reapplication locked' : exceedsShareCapital ? 'Exceeds share capital limit' : newMonthlyExceedsLimit ? 'Monthly exceeds salary limit' : combinedMonthlyExceedsLimit ? 'Combined monthly exceeds limit' : !eligibleForActiveLoans ? 'Active loans not 75% paid' : ''}
                            className="min-w-[200px]"
                        >
                            {processing 
                                ? (isEditing ? 'Updating...' : 'Submitting...') 
                                : (isEditing ? 'Update Loan Application' : 'Submit Loan Application')}
                        </Button>
                    </div>
                </form>

                {!isEditing && (
                    <UserAgreementModal
                        open={isAgreementModalOpen}
                        onOpenChange={setIsAgreementModalOpen}
                        onConfirm={handleLoanSubmission}
                        processing={processing}
                    />
                )}
            </div>
        </AppLayout>
    );
}