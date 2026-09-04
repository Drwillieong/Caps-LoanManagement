import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem, type MemberActiveLoanProps } from '@/types';
import { dashboard } from '@/routes';

import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,

    FileText,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,

    ArrowRight,
    TrendingDown,
    Wallet,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Active Loan',
        href: dashboard().url,
    },
];

const ITEMS_PER_PAGE = 10;

/**
 * Reusable pagination control (shadcn Button-based).
 * Renders numbered pages with ellipses for large ranges, plus
 * Previous / Next controls. Returns null when there's nothing to page.
 */
function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    function getPageNumbers(): (number | 'ellipsis')[] {
        const pages: (number | 'ellipsis')[] = [];
        const delta = 1;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== 'ellipsis') {
                pages.push('ellipsis');
            }
        }
        return pages;
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3">
            <p className="text-xs text-muted-foreground">
                Showing {startItem}-{endItem} of {totalItems}
            </p>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) =>
                        page === 'ellipsis' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">
                                …
                            </span>
                        ) : (
                            <Button
                                key={page}
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                className={cn('h-8 w-8 p-0', currentPage === page && 'bg-emerald-600 hover:bg-emerald-700')}
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </Button>
                        ),
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default function MemberActiveLoan({
    activeLoans,
    hasActiveLoan,
    totalLoanBalance,
    totalAmountPaid,
}: MemberActiveLoanProps) {
    const { url } = usePage();
    const requestedLoanId = Number(
        new URLSearchParams(url.split('?')[1] ?? '').get('loan')
    );
    const defaultExpandedLoan = activeLoans.some((loan) => loan.id === requestedLoanId)
        ? requestedLoanId
        : activeLoans[0]?.id ?? null;

    // Expand/collapse state for amortization and payment tables
    const [expandedLoan, setExpandedLoan] = useState<number | null>(
        defaultExpandedLoan
    );
    const [settlementLoanId, setSettlementLoanId] = useState<number | null>(null);
    const settlementForm = useForm({ confirm: true });
    const [advanceLoanId, setAdvanceLoanId] = useState<number | null>(null);
    const advanceForm = useForm<{
        requested_amount: string;
        payment_method: string;
        expected_payment_date: string;
        reference_number: string;
        payment_proof: File | null;
        remarks: string;
    }>({
        requested_amount: '',
        payment_method: 'cash',
        expected_payment_date: '',
        reference_number: '',
        payment_proof: null,
        remarks: '',
    });

    // Per-loan, per-table pagination state (keyed by loan id)
    const [amortizationPages, setAmortizationPages] = useState<Record<number, number>>({});
    const [paymentPages, setPaymentPages] = useState<Record<number, number>>({});
    const [transactionPages, setTransactionPages] = useState<Record<number, number>>({});

    function setAmortizationPage(loanId: number, page: number) {
        setAmortizationPages((prev) => ({ ...prev, [loanId]: page }));
    }

    function setPaymentPage(loanId: number, page: number) {
        setPaymentPages((prev) => ({ ...prev, [loanId]: page }));
    }

    function setTransactionPage(loanId: number, page: number) {
        setTransactionPages((prev) => ({ ...prev, [loanId]: page }));
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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

    function getStatusConfig(status: string) {
        const map: Record<
            string,
            { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; color: string }
        > = {
            released: { variant: 'default', label: 'Released', color: 'bg-emerald-500' },
            approved: { variant: 'default', label: 'Approved', color: 'bg-blue-500' },
            pending: { variant: 'secondary', label: 'Pending', color: 'bg-yellow-500' },
            paid_off: { variant: 'outline', label: 'Paid Off', color: 'bg-green-500' },
            rejected: { variant: 'destructive', label: 'Rejected', color: 'bg-red-500' },
            paid: { variant: 'default', label: 'Paid', color: 'bg-green-500' },
            pending_status: { variant: 'secondary', label: 'Pending', color: 'bg-yellow-500' },
            partial: { variant: 'secondary', label: 'Partial', color: 'bg-orange-500' },
            overdue: { variant: 'destructive', label: 'Overdue', color: 'bg-red-500' },
            missed: { variant: 'destructive', label: 'Missed', color: 'bg-red-500' },
            deferred: { variant: 'secondary', label: 'Deferred', color: 'bg-slate-500' },
            manual_payment: { variant: 'outline', label: 'Manual Payment', color: 'bg-emerald-500' },
        };

        return (
            map[status] ?? {
                variant: 'outline' as const,
                label: status.replace(/_/g, ' '),
                color: 'bg-gray-500',
            }
        );
    }

    function getPaymentStatusConfig(status: string) {
        const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; color: string }> = {
            current: { variant: 'default', label: 'Current', color: 'bg-green-500' },
            due_soon: { variant: 'secondary', label: 'Due Soon', color: 'bg-orange-500' },
            overdue: { variant: 'destructive', label: 'Overdue', color: 'bg-red-500' },
            paid_off: { variant: 'outline', label: 'Paid Off', color: 'bg-emerald-500' },
        };
        return (
            map[status] ?? {
                variant: 'outline' as const,
                label: status.replace(/_/g, ' '),
                color: 'bg-gray-500',
            }
        );
    }

    function toggleExpand(loanId: number) {
        setExpandedLoan(expandedLoan === loanId ? null : loanId);
    }

    function submitSettlementRequest(loanId: number) {
        settlementForm.post(`/dashboards/Member/active-loans/${loanId}/settlement-request`, {
            preserveScroll: true,
            onSuccess: () => {
                setSettlementLoanId(null);
                settlementForm.reset();
            },
        });
    }

    function openAdvanceRequest(loan: (typeof activeLoans)[number]) {
        setAdvanceLoanId(loan.id);
        advanceForm.setData({
            requested_amount: loan.advance_payment?.regular_deduction_amount
                ? String(loan.advance_payment.regular_deduction_amount)
                : '',
            payment_method: 'cash',
            expected_payment_date: new Date().toISOString().slice(0, 10),
            reference_number: '',
            payment_proof: null,
            remarks: '',
        });
    }

    function submitAdvanceRequest(loanId: number) {
        advanceForm.post(`/dashboards/Member/active-loans/${loanId}/advance-payment-request`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setAdvanceLoanId(null);
                advanceForm.reset();
            },
        });
    }

    // Calculate overall progress
    const totalAmountDue = activeLoans.reduce((sum, loan) => sum + loan.total_amount_due, 0);
    const overallProgress = totalAmountDue > 0 ? Math.round((totalAmountPaid / totalAmountDue) * 100) : 0;

    // If no active loans, show empty state
    if (!hasActiveLoan) {
        return (
            <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
                <Head title="Active Loan" />

                <div className="flex flex-1 flex-col gap-6 p-6">
                    {/* Header */}
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Active Loan</h1>
                        <p className="text-muted-foreground">
                            View your current loan status and payment progress
                        </p>
                    </div>

                    <Separator />

                    {/* Empty State */}
                    <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-full max-w-3xl flex flex-col items-center">
                                <div className="rounded-full bg-emerald-100 p-4 mb-6">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                                </div>

                                <h3 className="text-2xl font-semibold mb-3 text-emerald-900 dark:text-emerald-100">
                                    No Active Loan
                                </h3>

                                <p className="text-muted-foreground max-w-xl mb-10">
                                    You don't have any active loans at the moment. Apply for a loan to get started.
                                </p>

                                <Button
                                    asChild
                                    size="lg"
                                    className="min-w-[300px] h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Link href="/dashboards/Member/ApplyLoan">Apply for Loan</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Active Loan" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Active Loan</h1>
                    <p className="text-muted-foreground">
                        View your current loan status and payment progress
                    </p>
                </div>

                <Separator />

                {/* Overall Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Paid */}
                    <Card className="border-emerald-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                            <div className="h-4 w-4 text-emerald-600">₱</div>

                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(totalAmountPaid)}
                            </div>
                            <p className="text-xs text-muted-foreground">Amount paid so far</p>
                        </CardContent>
                    </Card>

                    {/* Remaining Balance */}
                    <Card className="border-red-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(totalLoanBalance)}
                            </div>
                            <p className="text-xs text-muted-foreground">Outstanding amount</p>
                        </CardContent>
                    </Card>

                    {/* Overall Progress */}
                    <Card className="border-emerald-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{overallProgress}%</div>
                            <div className="mt-2 h-2 w-full rounded-full bg-emerald-100">
                                <div
                                    className="h-2 rounded-full bg-emerald-500 transition-all"
                                    style={{ width: `${overallProgress}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Loans Count */}
                    <Card className="border-emerald-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                            <FileText className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeLoans.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {activeLoans.length === 1 ? 'Loan in progress' : 'Loans in progress'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Loan Cards */}
                <div className="space-y-6">
                    {activeLoans.map((loan) => {
                        const { variant: statusVariant, label: statusLabel } = getStatusConfig(loan.status);
                        const { variant: paymentVariant, label: paymentLabel, color: paymentColor } =
                            getPaymentStatusConfig(loan.payment_status);

                        // Amortization pagination
                        const amortizationPage = amortizationPages[loan.id] ?? 1;
                        const amortizationTotalPages = Math.max(1, Math.ceil(loan.amortizations.length / ITEMS_PER_PAGE));
                        const safeAmortizationPage = Math.min(amortizationPage, amortizationTotalPages);
                        const paginatedAmortizations = loan.amortizations.slice(
                            (safeAmortizationPage - 1) * ITEMS_PER_PAGE,
                            safeAmortizationPage * ITEMS_PER_PAGE,
                        );

                        // Payment history pagination
                        const paymentPage = paymentPages[loan.id] ?? 1;
                        const paymentTotalPages = Math.max(1, Math.ceil((loan.payments?.length ?? 0) / ITEMS_PER_PAGE));
                        const safePaymentPage = Math.min(paymentPage, paymentTotalPages);
                        const paginatedPayments = (loan.payments ?? []).slice(
                            (safePaymentPage - 1) * ITEMS_PER_PAGE,
                            safePaymentPage * ITEMS_PER_PAGE,
                        );

                        // Loan ledger pagination
                        const transactionPage = transactionPages[loan.id] ?? 1;
                        const transactionTotalPages = Math.max(1, Math.ceil((loan.transactions?.length ?? 0) / ITEMS_PER_PAGE));
                        const safeTransactionPage = Math.min(transactionPage, transactionTotalPages);
                        const paginatedTransactions = (loan.transactions ?? []).slice(
                            (safeTransactionPage - 1) * ITEMS_PER_PAGE,
                            safeTransactionPage * ITEMS_PER_PAGE,
                        );

                        return (
                            <Card key={loan.id} className="border-emerald-100 shadow-sm overflow-hidden">
                                {/* Loan Header - Always Visible */}
                                <div
                                    className="p-6 cursor-pointer hover:bg-emerald-50/50 transition-colors"
                                    onClick={() => toggleExpand(loan.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                                                    {loan.loan_type_name}
                                                </h3>
                                                <Badge variant={statusVariant}>{statusLabel}</Badge>
                                                <Badge variant={paymentVariant} className={cn(paymentColor === 'bg-green-500' ? 'bg-green-100 text-green-700' : paymentColor === 'bg-orange-500' ? 'bg-orange-100 text-orange-700' : paymentColor === 'bg-red-500' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')}>
                                                    {paymentLabel}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Loan #{loan.id} • {loan.terms_months} months term
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Progress Circle */}
                                            <div className="relative w-16 h-16">
                                                <svg className="w-16 h-16 transform -rotate-90">
                                                    <circle
                                                        cx="32"
                                                        cy="32"
                                                        r="28"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        fill="none"
                                                        className="text-emerald-100"
                                                    />
                                                    <circle
                                                        cx="32"
                                                        cy="32"
                                                        r="28"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        fill="none"
                                                        className="text-emerald-500"
                                                        strokeDasharray={`${loan.progress_percentage * 1.76} 176`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-emerald-700">
                                                        {loan.progress_percentage}%
                                                    </span>
                                                </div>
                                            </div>

                                            {expandedLoan === loan.id ? (
                                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Stats Row */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Principal Amount</p>
                                            <p className="font-semibold">{formatCurrency(loan.principal_amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Amount Due</p>
                                            <p className="font-semibold">{formatCurrency(loan.total_amount_due)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Monthly Payment</p>
                                            <p className="font-semibold">{formatCurrency(loan.monthly_amortization)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Payments Completed</p>
                                            <p className="font-semibold">
                                                {loan.paid_amortizations} of {loan.total_amortizations}
                                            </p>
                                        </div>
                                    </div>

                                    {loan.advance_payment && (
                                        <div className="mt-4 rounded-md border border-emerald-200 bg-background p-4">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold">Advance Payment</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Regular deduction: <span className="font-semibold text-slate-900">{formatCurrency(loan.advance_payment.regular_deduction_amount)}</span>
                                                    </p>
                                                    {loan.advance_payment.latest_request && (
                                                        <div className="mt-2">
                                                            <Badge variant="outline">
                                                                Request {loan.advance_payment.latest_request.status.replace(/_/g, ' ')}
                                                            </Badge>
                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                {formatCurrency(loan.advance_payment.latest_request.requested_amount)} / {loan.advance_payment.latest_request.installments_covered} installment(s)
                                                            </span>
                                                            {loan.advance_payment.latest_request.rejection_reason && (
                                                                <p className="mt-1 text-xs text-red-600">{loan.advance_payment.latest_request.rejection_reason}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <Dialog open={advanceLoanId === loan.id} onOpenChange={(open) => setAdvanceLoanId(open ? loan.id : null)}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            type="button"
                         className="min-h-[44px] bg-black text-white hover:bg-gray-800 hover:text-white"
                                                            disabled={!loan.advance_payment.is_eligible}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openAdvanceRequest(loan);
                                                            }}
                                                        >
                                                            <Wallet className="h-4 w-4" />
                                                            Request Advance Payment
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Request Advance Payment</DialogTitle>
                                                            <DialogDescription>
                                                                This request pays future scheduled installments after approval and verified payment.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-2">
                                                            <div className="grid gap-3 rounded-md border p-4 text-sm md:grid-cols-2">
                                                                <div><span className="text-muted-foreground">Outstanding Balance</span><p className="font-mono font-semibold">{formatCurrency(loan.advance_payment.outstanding_balance)}</p></div>
                                                                <div><span className="text-muted-foreground">Regular Deduction</span><p className="font-mono font-semibold">{formatCurrency(loan.advance_payment.regular_deduction_amount)}</p></div>
                                                                <div><span className="text-muted-foreground">Next Deduction Date</span><p className="font-semibold">{formatDate(loan.advance_payment.next_due_date)}</p></div>
                                                                <div><span className="text-muted-foreground">Remaining Installments</span><p className="font-semibold">{loan.advance_payment.remaining_installments}</p></div>
                                                            </div>
                                                            <div className="grid gap-3 md:grid-cols-2">
                                                                <div>
                                                                    <Label htmlFor={`advance_amount_${loan.id}`}>Amount to Advance</Label>
                                                                    <Input id={`advance_amount_${loan.id}`} value={advanceForm.data.requested_amount} onChange={(event) => advanceForm.setData('requested_amount', event.target.value)} />
                                                                    {advanceForm.errors.requested_amount && <p className="text-sm text-red-600">{advanceForm.errors.requested_amount}</p>}
                                                                </div>
                                                                <div>
                                                                    <Label>Installments Covered</Label>
                                                                    <div className="flex h-9 items-center rounded-md border px-3 text-sm font-semibold">
                                                                        {loan.advance_payment.regular_deduction_amount > 0
                                                                            ? Math.floor(Number(advanceForm.data.requested_amount || 0) / loan.advance_payment.regular_deduction_amount)
                                                                            : 0}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`advance_method_${loan.id}`}>Payment Method</Label>
                                                                    <select id={`advance_method_${loan.id}`} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs" value={advanceForm.data.payment_method} onChange={(event) => advanceForm.setData('payment_method', event.target.value)}>
                                                                        <option value="cash">Cash</option>
                                                                        <option value="bank_transfer">Bank Transfer</option>
                                                                        <option value="salary_deduction">Salary Deduction</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`advance_date_${loan.id}`}>Payment Date</Label>
                                                                    <Input id={`advance_date_${loan.id}`} type="date" value={advanceForm.data.expected_payment_date} onChange={(event) => advanceForm.setData('expected_payment_date', event.target.value)} />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`advance_ref_${loan.id}`}>Reference Number</Label>
                                                                    <Input id={`advance_ref_${loan.id}`} value={advanceForm.data.reference_number} onChange={(event) => advanceForm.setData('reference_number', event.target.value)} />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`advance_proof_${loan.id}`}>Payment Proof</Label>
                                                                    <Input id={`advance_proof_${loan.id}`} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => advanceForm.setData('payment_proof', event.target.files?.[0] ?? null)} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor={`advance_remarks_${loan.id}`}>Remarks</Label>
                                                                <Textarea id={`advance_remarks_${loan.id}`} value={advanceForm.data.remarks} onChange={(event) => advanceForm.setData('remarks', event.target.value)} />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setAdvanceLoanId(null)}>Cancel</Button>
                                                            <Button disabled={advanceForm.processing} onClick={() => submitAdvanceRequest(loan.id)}>Submit Advance Payment Request</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    )}

                                    {loan.settlement && (
                                        <div className="mt-4 rounded-md border border-slate-200 bg-background p-4">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold">Full Settlement</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Settlement amount: <span className="font-semibold text-slate-900">{formatCurrency(loan.settlement.settlement_amount)}</span>
                                                    </p>
                                                    {loan.settlement.latest_request && (
                                                        <div className="mt-2">
                                                            <Badge variant="outline">
                                                                Request {loan.settlement.latest_request.status.replace(/_/g, ' ')}
                                                            </Badge>
                                                            {loan.settlement.latest_request.rejection_reason && (
                                                                <p className="mt-1 text-xs text-red-600">{loan.settlement.latest_request.rejection_reason}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <Dialog open={settlementLoanId === loan.id} onOpenChange={(open) => setSettlementLoanId(open ? loan.id : null)}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="min-h-[44px] border-black bg-black text-white hover:bg-gray-800 hover:text-white"
                                                            disabled={!loan.settlement.is_eligible}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setSettlementLoanId(loan.id);
                                                            }}
                                                        >
                                                            <Wallet className="h-4 w-4" />
                                                            Request Full Settlement
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Request Full Settlement</DialogTitle>
                                                            <DialogDescription>
                                                                This sends your request to the General Manager for validation. Your loan remains active until payment is verified.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-2">
                                                            <div className="rounded-md border p-4">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-muted-foreground">Current balance</span>
                                                                    <span className="font-mono font-semibold">{formatCurrency(loan.settlement.outstanding_balance)}</span>
                                                                </div>
                                                                <div className="mt-2 flex items-center justify-between text-sm">
                                                                    <span className="text-muted-foreground">Settlement amount</span>
                                                                    <span className="font-mono text-base font-bold">{formatCurrency(loan.settlement.settlement_amount)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {loan.settlement.eligibility_checks.map((check) => (
                                                                    <div key={check.label} className="flex items-center gap-2 text-sm">
                                                                        <Badge variant={check.passed ? 'default' : 'destructive'}>{check.passed ? 'Passed' : 'Failed'}</Badge>
                                                                        <span>{check.label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{loan.settlement.calculation_basis}</p>
                                                            {settlementForm.errors.confirm && (
                                                                <p className="text-sm text-red-600">{settlementForm.errors.confirm}</p>
                                                            )}
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setSettlementLoanId(null)}>
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                onClick={() => submitSettlementRequest(loan.id)}
                                                                disabled={settlementForm.processing}
                                                            >
                                                                Submit Request
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-emerald-600 font-medium">
                                                {formatCurrency(loan.total_paid)} paid
                                            </span>
                                            <span className="text-muted-foreground">
                                                {formatCurrency(loan.remaining_balance)} remaining
                                            </span>
                                        </div>
                                        <div className="h-3 w-full rounded-full bg-emerald-100 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                                                style={{ width: `${loan.progress_percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedLoan === loan.id && (
                                    <div className="border-t bg-muted/30">
                                        {/* Next Payment Alert */}
                                        {loan.next_due_date && loan.payment_status !== 'paid_off' && (
                                            <div
                                                className={cn(
                                                    'p-4 mx-6 mt-6 rounded-lg border',
                                                    loan.payment_status === 'overdue'
                                                        ? 'bg-red-50 border-red-200'
                                                        : loan.payment_status === 'due_soon'
                                                        ? 'bg-orange-50 border-orange-200'
                                                        : 'bg-emerald-50 border-emerald-200'
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {loan.payment_status === 'overdue' ? (
                                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                                    ) : loan.payment_status === 'due_soon' ? (
                                                        <Clock className="h-5 w-5 text-orange-600" />
                                                    ) : (
                                                        <Calendar className="h-5 w-5 text-emerald-600" />
                                                    )}
                                                    <div>
                                                        <p
                                                            className={cn(
                                                                'font-semibold',
                                                                loan.payment_status === 'overdue'
                                                                    ? 'text-red-700'
                                                                    : loan.payment_status === 'due_soon'
                                                                    ? 'text-orange-700'
                                                                    : 'text-emerald-700'
                                                            )}
                                                        >
                                                            {loan.payment_status === 'overdue'
                                                                ? 'Payment Overdue!'
                                                                : loan.payment_status === 'due_soon'
                                                                ? 'Payment Due Soon'
                                                                : 'Next Payment Due'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatCurrency(loan.next_due_amount)} due on{' '}
                                                            {formatDate(loan.next_due_date)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Loan Details Grid */}
                                        <div className="p-6">
                                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-emerald-600" />
                                                Loan Details
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                                                <div className="p-3 rounded-lg bg-background border">
                                                    <p className="text-sm text-muted-foreground">Release Date</p>
                                                    <p className="font-medium">{formatDate(loan.release_date)}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-background border">
                                                    <p className="text-sm text-muted-foreground">Interest Amount</p>
                                                    <p className="font-medium">{formatCurrency(loan.interest_amount)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Amortization Schedule */}
                                        <div className="p-6">
                                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-emerald-600" />
                                                Amortization Schedule
                                            </h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[600px]">
                                                    <thead className="bg-muted/60 border-b">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                                #
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                                Due Date
                                                            </th>
                                                            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                                                                Amount Due
                                                            </th>
                                                            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                                                                Amount Paid
                                                            </th>
                                                            <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">
                                                                Status
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {paginatedAmortizations.map((amortization) => {
                                                            const { variant, label, color } = getStatusConfig(
                                                                amortization.status
                                                            );
                                                            return (
                                                                <tr key={amortization.id} className="hover:bg-muted/30">
                                                                    <td className="px-3 py-3 text-sm font-medium">
                                                                        {amortization.installment_number}
                                                                    </td>
                                                                    <td className="px-3 py-3 text-sm">
                                                                        {formatDate(amortization.due_date)}
                                                                    </td>
                                                                    <td className="px-3 py-3 text-sm text-right font-medium tabular-nums">
                                                                        {formatCurrency(amortization.amount_due)}
                                                                    </td>
                                                                    <td className="px-3 py-3 text-sm text-right tabular-nums">
                                                                        {formatCurrency(amortization.amount_paid)}
                                                                    </td>
                                                                    <td className="px-3 py-3 text-center">
                                                                        <Badge
                                                                            variant={variant}
                                                                            className={cn(
                                                                                color === 'bg-green-500'
                                                                                    ? 'bg-green-100 text-green-700'
                                                                                    : color === 'bg-yellow-500'
                                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                                    : color === 'bg-orange-500'
                                                                                    ? 'bg-orange-100 text-orange-700'
                                                                                    : color === 'bg-red-500'
                                                                                    ? 'bg-red-100 text-red-700'
                                                                                    : 'bg-gray-100 text-gray-700'
                                                                            )}
                                                                        >
                                                                            {label}
                                                                        </Badge>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <PaginationControls
                                                currentPage={safeAmortizationPage}
                                                totalPages={amortizationTotalPages}
                                                totalItems={loan.amortizations.length}
                                                itemsPerPage={ITEMS_PER_PAGE}
                                                onPageChange={(page) => setAmortizationPage(loan.id, page)}
                                            />
                                        </div>

                                        <Separator />

                                        {/* Payment History */}
                                        <div className="p-6">
                                            <h4 className="font-semibold mb-4 flex items-center gap-2">

                                               ₱ Payment History
                                            </h4>
                                            {loan.payments && loan.payments.length > 0 ? (
                                                <>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full min-w-[500px]">
                                                            <thead className="bg-muted/60 border-b">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                                        Payment Date
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                                        Reference No.
                                                                    </th>
                                                                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                                                                        Amount
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                                                                        Method
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border">
                                                                {paginatedPayments.map((payment) => (
                                                                    <tr key={payment.id} className="hover:bg-muted/30">
                                                                        <td className="px-3 py-3 text-sm">
                                                                            {formatDate(payment.payment_date)}
                                                                        </td>
                                                                        <td className="px-3 py-3 text-sm font-medium">
                                                                            {payment.reference_number || 'N/A'}
                                                                        </td>
                                                                        <td className="px-3 py-3 text-sm text-right font-medium tabular-nums text-emerald-600">
                                                                            {formatCurrency(payment.amount)}
                                                                        </td>
                                                                        <td className="px-3 py-3 text-sm">
                                                                            {payment.payment_method?.replace(/_/g, ' ') || payment.paid_by}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <PaginationControls
                                                        currentPage={safePaymentPage}
                                                        totalPages={paymentTotalPages}
                                                        totalItems={loan.payments.length}
                                                        itemsPerPage={ITEMS_PER_PAGE}
                                                        onPageChange={(page) => setPaymentPage(loan.id, page)}
                                                    />
                                                </>
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <div className="h-8 w-8 mx-auto mb-2 opacity-50">₱</div>

                                                    <p>No payments recorded yet</p>
                                                </div>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="p-6">
                                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                                                Loan Ledger
                                            </h4>
                                            {loan.transactions && loan.transactions.length > 0 ? (
                                                <>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full min-w-[760px]">
                                                            <thead className="bg-muted/60 border-b">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Remarks</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Processed By</th>
                                                                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                                                                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Balance</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border">
                                                                {paginatedTransactions.map((transaction) => (
                                                                    <tr key={transaction.id} className="hover:bg-muted/30">
                                                                        <td className="px-3 py-3 text-sm">{formatDate(transaction.date)}</td>
                                                                        <td className="px-3 py-3 text-sm">
                                                                            <Badge variant="outline">
                                                                                {transaction.type.replace(/_/g, ' ')}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="px-3 py-3 text-sm text-muted-foreground">
                                                                            {transaction.remarks || 'N/A'}
                                                                        </td>
                                                                        <td className="px-3 py-3 text-sm">{transaction.processed_by}</td>
                                                                        <td className="px-3 py-3 text-sm text-right font-medium tabular-nums">
                                                                            {formatCurrency(transaction.amount)}
                                                                        </td>
                                                                        <td className="px-3 py-3 text-sm text-right font-semibold tabular-nums">
                                                                            {formatCurrency(transaction.balance_after)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <PaginationControls
                                                        currentPage={safeTransactionPage}
                                                        totalPages={transactionTotalPages}
                                                        totalItems={loan.transactions.length}
                                                        itemsPerPage={ITEMS_PER_PAGE}
                                                        onPageChange={(page) => setTransactionPage(loan.id, page)}
                                                    />
                                                </>
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <p>No ledger transactions recorded yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
