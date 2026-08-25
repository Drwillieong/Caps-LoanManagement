import { Head, Link, usePage } from '@inertiajs/react';
import { 

    ArrowLeft, 
    Clock, 
    DollarSign, 
    FileText, 
    Users, 
    Calendar, 
    CheckCircle, 
    AlertCircle,
    Printer,
    Edit3,
    Download
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import type { BreadcrumbItem } from '@/types';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription 
} from '@/components/ui/card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

interface DetailedLoan {
    id: number;
    member_id: string;
    member_name: string;
    beneficiary_name?: string;
    loan_type: string;
    principal: number;
    terms: number;
    interest_rate: number;
    total_due: number;
    remaining_balance: number;
    total_paid: number;
    date_approved: string;
    status: 'active' | 'overdue' | 'completed' | 'pending';
    next_due_date: string;
    co_maker?: {
        name: string;
        relationship: string;
    };
    disbursement_method?: string;
    amortization_schedule: Array<{
        period: number;
        due_date: string;
        principal_payment: number;
        interest_payment: number;
        total_payment: number;
        status: 'paid' | 'due' | 'overdue';
    }>;
    payments: Array<{
        id: number;
        date: string;
        amount: number;
        method: string;
        reference: string;
    }>;
    transactions?: Array<{
        id: number;
        date: string;
        type: string;
        amount: number;
        remarks: string | null;
        balance_after: number;
        processed_by: string;
    }>;
}

interface Props {
    loan: DetailedLoan;
}

const breadcrumbs: BreadcrumbItem[] = [

    

];

