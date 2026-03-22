import { Head, Link } from '@inertiajs/react';
import { 
    Search, 
    Clock, 
    DollarSign, 
    Filter, 
    Eye, 
    Edit, 
    Trash2,
    Printer
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, ActiveLoan } from '@/types';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
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
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
 
    { title: 'Active Loans', href: '/dashboards/Gm/GMActiveLoan' },
];

interface GMActiveLoanProps {
    active_loans: ActiveLoan[];
    stats: {
        total_active: number;
        total_principal: number;
        total_due: number;
    };
}

export default function GMActiveLoan({ active_loans = [], stats = { total_active: 0, total_principal: 0, total_due: 0 } }: GMActiveLoanProps) {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'overdue'>('all');

    const mockActiveLoans: ActiveLoan[] = [
        {
            id: 1,
            member_id: 'MEM001',
            member_name: 'John Doe',
            loan_type: 'Salary Loan',
            principal: 50000,
            terms: 12,
            total_due: 55200,
            date: '2024-01-15',
            status: 'active' as const,
            remaining_balance: 35200,
            total_paid: 20000,
            next_due_date: '2024-03-15'
        },
        {
            id: 2,
            member_id: 'MEM002',
            member_name: 'Jane Smith',
            loan_type: 'Business Loan',
            principal: 150000,
            terms: 24,
            total_due: 180000,
            date: '2024-02-01',
            status: 'overdue' as const,
            remaining_balance: 120000,
            total_paid: 60000,
            next_due_date: '2024-04-10'
        },
        {
            id: 3,
            member_id: 'MEM003',
            member_name: 'Bob Johnson',
            loan_type: 'Emergency Loan',
            principal: 25000,
            terms: 6,
            total_due: 27000,
            date: '2024-03-01',
            status: 'active' as const,
            remaining_balance: 13500,
            total_paid: 13500,
            next_due_date: '2024-04-01'
        }
    ];

    const mockStats = {
        total_active: 3,
        total_principal: 225000,
        total_due: 262200
    };

    // Backend data ready - no mocks needed
    const displayLoans = active_loans;
    const displayStats = stats;

    // Format currency
    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    }

    // Format date
    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    // Status badge variant
    function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' {
        switch (status) {
            case 'active': return 'default';
            case 'overdue': return 'destructive';
            case 'completed': return 'secondary';
            default: return 'secondary';
        }
    }

    const filteredLoans = active_loans.filter(loan => {
        const matchesSearch = loan.member_name.toLowerCase().includes(search.toLowerCase()) ||
                             loan.member_id.includes(search);
        const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const printTable = () => {
        const printWindow = window.open('', '_blank');
        const title = 'GM Active Loans Report';
        const statsHtml = `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: #059669; font-size: 1.5rem; margin-bottom: 1rem;">${title}</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="border: 1px solid #d1d5db; padding: 1rem; border-radius: 0.5rem; background: #f9fafb;">
                        <h3 style="font-size: 0.875rem; font-weight: 600; color: #065f46; margin-bottom: 0.5rem;">Total Active Loans</h3>
                        <div style="font-size: 1.5rem; font-weight: bold;">${displayStats.total_active}</div>
                    </div>
                    <div style="border: 1px solid #d1d5db; padding: 1rem; border-radius: 0.5rem; background: #f9fafb;">
                        <h3 style="font-size: 0.875rem; font-weight: 600; color: #065f46; margin-bottom: 0.5rem;">Total Principal</h3>
                        <div style="font-size: 1.5rem; font-weight: bold;">${formatCurrency(displayStats.total_principal)}</div>
                    </div>
                    <div style="border: 1px solid #d1d5db; padding: 1rem; border-radius: 0.5rem; background: #f9fafb;">
                        <h3 style="font-size: 0.875rem; font-weight: 600; color: #065f46; margin-bottom: 0.5rem;">Total Due</h3>
                        <div style="font-size: 1.5rem; font-weight: bold;">${formatCurrency(displayStats.total_due)}</div>
                    </div>
                </div>
            </div>
        `;

        let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin-top: 1rem;"><thead><tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">';
        const headers = ['ID', 'Member', 'Type', 'Principal', 'Terms', 'Total Due', 'Date', 'Status', 'Next Due'];
        headers.forEach(header => {
            tableHtml += `<th style="padding: 12px 8px; text-align: left; font-weight: 600; border: 1px solid #d1d5db; font-size: 0.875rem;">${header}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        filteredLoans.forEach(loan => {
            tableHtml += '<tr style="border-bottom: 1px solid #e5e7eb;">';
            tableHtml += `<td style="padding: 12px 8px; font-family: monospace; font-size: 0.875rem; font-weight: 500;">${loan.member_id}</td>`;
            tableHtml += `<td style="padding: 12px 8px; font-weight: 500;">${loan.member_name}</td>`;
            tableHtml += `<td style="padding: 12px 8px;">${loan.loan_type}</td>`;
            tableHtml += `<td style="padding: 12px 8px; text-align: right; font-family: monospace;">${formatCurrency(loan.principal)}</td>`;
            tableHtml += `<td style="padding: 12px 8px; text-align: right;">${loan.terms} mo</td>`;
            tableHtml += `<td style="padding: 12px 8px; text-align: right; font-weight: 600; font-family: monospace;">${formatCurrency(loan.total_due)}</td>`;
            tableHtml += `<td style="padding: 12px 8px;">${formatDate(loan.date)}</td>`;
            tableHtml += `<td style="padding: 12px 8px;"><span style="padding: 4px 8px; border-radius: 4px; background: ${loan.status === 'overdue' ? '#fee2e2' : '#ecfdf5'}; color: ${loan.status === 'overdue' ? '#dc2626' : '#059669'}; font-size: 0.75rem; font-weight: 500;">${loan.status}</span></td>`;
            tableHtml += `<td style="padding: 12px 8px;">${formatDate(loan.next_due_date || '')}</td>`;
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table>';

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #111827; line-height: 1.5; }
                    @media print { body { margin: 0; } }
                    table th { background: #f3f4f6 !important; }
                    table td, table th { border: 1px solid #d1d5db !important; }
                    h2 { color: #059669 !important; }
                </style>
            </head>
            <body>
                ${statsHtml}
                ${tableHtml}
                <div style="margin-top: 2rem; font-size: 0.875rem; color: #6b7280; text-align: center;">
                    Printed on ${new Date().toLocaleString('en-PH')}<br/>
                    Filtered results: ${filteredLoans.length} shown
                </div>
            </body>
            </html>
        `;

        printWindow?.document.write(printContent);
        printWindow?.document.close();
        printWindow?.focus();
        printWindow?.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="GM Active Loans" />
            
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Stats Header */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-emerald-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800">Total Active Loans</CardTitle>
                            <Clock className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{displayStats.total_active}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800">Total Principal</CardTitle>
                             <div  className="h-4 w-4 text-green-600">₱</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(displayStats.total_principal)}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800">Total Due</CardTitle>
                            <div  className="h-4 w-4 text-green-600">₱</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(displayStats.total_due)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Controls */}
                <Card className="border-emerald-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-lg font-bold text-emerald-900">Active Loans</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search member ID or name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-64 max-w-sm"
                                />
                                <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setFilterStatus('all')}>
                                <Filter className="h-4 w-4 mr-1" />
                                All ({displayLoans.length})
                            </Button>
                            <Button variant="outline" size="sm" onClick={printTable}>
                                <Printer className="h-4 w-4 mr-1" />
                                Print
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-emerald-100 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-emerald-200">
                                        <TableHead className="w-16 font-semibold text-emerald-800">ID</TableHead>
                                        <TableHead className="font-semibold text-emerald-800">Member</TableHead>
                                        <TableHead className="font-semibold text-emerald-800">Type</TableHead>
                                        <TableHead className="font-semibold text-emerald-800 text-right">Principal</TableHead>
                                        <TableHead className="w-20 font-semibold text-emerald-800 text-right">Terms</TableHead>
                                        <TableHead className="font-semibold text-emerald-800 text-right">Total Due</TableHead>
                                        <TableHead className="w-28 font-semibold text-emerald-800">Date</TableHead>
                                        <TableHead className="w-24 font-semibold text-emerald-800">Status</TableHead>
                                        <TableHead className="w-32 font-semibold text-emerald-800">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLoans.length > 0 ? (
                                        filteredLoans.map((loan) => (
                                            <TableRow key={loan.id} className="hover:bg-emerald-50/50 border-b border-emerald-50 transition-colors">
                                                <TableCell className="font-mono text-sm font-medium">{loan.member_id}</TableCell>
                                                <TableCell className="font-medium">{loan.member_name}</TableCell>
                                                <TableCell>{loan.loan_type}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(loan.principal)}</TableCell>
                                                <TableCell className="text-right">{loan.terms} mo</TableCell>
                                                <TableCell className="text-right font-mono font-semibold">{formatCurrency(loan.total_due)}</TableCell>
                                                <TableCell>{formatDate(loan.date)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(loan.status)} className="capitalize">
                                                        {loan.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" asChild>
<Link href={`/dashboards/Gm/active-loans/${loan.id}/view`}>

                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                No active loans found matching your search/filter.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Stub */}
                        {filteredLoans.length > 10 && (
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-sm text-muted-foreground">
                                    Showing {filteredLoans.length} of {displayLoans.length} loans
                                </span>
                                <div className="flex gap-1">
                                    <Button variant="outline" size="sm">Previous</Button>
                                    <Button size="sm">Next</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Note */}
               
            </div>
        </AppLayout>
    );
}
