import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, CreditCard, Eye, Search, XCircle } from 'lucide-react';
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
        const variant = status === 'rejected' ? 'destructive' : status === 'completed' ? 'default' : 'secondary';
        return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
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
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settlement Requests</h1>
                    <p className="text-muted-foreground">Validate, approve, and verify full loan settlement payments.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-slate-500" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">For Payment</CardTitle>
                            <CreditCard className="h-4 w-4 text-slate-500" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{stats.for_payment}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-slate-500" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent>
                    </Card>
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
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead className="text-right">Settlement</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Requested</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                <div className="font-medium">{request.member.name}</div>
                                                <div className="text-xs text-muted-foreground">{request.member.member_id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div>{request.loan.loan_type}</div>
                                                <div className="text-xs text-muted-foreground">Loan #{request.loan.id}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(request.outstanding_balance)}</TableCell>
                                            <TableCell className="text-right font-mono font-semibold">{formatCurrency(request.current_settlement_amount)}</TableCell>
                                            <TableCell>{statusBadge(request.status)}</TableCell>
                                            <TableCell>{formatDate(request.created_at)}</TableCell>
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
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No settlement requests found.</TableCell>
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
                        <DialogTitle>Settlement Details</DialogTitle>
                        <DialogDescription>Review member, loan, payment history, and eligibility checks.</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-2">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold">Member Information</h3>
                                    <p className="text-sm">{selected.member.name}</p>
                                    <p className="text-sm text-muted-foreground">{selected.member.email}</p>
                                    <p className="text-sm text-muted-foreground">Member ID: {selected.member.member_id}</p>
                                </div>
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold">Loan Information</h3>
                                    <p className="text-sm">{selected.loan.loan_type} #{selected.loan.id}</p>
                                    <p className="text-sm text-muted-foreground">Status: {selected.loan.status}</p>
                                    <p className="text-sm text-muted-foreground">Released: {formatDate(selected.loan.release_date)}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid gap-3 md:grid-cols-4">
                                <div><p className="text-xs text-muted-foreground">Principal</p><p className="font-mono font-semibold">{formatCurrency(selected.loan.principal_amount)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Total Due</p><p className="font-mono font-semibold">{formatCurrency(selected.loan.total_amount_due)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Paid</p><p className="font-mono font-semibold">{formatCurrency(selected.loan.total_paid)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Settlement</p><p className="font-mono font-semibold">{formatCurrency(selected.current_settlement_amount)}</p></div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold">Eligibility Checks</h3>
                                {selected.eligibility_checks.map((check) => (
                                    <div key={check.label} className="flex items-center gap-2 text-sm">
                                        <Badge variant={check.passed ? 'default' : 'destructive'}>{check.passed ? 'Passed' : 'Failed'}</Badge>
                                        <span>{check.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-md border p-3 text-xs text-muted-foreground">
                                {selected.calculation_breakdown?.calculation_basis}
                            </div>
                            <div>
                                <h3 className="mb-2 text-sm font-semibold">Payment History</h3>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead>Reference</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selected.payments.length > 0 ? selected.payments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                                    <TableCell>{payment.payment_method?.replace(/_/g, ' ')}</TableCell>
                                                    <TableCell>{payment.reference_number || 'N/A'}</TableCell>
                                                    <TableCell className="text-right font-mono">{formatCurrency(payment.amount)}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={4} className="h-16 text-center text-muted-foreground">No payments recorded.</TableCell></TableRow>
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
                        <DialogTitle>Reject Settlement Request</DialogTitle>
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
                        <DialogTitle>Verify Settlement Payment</DialogTitle>
                        <DialogDescription>Record only after the full settlement payment has been received.</DialogDescription>
                    </DialogHeader>
                    {verifying && (
                        <div className="space-y-4">
                            <div className="rounded-md border p-3 text-sm">
                                Required settlement amount: <span className="font-mono font-semibold">{formatCurrency(verifying.current_settlement_amount)}</span>
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
