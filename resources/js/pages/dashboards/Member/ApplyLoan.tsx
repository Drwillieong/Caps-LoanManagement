import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import HeadingSmall from '@/components/heading-small';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState, useEffect } from 'react';
import type { ApplyLoanProps, EligibleCoMaker, PreviousLoan, SharedData } from '@/types';
import { Search, User, Calendar, AlertCircle, CheckCircle2, Clock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function ApplyLoan({
    loanTypes,
    memberProfile,
    eligibleCoMakers,
    previousLoans,
    error,
    hasAwaitingComaker,
    editingLoan,
}: ApplyLoanProps) {
    
    const isEditing = !!editingLoan;

    // Show error message if profile is not verified
    if (error) {
        return (
            <AppLayout headerRight={<LiveClock />}>
                <Head title={isEditing ? "Edit Loan" : "Apply Loan"} />
                <div className="space-y-6 px-6">
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

    // Show message if user has a pending application awaiting co-maker confirmation (only when not editing)
    if (hasAwaitingComaker && !isEditing) {
        return (
            <AppLayout headerRight={<LiveClock />}>
                <Head title="Apply Loan" />
                <div className="space-y-6 px-6">
                    <HeadingSmall
                        title="Apply for a Loan"
                        description="Loan application form"
                    />
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                        <h3 className="mb-2 font-semibold text-yellow-800">
                            Pending Application
                        </h3>
                        <p className="mb-4 text-sm text-yellow-700">
                            You have a loan application awaiting co-maker confirmation. 
                            Please wait for the co-maker to respond before applying for a new loan.
                        </p>
                        <Link
                            href="/dashboards/Member/PendingApplication"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white hover:opacity-90 transition"
                        >
                            View Pending Application
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Don't render if memberProfile is not available yet
    if (!memberProfile) {
        return (
            <AppLayout headerRight={<LiveClock />}>
                <Head title={isEditing ? "Edit Loan" : "Apply Loan"} />
                <div className="flex items-center justify-center p-6">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    const { data, setData, post, processing, errors, put } = useForm({
        loan_type_id: editingLoan?.loan_type_id?.toString() || '',
        principal_amount: editingLoan?.principal_amount?.toString() || '',
        terms_months: editingLoan?.terms_months?.toString() || '',
        co_maker_user_id: editingLoan?.co_maker_user_id?.toString() || '',
    });

    // Handle co_maker_id from ChooseComaker page
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const coMakerId = urlParams.get('co_maker_id');
        if (coMakerId && eligibleCoMakers.some(cm => cm.id.toString() === coMakerId)) {
            setData('co_maker_user_id', coMakerId);
        }
    }, [eligibleCoMakers]);

    // toggle for showing applicant info (can be used for future expansion)
    const [showApplicantInfo, setShowApplicantInfo] = useState(false);

    function maskCurrency(value: number | string, visible: boolean) {
    if (!visible) return '₱•••••';

    if (value === null || value === undefined || value === '') {
        return '₱0.00';
    }

    const number = typeof value === 'string'
        ? Number(value.replace(/,/g, ''))
        : value;

    if (isNaN(number)) return '₱0.00';

    return `₱${number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

    // Co-maker search state
    const [coMakerSearch, setCoMakerSearch] = useState('');

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

        const interest =
            (Number(data.principal_amount) *
                (selectedLoanType.interest_rate_per_annum / 100)) *
            (Number(data.terms_months) / 12);

        const total = Number(data.principal_amount) + interest;
        const monthly = total / Number(data.terms_months);

        return {
            interest: interest.toFixed(2),
            total: total.toFixed(2),
            monthly: monthly.toFixed(2),
        };
    }, [data, selectedLoanType]);

    /* ===============================
     *  ELIGIBILITY CHECK (FRONTEND)
     * =============================== */
    const maxLoanAllowed = memberProfile.share_capital_balance * 2;
    const exceedsShareCapital =
        data.principal_amount &&
        Number(data.principal_amount) > maxLoanAllowed;

    // Check if monthly payment exceeds 50% of basic salary
    const maxMonthlyPayment = memberProfile.basic_salary / 2;
    const exceedsMonthlyLimit = computed && Number(computed.monthly) > maxMonthlyPayment;

    // Calculate loan usage percentage
    const loanUsagePercentage = data.principal_amount 
        ? Math.min((Number(data.principal_amount) / maxLoanAllowed) * 100, 100)
        : 0;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEditing && editingLoan) {
            put(`/dashboards/Member/Loan/${editingLoan.id}` as string);
        } else {
            post('/dashboards/Member/ApplyLoan' as string);
        }
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

    // Get status badge variant
    function getStatusBadge(status: string) {
        switch (status) {
            case 'released':
            case 'approved':
                return <Badge className="bg-green-500">Active</Badge>;
            case 'paid_off':
                return <Badge className="bg-blue-500">Paid Off</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    }
    // Auto-format Loan Amount input with commas and 2 decimals while typing
    function formatNumberWithCommas(value: string | number) {
        if (!value) return '';
        return Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    }

    function stripCommas(value: string) {
        return value.replace(/,/g, '');
    }

    return (
        <AppLayout headerRight={<LiveClock />}>
            <Head title={isEditing ? "Edit Loan Application" : "Apply Loan"} />

            <div className="space-y-6 px-6 py-6">
                <div className="flex items-center justify-between">
                    <HeadingSmall
                        title={isEditing ? "Edit Loan Application" : "Apply for a Loan"}
                        description={isEditing ? "Update your loan details" : "Fill in the loan details. Eligibility is checked automatically."}
                    />
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
                <Card className="border-l-4 border-l-blue-500 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                            Eligibility Check
                        </CardTitle>
                        <CardDescription>
                            Real-time verification of your loan application
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Main eligibility status */}
                            <div className={`flex items-center gap-3 rounded-lg p-4 ${
                                exceedsShareCapital || exceedsMonthlyLimit
                                    ? 'bg-red-50 border border-red-200' 
                                    : 'bg-green-50 border border-green-200'
                            }`}>
                                {exceedsShareCapital || exceedsMonthlyLimit ? (
                                    <>
                                        <AlertCircle className="h-6 w-6 text-red-500" />
                                        <div>
                                            <p className="font-semibold text-red-700">
                                                {exceedsShareCapital 
                                                    ? 'Loan amount exceeds allowed limit' 
                                                    : 'Monthly payment exceeds 50% of basic salary'}
                                            </p>
                                            <p className="text-sm text-red-600">
                                                {exceedsShareCapital 
                                                    ? `Maximum allowed: ₱${formatNumberWithCommas(maxLoanAllowed)}`
                                                    : `Maximum monthly: ₱${formatNumberWithCommas(maxMonthlyPayment)} (50% of ₱${formatNumberWithCommas(memberProfile.basic_salary)})`}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                        <div>
                                            <p className="font-semibold text-green-700">
                                                ✅ Loan amount within allowed limit
                                            </p>
                                            <p className="text-sm text-green-600">
                                                You can apply up to {maskCurrency(maxLoanAllowed, showApplicantInfo)}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Progress bar when entering amount */}
                            {data.principal_amount && Number(data.principal_amount) > 0 && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Loan Usage</span>
                                        <span className="font-medium">
                                            {maskCurrency(data.principal_amount, showApplicantInfo)} 
                                            &nbsp;/&nbsp;
                                            {maskCurrency(maxLoanAllowed, showApplicantInfo)}
                                        </span>
                                    </div>
                                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                                        <div 
                                            className={`h-full transition-all duration-300 ${
                                                exceedsShareCapital ? 'bg-red-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${loanUsagePercentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Computation summary */}
                            {computed && (
                                <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-4">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Interest</p>
                                        <p className="font-semibold">
                                            ₱{formatNumberWithCommas(computed.interest)}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Monthly</p>
                                        <p className="font-semibold">
                                            ₱{formatNumberWithCommas(computed.monthly)}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Total Payable</p>
                                        <p className="font-semibold">
                                            ₱{formatNumberWithCommas(computed.total)}
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
                    <Card className="border-l-4 border-l-amber-500 shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="h-5 w-5 text-amber-500" />
                                Previous Loan: Balance as of Today
                            </CardTitle>
                            <CardDescription>
                                Your existing loan(s) and payment status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {previousLoans.map((loan: PreviousLoan) => (
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
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                <span>
                                                    Principal: {formatCurrency(loan.principal_amount)}
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
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base">
                                Applicant Information
                            </CardTitle>

                            {/* Show / Hide Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowApplicantInfo(!showApplicantInfo)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {showApplicantInfo ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-lg bg-muted p-3">
                                    <p className="text-xs text-gray-500">Basic Salary</p>
                                    <p className="font-semibold text-lg">
                                        {maskCurrency(memberProfile.basic_salary, showApplicantInfo)}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-muted p-3">
                                    <p className="text-xs text-gray-500">Share Capital</p>
                                    <p className="font-semibold text-lg">
                                        {maskCurrency(memberProfile.share_capital_balance, showApplicantInfo)}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-muted p-3">
                                    <p className="text-xs text-gray-500">Max Loan Allowed</p>
                                    <p className="font-semibold text-lg text-blue-600">
                                        {maskCurrency(maxLoanAllowed, showApplicantInfo)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* =========================================
                        LOAN DETAILS CARD
                    ========================================= */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Loan Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Loan Type</Label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={data.loan_type_id}
                                        onChange={(e) =>
                                            setData('loan_type_id', e.target.value)
                                        }
                                    >
                                        <option value="">Select loan type</option>
                                        {loanTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name} ({type.interest_rate_per_annum}% p.a.)
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.loan_type_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Loan Amount (₱)</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Enter amount"
                                        value={formatNumberWithCommas(data.principal_amount)}
                                        onChange={(e) => {
                                            // Remove commas from input value
                                            const rawValue = e.target.value.replace(/,/g, '');
                                            
                                            // Allow empty, numbers with optional decimal
                                            if (rawValue !== '' && !/^\d*\.?\d*$/.test(rawValue)) return;
                                            
                                            // Don't allow leading zeros like 00, 01 etc (except for decimals like 0.5)
                                            if (/^0\d/.test(rawValue)) return;

                                            setData('principal_amount', rawValue);
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Term (Months)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Enter term"
                                        value={data.terms_months}
                                        onChange={(e) =>
                                            setData('terms_months', e.target.value)
                                        }
                                    />
                                    <InputError message={errors.terms_months} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                  {/* =========================================
                    CO-MAKER SELECTION WITH SEARCH
                    ========================================= */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <User className="h-4 w-4" />
                                Select Co-Maker
                            </CardTitle>
                            <CardDescription>
                                Search by name, user ID, or email address
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-4">
                                {/* Search input */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search co-maker by name, ID, or email..."
                                        className="pl-10"
                                        value={coMakerSearch}
                                        onChange={(e) => setCoMakerSearch(e.target.value)}
                                    />
                                </div>

                                {/* Co-maker dropdown */}
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={data.co_maker_user_id}
                                    onChange={(e) =>
                                        setData('co_maker_user_id', e.target.value)
                                    }
                                >
                                    <option value="">
                                        {filteredCoMakers.length > 0
                                            ? `Select co-maker (${filteredCoMakers.length} available)`
                                            : 'No matching co-makers found'}
                                    </option>

                                    {filteredCoMakers.map((coMaker: EligibleCoMaker) => (
                                        <option key={coMaker.id} value={coMaker.id}>
                                            {coMaker.name} ({coMaker.email})
                                        </option>
                                    ))}
                                </select>

                                <InputError message={errors.co_maker_user_id} />

                                {/* Optional hint */}
                                {!data.loan_type_id && (
                                    <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                                        ⚠ Please select a loan type to confirm if a co-maker is required.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* =========================================
                        SUBMIT BUTTON
                    ========================================= */}
                    <div className="flex justify-end gap-4">
                        {isEditing && (
                            <Link
                                href="/dashboards/Member/PendingApplication"
                                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted transition"
                            >
                                Cancel
                            </Link>
                        )}
                        <Button
                            size="lg"
                            disabled={Boolean(processing) || Boolean(exceedsShareCapital) || Boolean(exceedsMonthlyLimit)}
                            className="min-w-[200px]"
                        >
                            {processing 
                                ? (isEditing ? 'Updating...' : 'Submitting...') 
                                : (isEditing ? 'Update Loan Application' : 'Submit Loan Application')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
