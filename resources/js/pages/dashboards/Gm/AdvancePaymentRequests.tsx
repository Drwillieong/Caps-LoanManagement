import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, CreditCard, Eye, Search, XCircle } from 'lucide-react';
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
        const variant = status === 'rejected' ? 'destructive' : status === 'completed' ? 'default' : 'secondary';
        return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
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
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Advance Payment Requests</h1>
                    <p className="text-muted-foreground">Validate requests and apply verified future installment payments.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-slate-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Awaiting Payment</CardTitle><CreditCard className="h-4 w-4 text-slate-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.awaiting_payment}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle2 className="h-4 w-4 text-slate-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Requests</CardTitle>
                        <div className="flex items-center gap-2">
                            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." className="w-72" />
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Loan</TableHead>
                                        <TableHead className="text-right">Advance</TableHead>
                                        <TableHead className="text-right">Installments</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell><div className="font-medium">{request.member.name}</div><div className="text-xs text-muted-foreground">{request.member.member_id}</div></TableCell>
                                            <TableCell><div>{request.loan.loan_type}</div><div className="text-xs text-muted-foreground">Loan #{request.loan.id}</div></TableCell>
                                            <TableCell className="text-right font-mono font-semibold">{formatCurrency(request.requested_amount)}</TableCell>
                                            <TableCell className="text-right">{request.installments_covered}</TableCell>
                                            <TableCell>{request.payment_method.replace(/_/g, ' ')}</TableCell>
                                            <TableCell>{statusBadge(request.status)}</TableCell>
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
                                        <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No advance payment requests found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader><DialogTitle>Advance Payment Details</DialogTitle><DialogDescription>Review request, payment details, and current loan balance.</DialogDescription></DialogHeader>
                    {selected && (
                        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-2">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div><h3 className="mb-2 text-sm font-semibold">Member</h3><p className="text-sm">{selected.member.name}</p><p className="text-sm text-muted-foreground">{selected.member.email}</p><p className="text-sm text-muted-foreground">Member ID: {selected.member.member_id}</p></div>
                                <div><h3 className="mb-2 text-sm font-semibold">Loan</h3><p className="text-sm">{selected.loan.loan_type} #{selected.loan.id}</p><p className="text-sm text-muted-foreground">Status: {selected.loan.status}</p><p className="text-sm text-muted-foreground">Released: {formatDate(selected.loan.release_date)}</p></div>
                            </div>
                            <Separator />
                            <div className="grid gap-3 md:grid-cols-4">
                                <div><p className="text-xs text-muted-foreground">Outstanding</p><p className="font-mono font-semibold">{formatCurrency(selected.current_outstanding_balance)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Regular Deduction</p><p className="font-mono font-semibold">{formatCurrency(selected.regular_deduction_amount)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Advance Amount</p><p className="font-mono font-semibold">{formatCurrency(selected.requested_amount)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Installments</p><p className="font-semibold">{selected.installments_covered}</p></div>
                            </div>
                            <div className="rounded-md border p-3 text-sm">
                                <p>Method: {selected.payment_method.replace(/_/g, ' ')}</p>
                                <p>Expected/payment date: {formatDate(selected.payment_date ?? selected.expected_payment_date)}</p>
                                <p>Reference: {selected.reference_number || 'N/A'}</p>
                                <p>Remarks: {selected.remarks || 'N/A'}</p>
                                {selected.payment_proof_url && <a className="text-emerald-700 underline" href={selected.payment_proof_url} target="_blank" rel="noreferrer">View payment proof</a>}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reject Advance Payment Request</DialogTitle><DialogDescription>A rejection reason is required and will be visible to the member.</DialogDescription></DialogHeader>
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
                    <DialogHeader><DialogTitle>Verify Advance Payment</DialogTitle><DialogDescription>Apply only after the payment or payroll deduction is actually confirmed.</DialogDescription></DialogHeader>
                    {verifying && (
                        <div className="space-y-4">
                            <div className="rounded-md border p-3 text-sm">Approved advance amount: <span className="font-mono font-semibold">{formatCurrency(verifying.requested_amount)}</span></div>
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
