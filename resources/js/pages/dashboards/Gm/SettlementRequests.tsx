import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, Eye, Search, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { LiveClock } from '@/components/live-clock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface SettlementRequest {
    id: number;
    status: string;
    outstanding_balance: number;
    settlement_amount: number;
    current_settlement_amount: number;
    calculation_breakdown: Record<string, any>;
    eligibility_checks: Array<{ label: string; passed: boolean }>;
    rejection_reason: string | null;
    payment_method: string | null;
    reference_number: string | null;
    payment_date: string | null;
    created_at: string;
    approved_at: string | null;
    verified_at: string | null;
    loan: {
        id: number;
        status: string;
        loan_type: string;
        principal_amount: number;
        total_amount_due: number;
        monthly_amortization: number;
        release_date: string | null;
        total_paid: number;
    };
    member: {
        id: number;
        name: string;
        email: string;
        member_id: string;
        payroll_id: string | null;
        basic_salary: number;
    };
    payments: Array<{
        id: number;
        payment_date: string | null;
        amount: number;
        payment_method: string | null;
        reference_number: string | null;
    }>;
}

interface Props {
    settlementRequests: SettlementRequest[];
    stats: {
        pending: number;
        for_payment: number;
        completed: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settlement Requests', href: '/dashboards/Gm/SettlementRequests' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
    pending: { label: 'Pending', icon: Clock, className: 'border-amber-200 bg-amber-50 text-amber-700' },
    approved: { label: 'Approved', icon: CheckCircle2, className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
    for_payment: { label: 'For Payment', icon: CreditCard, className: 'border-blue-200 bg-blue-50 text-blue-700' },
    completed: { label: 'Completed', icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    rejected: { label: 'Rejected', icon: XCircle, className: 'border-red-200 bg-red-50 text-red-700' },
};

export default function SettlementRequests({ settlementRequests = [], stats }: Props) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<SettlementRequest | null>(null);
    const [rejecting, setRejecting] = useState<SettlementRequest | null>(null);
    const [verifying, setVerifying] = useState<SettlementRequest | null>(null);

    const approveForm = useForm({});
    const rejectForm = useForm({ rejection_reason: '' });
    const paymentForm = useForm({
        amount: '',
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: 'cash',
        reference_number: '',
        remarks: '',
    });

    function formatCurrency(amount: number | string) {
        const value = typeof amount === 'string' ? Number(amount) : amount;
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0);
    }

    function formatDate(date: string | null) {
        return date ? new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    }

    function statusBadge(status: string) {
        const config = STATUS_CONFIG[status] ?? { label: status.replace(/_/g, ' '), icon: Clock, className: 'border-slate-200 bg-slate-50 text-slate-700' };
        const Icon = config.icon;
        return (
            <Badge variant="outline" className={`gap-1 font-medium capitalize ${config.className}`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    }

    const filteredRequests = useMemo(() => {
        const term = search.toLowerCase();
        return settlementRequests.filter((request) =>
            request.member.name.toLowerCase().includes(term)
            || request.member.member_id.toLowerCase().includes(term)
            || String(request.loan.id).includes(term)
            || request.status.toLowerCase().includes(term)
        );
    }, [search, settlementRequests]);

    const rejectedCount = useMemo(
        () => settlementRequests.filter((request) => request.status === 'rejected').length,
        [settlementRequests],
    );

    function approve(request: SettlementRequest) {
        approveForm.post(`/dashboards/Gm/SettlementRequests/${request.id}/approve`, { preserveScroll: true });
    }

    function reject(request: SettlementRequest) {
        rejectForm.post(`/dashboards/Gm/SettlementRequests/${request.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                rejectForm.reset();
                setRejecting(null);
            },
        });
    }

    function verifyPayment(request: SettlementRequest) {
        paymentForm.setData('amount', String(request.current_settlement_amount));
        setVerifying(request);
    }

    function submitPayment(request: SettlementRequest) {
        paymentForm.post(`/dashboards/Gm/SettlementRequests/${request.id}/verify-payment`, {
            preserveScroll: true,
            onSuccess: () => {
                paymentForm.reset();
                setVerifying(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Settlement Requests" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="border-b border-slate-200 pb-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settlement Requests</h1>
                    <p className="mt-1 text-sm text-slate-500">Validate, approve, and verify full loan settlement payments.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-semibold text-slate-900">{stats.pending}</div></CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">For Payment</CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                                <CreditCard className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-semibold text-slate-900">{stats.for_payment}</div></CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-semibold text-slate-900">{stats.completed}</div></CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Rejected</CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                                <XCircle className="h-4 w-4 text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-semibold text-slate-900">{rejectedCount}</div></CardContent>
                    </Card>
                </div>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-col gap-3 border-b border-slate-100 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-slate-900">Requests</CardTitle>
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-slate-400" />
                            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by member, loan, or status..." className="w-72" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loan</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Balance</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Settlement</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requested</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                                        <TableRow key={request.id} className="transition-colors hover:bg-slate-50/60">
                                            <TableCell>
                                                <div className="font-medium text-slate-900">{request.member.name}</div>
                                                <div className="text-xs text-slate-500">{request.member.member_id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-slate-800">{request.loan.loan_type}</div>
                                                <div className="text-xs text-slate-500">Loan #{request.loan.id}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-700">{formatCurrency(request.outstanding_balance)}</TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-slate-900">{formatCurrency(request.current_settlement_amount)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {statusBadge(request.status)}
                                                    {request.status === 'rejected' && request.rejection_reason && (
                                                        <span className="max-w-[200px] truncate text-xs italic text-red-600" title={request.rejection_reason}>
                                                            {request.rejection_reason}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-700">{formatDate(request.created_at)}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setSelected(request)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <Button size="sm" onClick={() => approve(request)}>
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Approve
                                                            </Button>
                                                            <Button variant="destructive" size="sm" onClick={() => setRejecting(request)}>
                                                                <XCircle className="h-4 w-4" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    {['approved', 'for_payment'].includes(request.status) && (
                                                        <Button size="sm" onClick={() => verifyPayment(request)}>
                                                            <CreditCard className="h-4 w-4" />
                                                            Verify Payment
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-slate-500">No settlement requests found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900">Settlement Details</DialogTitle>
                        <DialogDescription>Review member, loan, payment history, and eligibility checks.</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-2">
                            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                                <span className="text-sm font-medium text-slate-600">Current Status</span>
                                {statusBadge(selected.status)}
                            </div>

                            {selected.status === 'rejected' && selected.rejection_reason && (
                                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                                        <AlertTriangle className="h-4 w-4" />
                                        Rejection Reason
                                    </div>
                                    <p className="mt-1 text-sm text-red-700">{selected.rejection_reason}</p>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-slate-900">Member Information</h3>
                                    <p className="text-sm text-slate-800">{selected.member.name}</p>
                                    <p className="text-sm text-slate-500">{selected.member.email}</p>
                                    <p className="text-sm text-slate-500">Member ID: {selected.member.member_id}</p>
                                </div>
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-slate-900">Loan Information</h3>
                                    <p className="text-sm text-slate-800">{selected.loan.loan_type} #{selected.loan.id}</p>
                                    <p className="text-sm text-slate-500">Status: {selected.loan.status}</p>
                                    <p className="text-sm text-slate-500">Released: {formatDate(selected.loan.release_date)}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid gap-3 md:grid-cols-4">
                                <div><p className="text-xs uppercase tracking-wide text-slate-500">Principal</p><p className="font-mono font-semibold text-slate-900">{formatCurrency(selected.loan.principal_amount)}</p></div>
                                <div><p className="text-xs uppercase tracking-wide text-slate-500">Total Due</p><p className="font-mono font-semibold text-slate-900">{formatCurrency(selected.loan.total_amount_due)}</p></div>
                                <div><p className="text-xs uppercase tracking-wide text-slate-500">Paid</p><p className="font-mono font-semibold text-slate-900">{formatCurrency(selected.loan.total_paid)}</p></div>
                                <div><p className="text-xs uppercase tracking-wide text-slate-500">Settlement</p><p className="font-mono font-semibold text-slate-900">{formatCurrency(selected.current_settlement_amount)}</p></div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-slate-900">Eligibility Checks</h3>
                                {selected.eligibility_checks.map((check) => (
                                    <div key={check.label} className="flex items-center gap-2 text-sm text-slate-700">
                                        <Badge
                                            variant="outline"
                                            className={check.passed ? 'gap-1 border-emerald-200 bg-emerald-50 text-emerald-700' : 'gap-1 border-red-200 bg-red-50 text-red-700'}
                                        >
                                            {check.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                            {check.passed ? 'Passed' : 'Failed'}
                                        </Badge>
                                        <span>{check.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                {selected.calculation_breakdown?.calculation_basis}
                            </div>
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-slate-900">Payment History</h3>
                                <div className="rounded-md border border-slate-200">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</TableHead>
                                                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Method</TableHead>
                                                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</TableHead>
                                                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selected.payments.length > 0 ? selected.payments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell className="text-slate-700">{formatDate(payment.payment_date)}</TableCell>
                                                    <TableCell className="capitalize text-slate-700">{payment.payment_method?.replace(/_/g, ' ')}</TableCell>
                                                    <TableCell className="text-slate-700">{payment.reference_number || 'N/A'}</TableCell>
                                                    <TableCell className="text-right font-mono text-slate-900">{formatCurrency(payment.amount)}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={4} className="h-16 text-center text-slate-500">No payments recorded.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-slate-900">Reject Settlement Request</DialogTitle>
                        <DialogDescription>A rejection reason is required and will be visible to the member.</DialogDescription>
                    </DialogHeader>
                    <Label htmlFor="rejection_reason">Reason</Label>
                    <Textarea id="rejection_reason" value={rejectForm.data.rejection_reason} onChange={(event) => rejectForm.setData('rejection_reason', event.target.value)} />
                    {rejectForm.errors.rejection_reason && <p className="text-sm text-red-600">{rejectForm.errors.rejection_reason}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
                        <Button variant="destructive" disabled={rejectForm.processing || !rejectForm.data.rejection_reason.trim()} onClick={() => rejecting && reject(rejecting)}>Reject</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!verifying} onOpenChange={(open) => !open && setVerifying(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-slate-900">Verify Settlement Payment</DialogTitle>
                        <DialogDescription>Record only after the full settlement payment has been received.</DialogDescription>
                    </DialogHeader>
                    {verifying && (
                        <div className="space-y-4">
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                Required settlement amount: <span className="font-mono font-semibold text-slate-900">{formatCurrency(verifying.current_settlement_amount)}</span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="amount">Amount Received</Label>
                                    <Input id="amount" value={paymentForm.data.amount} onChange={(event) => paymentForm.setData('amount', event.target.value)} />
                                    {paymentForm.errors.amount && <p className="text-sm text-red-600">{paymentForm.errors.amount}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="payment_date">Payment Date</Label>
                                    <Input id="payment_date" type="date" value={paymentForm.data.payment_date} onChange={(event) => paymentForm.setData('payment_date', event.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="payment_method">Payment Method</Label>
                                    <select id="payment_method" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs" value={paymentForm.data.payment_method} onChange={(event) => paymentForm.setData('payment_method', event.target.value)}>
                                        <option value="cash">Cash</option>
                                        <option value="gcash">GCash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="adjustment">Adjustment</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="reference_number">Reference Number</Label>
                                    <Input id="reference_number" value={paymentForm.data.reference_number} onChange={(event) => paymentForm.setData('reference_number', event.target.value)} />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea id="remarks" value={paymentForm.data.remarks} onChange={(event) => paymentForm.setData('remarks', event.target.value)} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVerifying(null)}>Cancel</Button>
                        <Button disabled={paymentForm.processing} onClick={() => verifying && submitPayment(verifying)}>Verify Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
