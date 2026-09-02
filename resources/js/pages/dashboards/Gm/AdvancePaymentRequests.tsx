import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, Eye, Search, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { LiveClock } from '@/components/live-clock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface AdvancePaymentRequest {
    id: number;
    status: string;
    outstanding_balance: number;
    current_outstanding_balance: number;
    regular_deduction_amount: number;
    requested_amount: number;
    installments_covered: number;
    payment_method: string;
    expected_payment_date: string | null;
    payment_date: string | null;
    reference_number: string | null;
    payment_proof_url: string | null;
    remarks: string | null;
    rejection_reason: string | null;
    created_at: string;
    approved_at: string | null;
    verified_at: string | null;
    applied_at: string | null;
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
    };
}

interface Props {
    advancePaymentRequests: AdvancePaymentRequest[];
    stats: {
        pending: number;
        awaiting_payment: number;
        completed: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Advance Payments', href: '/dashboards/Gm/AdvancePaymentRequests' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
    pending_validation: { label: 'Pending Validation', icon: Clock, className: 'border-amber-200 bg-amber-50 text-amber-700' },
    awaiting_payment: { label: 'Awaiting Payment', icon: CreditCard, className: 'border-blue-200 bg-blue-50 text-blue-700' },
    payment_submitted: { label: 'Payment Submitted', icon: CreditCard, className: 'border-blue-200 bg-blue-50 text-blue-700' },
    scheduled_for_salary_deduction: { label: 'Scheduled Deduction', icon: Clock, className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
    completed: { label: 'Completed', icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    rejected: { label: 'Rejected', icon: XCircle, className: 'border-red-200 bg-red-50 text-red-700' },
};

export default function AdvancePaymentRequests({ advancePaymentRequests = [], stats }: Props) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<AdvancePaymentRequest | null>(null);
    const [rejecting, setRejecting] = useState<AdvancePaymentRequest | null>(null);
    const [verifying, setVerifying] = useState<AdvancePaymentRequest | null>(null);

    const approveForm = useForm({});
    const rejectForm = useForm({ rejection_reason: '' });
    const paymentForm = useForm({
        amount: '',
        payment_date: new Date().toISOString().slice(0, 10),
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
        return advancePaymentRequests.filter((request) =>
            request.member.name.toLowerCase().includes(term)
            || request.member.member_id.toLowerCase().includes(term)
            || String(request.loan.id).includes(term)
            || request.status.toLowerCase().includes(term)
        );
    }, [search, advancePaymentRequests]);

    const rejectedCount = useMemo(
        () => advancePaymentRequests.filter((request) => request.status === 'rejected').length,
        [advancePaymentRequests],
    );

    function approve(request: AdvancePaymentRequest) {
        approveForm.post(`/dashboards/Gm/AdvancePaymentRequests/${request.id}/approve`, { preserveScroll: true });
    }

    function reject(request: AdvancePaymentRequest) {
        rejectForm.post(`/dashboards/Gm/AdvancePaymentRequests/${request.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                rejectForm.reset();
                setRejecting(null);
            },
        });
    }

    function verifyPayment(request: AdvancePaymentRequest) {
        paymentForm.setData({
            amount: String(request.requested_amount),
            payment_date: request.payment_date ?? new Date().toISOString().slice(0, 10),
            reference_number: request.reference_number ?? '',
            remarks: request.remarks ?? '',
        });
        setVerifying(request);
    }

    function submitPayment(request: AdvancePaymentRequest) {
        paymentForm.post(`/dashboards/Gm/AdvancePaymentRequests/${request.id}/verify-payment`, {
            preserveScroll: true,
            onSuccess: () => {
                paymentForm.reset();
                setVerifying(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Advance Payment Requests" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="border-b border-slate-200 pb-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Advance Payment Requests</h1>
                    <p className="mt-1 text-sm text-slate-500">Validate requests and apply verified future installment payments.</p>
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
                            <CardTitle className="text-sm font-medium text-slate-600">Awaiting Payment</CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                                <CreditCard className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-semibold text-slate-900">{stats.awaiting_payment}</div></CardContent>
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
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Advance</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Installments</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Method</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                                        <TableRow key={request.id} className="transition-colors hover:bg-slate-50/60">
                                            <TableCell><div className="font-medium text-slate-900">{request.member.name}</div><div className="text-xs text-slate-500">{request.member.member_id}</div></TableCell>
                                            <TableCell><div className="text-slate-800">{request.loan.loan_type}</div><div className="text-xs text-slate-500">Loan #{request.loan.id}</div></TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-slate-900">{formatCurrency(request.requested_amount)}</TableCell>
                                            <TableCell className="text-right text-slate-700">{request.installments_covered}</TableCell>
                                            <TableCell className="capitalize text-slate-700">{request.payment_method.replace(/_/g, ' ')}</TableCell>
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
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setSelected(request)}><Eye className="h-4 w-4" /></Button>
                                                    {request.status === 'pending_validation' && (
                                                        <>
                                                            <Button size="sm" onClick={() => approve(request)}><CheckCircle2 className="h-4 w-4" />Approve</Button>
                                                            <Button variant="destructive" size="sm" onClick={() => setRejecting(request)}><XCircle className="h-4 w-4" />Reject</Button>
                                                        </>
                                                    )}
                                                    {['awaiting_payment', 'payment_submitted', 'scheduled_for_salary_deduction'].includes(request.status) && (
                                                        <Button size="sm" onClick={() => verifyPayment(request)}><CreditCard className="h-4 w-4" />Verify</Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-500">No advance payment requests found.</TableCell></TableRow>
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
                        <DialogTitle className="text-slate-900">Advance Payment Details</DialogTitle>
                        <DialogDescription>Review request, payment details, and current loan balance.</DialogDescription>
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
                                <div><h3 className="mb-2 text-sm font-semibold text-slate-900">Member</h3><p className="text-sm text-slate-800">{selected.member.name}</p><p className="text-sm text-slate-500">{selected.member.email}</p><p className="text-sm text-slate-500">Member ID: {selected.member.member_id}</p></div>
                                <div><h3 className="mb-2 text-sm font-semibold text-slate-900">Loan</h3><p className="text-sm text-slate-800">{selected.loan.loan_type} #{selected.loan.id}</p><p className="text-sm text-slate-500">Status: {selected.loan.status}</p><p className="text-sm text-slate-500">Released: {formatDate(selected.loan.release_date)}</p></div>
                            </div>
                            <Separator />
                            <div className="grid gap-3 md:grid-cols-4">
                                <div><p className="text-xs uppercase tracking-wide text-slate-500">Outstanding</p><p className="font-mono font-semibold text-slate-900">{formatCurrency(selected.current_outstanding_balance)}</p></div>
                                <div><p className="text-xs uppercase tracking-wide text-slate-500">Regular Deduction</p><p className="font-mono font-semibold text-slate-900">{formatCurrency(selected.regular_deduction_amount)}</p></div>
                                <div><p className="text-xs uppercase tracking-wide text-slate-500">Advance Amount</p><p className="font-mono font-semibold text-slate-900">{formatCurrency(selected.requested_amount)}</p></div>
                                <div><p className="text-xs uppercase tracking-wide text-slate-500">Installments</p><p className="font-semibold text-slate-900">{selected.installments_covered}</p></div>
                            </div>
                            <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-700">
                                <p>Method: <span className="capitalize">{selected.payment_method.replace(/_/g, ' ')}</span></p>
                                <p>Expected/payment date: {formatDate(selected.payment_date ?? selected.expected_payment_date)}</p>
                                <p>Reference: {selected.reference_number || 'N/A'}</p>
                                <p>Remarks: {selected.remarks || 'N/A'}</p>
                                {selected.payment_proof_url && <a className="font-medium text-emerald-700 underline underline-offset-2" href={selected.payment_proof_url} target="_blank" rel="noreferrer">View payment proof</a>}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-slate-900">Reject Advance Payment Request</DialogTitle>
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
                        <DialogTitle className="text-slate-900">Verify Advance Payment</DialogTitle>
                        <DialogDescription>Apply only after the payment or payroll deduction is actually confirmed.</DialogDescription>
                    </DialogHeader>
                    {verifying && (
                        <div className="space-y-4">
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Approved advance amount: <span className="font-mono font-semibold text-slate-900">{formatCurrency(verifying.requested_amount)}</span></div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div><Label htmlFor="amount">Amount Confirmed</Label><Input id="amount" value={paymentForm.data.amount} onChange={(event) => paymentForm.setData('amount', event.target.value)} />{paymentForm.errors.amount && <p className="text-sm text-red-600">{paymentForm.errors.amount}</p>}</div>
                                <div><Label htmlFor="payment_date">Payment Date</Label><Input id="payment_date" type="date" value={paymentForm.data.payment_date} onChange={(event) => paymentForm.setData('payment_date', event.target.value)} /></div>
                                <div><Label htmlFor="reference_number">Reference Number</Label><Input id="reference_number" value={paymentForm.data.reference_number} onChange={(event) => paymentForm.setData('reference_number', event.target.value)} /></div>
                            </div>
                            <div><Label htmlFor="remarks">Remarks</Label><Textarea id="remarks" value={paymentForm.data.remarks} onChange={(event) => paymentForm.setData('remarks', event.target.value)} /></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVerifying(null)}>Cancel</Button>
                        <Button disabled={paymentForm.processing} onClick={() => verifying && submitPayment(verifying)}>Verify and Apply</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
