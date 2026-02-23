import { Head, useForm } from '@inertiajs/react';
import { store } from '@/routes/member/loan';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import HeadingSmall from '@/components/heading-small';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState } from 'react';
import type { ApplyLoanProps, EligibleCoMaker, PreviousLoan } from '@/types';
import { Search, User, Calendar, DollarSign, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function ApplyLoan({
    loanTypes,
    memberProfile,
    eligibleCoMakers,
    previousLoans,
    error,
}: ApplyLoanProps) {
    // Show error message if profile is not verified
    if (error) {
        return (
            <AppLayout headerRight={<LiveClock />}>
                <Head title="Apply Loan" />
                <div className="space-y-6 px-6">
                    <HeadingSmall
                        title="Apply for a Loan"
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

    // Don't render if memberProfile is not available yet
    if (!memberProfile) {
        return (
            <AppLayout headerRight={<LiveClock />}>
                <Head title="Apply Loan" />
                <div className="flex items-center justify-center p-6">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    const { data, setData, post, processing, errors } = useForm({
        loan_type_id: '',
        principal_amount: '',
        terms_months: '',
        co_maker_user_id: '',
    });

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

    // Calculate loan usage percentage
    const loanUsagePercentage = data.principal_amount 
        ? Math.min((Number(data.principal_amount) / maxLoanAllowed) * 100, 100)
        : 0;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(store.url() as string);
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

    return (
        <AppLayout headerRight={<LiveClock />}>
            <Head title="Apply Loan" />

            <div className="space-y-6 px-6 py-6">
                <HeadingSmall
                    title="Apply for a Loan"
                    description="Fill in the loan details. Eligibility is checked automatically."
                />

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
                                exceedsShareCapital 
                                    ? 'bg-red-50 border border-red-200' 
                                    : 'bg-green-50 border border-green-200'
                            }`}>
                                {exceedsShareCapital ? (
                                    <>
                                        <AlertCircle className="h-6 w-6 text-red-500" />
                                        <div>
                                            <p className="font-semibold text-red-700">
                                                Loan amount exceeds allowed limit
                                            </p>
                                            <p className="text-sm text-red-600">
                                                Maximum allowed: ₱{maxLoanAllowed.toLocaleString()}
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
                                                You can apply up to ₱{maxLoanAllowed.toLocaleString()}
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
                                            ₱{Number(data.principal_amount).toLocaleString()} / ₱{maxLoanAllowed.toLocaleString()}
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
                                        <p className="font-semibold">₱{computed.interest}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Monthly</p>
                                        <p className="font-semibold">₱{computed.monthly}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Total Payable</p>
                                        <p className="font-semibold">₱{computed.total}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* =========================================
                    PREVIOUS LOANS SECTION
                ========================================= */}
                {previousLoans && previousLoans.length > 0 && (
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
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" />
                                                    Principal: ₱{loan.principal_amount.toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" />
                                                    Balance: ₱{loan.balance.toLocaleString()}
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
                                                ₱{loan.monthly_amortization.toLocaleString()}
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
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Applicant Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-lg bg-muted p-3">
                                    <p className="text-xs text-gray-500">Basic Salary</p>
                                    <p className="font-semibold text-lg">
                                        ₱{memberProfile.basic_salary.toLocaleString()}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-muted p-3">
                                    <p className="text-xs text-gray-500">Share Capital</p>
                                    <p className="font-semibold text-lg">
                                        ₱{memberProfile.share_capital_balance.toLocaleString()}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-muted p-3">
                                    <p className="text-xs text-gray-500">Max Loan Allowed</p>
                                    <p className="font-semibold text-lg text-blue-600">
                                        ₱{maxLoanAllowed.toLocaleString()}
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
                                        type="number"
                                        placeholder="Enter amount"
                                        value={data.principal_amount}
                                        onChange={(e) =>
                                            setData('principal_amount', e.target.value)
                                        }
                                    />
                                    <InputError message={errors.principal_amount} />
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
                    {selectedLoanType?.requires_comaker && (
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

                                    {/* Quick tips */}
                                    <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                                        <p className="font-medium">💡 Tips for selecting a co-maker:</p>
                                        <ul className="mt-1 list-inside list-disc text-xs">
                                            <li>Co-maker must be an active member</li>
                                            <li>Co-maker must not have an active loan</li>
                                            <li>Type to search by name, ID, or email</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* =========================================
                        SUBMIT BUTTON
                    ========================================= */}
                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            disabled={Boolean(processing) || Boolean(exceedsShareCapital)}
                            className="min-w-[200px]"
                        >
                            {processing ? 'Submitting...' : 'Submit Loan Application'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