export default function ViewActiveLoan({ loan }: Props) {
    const { props: inertiaProps } = usePage() as any;
    const role = inertiaProps?.auth?.user?.role as string | undefined;
    const backHref = role === 'hr' ? '/dashboards/HR/HRActiveLoan' : '/dashboards/Gm/GMActiveLoan';

    const [activeTab, setActiveTab] = useState('details');


    // Mock data fallback (remove in production)
    const mockLoan: DetailedLoan = {
        id: 1,
        member_id: 'MEM001',
        member_name: 'John Doe',
        beneficiary_name: 'Jane Doe',
        loan_type: 'Salary Loan',
        principal: 50000,
        terms: 12,
        interest_rate: 1.2,
        total_due: 55200,
        remaining_balance: 35200,
        total_paid: 20000,
        date_approved: '2024-01-15',
        status: 'active' as const,
        next_due_date: '2024-03-15',
        co_maker: { name: 'Robert Smith', relationship: 'Brother-in-law' },
        amortization_schedule: [
            { period: 1, due_date: '2024-02-15', principal_payment: 4000, interest_payment: 500, total_payment: 4500, status: 'paid' },
            { period: 2, due_date: '2024-03-15', principal_payment: 4100, interest_payment: 400, total_payment: 4500, status: 'due' },
            { period: 3, due_date: '2024-04-15', principal_payment: 4200, interest_payment: 300, total_payment: 4500, status: 'due' },
        ],
        payments: [
            { id: 1, date: '2024-01-20', amount: 4500, method: 'Salary Deduct', reference: 'PMT001' },
        ],
        transactions: [],
    };

    const displayLoan = loan || mockLoan;

    // Utils
    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    function getStatusVariant(status: DetailedLoan['status']): 'default' | 'secondary' | 'destructive' | 'success' {
        switch (status) {
            case 'active': return 'default';
            case 'overdue': return 'destructive';
            case 'completed': return 'secondary';
            case 'pending': return 'success';
            default: return 'secondary';
        }
    }

    function getStatusIcon(status: DetailedLoan['status']) {
        switch (status) {
            case 'active': return CheckCircle;
            case 'overdue': return AlertCircle;
            case 'completed': return CheckCircle;
            default: return CheckCircle;
        }
    }

    const StatusIcon = getStatusIcon(displayLoan.status);

    const repaymentProgress = ((displayLoan.total_paid / displayLoan.total_due) * 100);

    const printStatement = () => {
        const printWindow = window.open('', '_blank');
        const title = `Loan Statement - ${displayLoan.member_name}`;
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head><title>${title}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #111827; line-height: 1.5; }
                @media print { body { margin: 0; } }
                .card { border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; background: #f9fafb; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                th, td { padding: 12px 8px; text-align: left; border: 1px solid #d1d5db; }
                th { background: #f3f4f6; font-weight: 600; }
                .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
            </style></head>
            <body>
                <div class="card">
                    <h1 style="color: #059669; margin-bottom: 1rem;">${title}</h1>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div><strong>Member:</strong> ${displayLoan.member_name}</div>
                        <div><strong>ID:</strong> ${displayLoan.member_id}</div>
                        <div><strong>Type:</strong> ${displayLoan.loan_type}</div>
                        <div><strong>Status:</strong> <span class="status-badge" style="background: ${displayLoan.status === 'overdue' ? '#fee2e2; color: #dc2626' : '#ecfdf5; color: #059669'}">${displayLoan.status.toUpperCase()}</span></div>
                    </div>
                </div>
                <div class="card">
                    <h2>Financial Summary</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        <div><strong>Principal:</strong> ${formatCurrency(displayLoan.principal)}</div>
                        <div><strong>Total Due:</strong> ${formatCurrency(displayLoan.total_due)}</div>
                        <div><strong>Paid:</strong> ${formatCurrency(displayLoan.total_paid)}</div>
                        <div><strong>Balance:</strong> ${formatCurrency(displayLoan.remaining_balance)}</div>
                    </div>
                </div>
                <div class="card">
                    <h2>Recent Payments</h2>
                    ${displayLoan.payments.map(p => `<div><strong>${formatDate(p.date)}:</strong> ${formatCurrency(p.amount)} (Salary Deduct)</div>`).join('')}
                </div>
                <div style="text-align: center; margin-top: 2rem; font-size: 0.875rem; color: #6b7280;">
                    Printed on ${new Date().toLocaleString('en-PH')}
                </div>
            </body></html>
        `;
        printWindow?.document.write(printContent);
        printWindow?.document.close();
        printWindow?.print();
    };

    return (
        <AppLayout breadcrumbs={[...breadcrumbs, { title: displayLoan.member_name, href: '#' }]} headerRight={<LiveClock />}>
            <Head title={`Loan ${displayLoan.member_id} - ${displayLoan.member_name}`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Loan Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                       



                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{displayLoan.member_name}</h1>
                            <p className="text-muted-foreground">Loan {displayLoan.member_id} • {displayLoan.loan_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
    <Badge variant={getStatusVariant(displayLoan.status) as any} className="text-lg px-3 py-1">
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {displayLoan.status.toUpperCase()}
                        </Badge>
                        <Button onClick={printStatement} variant="outline">
                            <Printer className="h-4 w-4 mr-2" />
                            Print Statement
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Principal Amount</CardTitle>
                           
                            <div className="h-4 w-4 text-emerald-600">₱</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(displayLoan.principal)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
                            <div className="h-4 w-4 text-orange-600">₱</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{formatCurrency(displayLoan.remaining_balance)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                            <div className="h-4 w-4 text-emerald-600">₱</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(displayLoan.total_paid)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Repayment Progress</CardTitle>
                            <Clock className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-2xl font-bold text-emerald-600">{repaymentProgress.toFixed(1)}%</div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${repaymentProgress}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">Complete</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Tab Container */}
                <div className="border-b border-muted">
                    <div className="flex -mb-px">
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'details' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Details
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'schedule' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                            onClick={() => setActiveTab('schedule')}
                        >
                            Schedule
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'payments' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                            onClick={() => setActiveTab('payments')}
                        >
                            Payments
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'ledger' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                            onClick={() => setActiveTab('ledger')}
                        >
                            Ledger
                        </button>
                        
                      <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'actions' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                            onClick={() => setActiveTab('')}
                        >
                       
                        </button>
                    </div>
                </div>

                <div className="mt-6">
                    {activeTab === 'details' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Loan Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Member ID</label>
                                        <div className="font-mono font-semibold">{displayLoan.member_id}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Beneficiary</label>
                                        <div>{displayLoan.beneficiary_name || 'N/A'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Loan Type</label>
                                        <div className="font-medium">{displayLoan.loan_type}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Terms</label>
                                        <div>{displayLoan.terms} months</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Interest Rate</label>
                                        <div>{displayLoan.interest_rate}%</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Approved Date</label>
                                        <div>{formatDate(displayLoan.date_approved)}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Next Due</label>
                                        <div>{formatDate(displayLoan.next_due_date)}</div>
                                    </div>
                                    {displayLoan.co_maker && (
                                        <div className="space-y-1 md:col-span-2 lg:col-span-1">
                                            <label className="text-sm font-medium text-muted-foreground">Co-maker</label>
                                            <div className="font-medium">{displayLoan.co_maker.name}</div>
                                            <div className="text-xs text-muted-foreground">({displayLoan.co_maker.relationship})</div>
                                        </div>
                                    )}
                                    {displayLoan.disbursement_method && (
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-muted-foreground">Disbursement Method</label>
                                            <div className="font-medium capitalize">{displayLoan.disbursement_method.replace('_', ' ')}</div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'schedule' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Amortization Schedule</CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Period</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead className="text-right">Principal</TableHead>
                                                <TableHead className="text-right">Interest</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {displayLoan.amortization_schedule.map((item, idx) => (
                                                <TableRow key={idx} className="hover:bg-emerald-50/50">
                                                    <TableCell className="font-medium">#{item.period}</TableCell>
                                                    <TableCell>{formatDate(item.due_date)}</TableCell>
                                                    <TableCell className="text-right font-mono">{formatCurrency(item.principal_payment)}</TableCell>
                                                    <TableCell className="text-right font-mono">{formatCurrency(item.interest_payment)}</TableCell>
                                                    <TableCell className="text-right font-mono font-semibold">{formatCurrency(item.total_payment)}</TableCell>
                                                    <TableCell>
                                                    <Badge variant={(item.status === 'paid' ? 'default' : item.status === 'overdue' ? 'destructive' : 'secondary') as any}>
                                                            {item.status.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'payments' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead>Reference</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {displayLoan.payments.length > 0 ? (
                                                displayLoan.payments.map((payment) => (
                                                    <TableRow key={payment.id}>
                                                        <TableCell>{formatDate(payment.date)}</TableCell>
                                                        <TableCell className="font-mono font-semibold">{formatCurrency(payment.amount)}</TableCell>
                                                        <TableCell>{payment.method}</TableCell>
                                                        <TableCell>{payment.reference}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                        No payments recorded yet.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'ledger' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Loan Ledger</CardTitle>
                                <CardDescription>Audit trail for releases, deductions, missed deductions, and manual payments.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Remarks</TableHead>
                                                <TableHead>Processed By</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(displayLoan.transactions ?? []).length > 0 ? (
                                                (displayLoan.transactions ?? []).map((transaction) => (
                                                    <TableRow key={transaction.id}>
                                                        <TableCell>{formatDate(transaction.date)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {transaction.type.replaceAll('_', ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                                                            {transaction.remarks || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>{transaction.processed_by}</TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {formatCurrency(transaction.amount)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-semibold">
                                                            {formatCurrency(transaction.balance_after)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                        No ledger transactions recorded yet.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'actions' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Loan Actions</CardTitle>
                                <CardDescription>Manage this loan application</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                  {/* 
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Button className="w-full" variant="outline">
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit Loan Details
                                    </Button>
                                    <Button className="w-full" variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Documents
                                    </Button>
                                    <Button size="lg" className="w-full md:col-span-2 bg-emerald-600 hover:bg-emerald-700">
                                        Record Payment
                                    </Button>
                                    {displayLoan.status === 'active' && (
                                        <Button className="w-full md:col-span-2" variant="outline" size="lg">
                                            Mark as Completed
                                        </Button>
                                    )}
                                </div> Tab Container */}
                            </CardContent>
                        </Card>
                    )}
                </div>
                 </div>
        </AppLayout>
    );
}
