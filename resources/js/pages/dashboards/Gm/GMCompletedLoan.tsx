import { Head, Link } from '@inertiajs/react';
import { 
    Search, 
    Archive, 
    DollarSign, 
    Users, 
    CheckCircle2, 
    Filter, 
    Eye, 
    Download,
    Printer 
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, LoanTableRow } from '@/types';
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
 
    { title: 'Completed Loans', href: '/dashboards/Gm/GMCompletedLoan' },
];

interface GMCompletedLoanProps {
    completed_loans: LoanTableRow[];
    stats: {
        total_completed: number;
        total_principal: number;
        total_repaid: number;
    };
}

export default function GMCompletedLoan({ completed_loans: initialLoans = [], stats = { total_completed: 0, total_principal: 0, total_repaid: 0 } }: GMCompletedLoanProps) {
    const [search, setSearch] = useState('');

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

    const filteredLoans = initialLoans.filter(loan => 
        loan.member_name.toLowerCase().includes(search.toLowerCase()) ||
        loan.member_id.includes(search)
    );

    const printTable = () => {
        const printWindow = window.open('', '_blank');
        const title = 'GM Completed Loans Report';
        const statsHtml = `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: #059669; font-size: 1.5rem; margin-bottom: 1rem;">${title}</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="border: 1px solid #d1d5db; padding: 1rem; border-radius: 0.5rem; background: #f9fafb;">
                        <h3 style="font-size: 0.875rem; font-weight: 600; color: #065f46; margin-bottom: 0.5rem;">Total Completed</h3>
                        <div style="font-size: 1.5rem; font-weight: bold;">${stats.total_completed}</div>
                    </div>
                    <div style="border: 1px solid #d1d5db; padding: 1rem; border-radius: 0.5rem; background: #f9fafb;">
                        <h3 style="font-size: 0.875rem; font-weight: 600; color: #065f46; margin-bottom: 0.5rem;">Principal Repaid</h3>
                        <div style="font-size: 1.5rem; font-weight: bold;">${formatCurrency(stats.total_principal)}</div>
                    </div>
                    <div style="border: 1px solid #d1d5db; padding: 1rem; border-radius: 0.5rem; background: #f9fafb;">
                        <h3 style="font-size: 0.875rem; font-weight: 600; color: #065f46; margin-bottom: 0.5rem;">Total Repaid</h3>
                        <div style="font-size: 1.5rem; font-weight: bold;">${formatCurrency(stats.total_repaid)}</div>
                    </div>
                </div>
            </div>
        `;

        let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin-top: 1rem;"><thead><tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">';
        const headers = ['ID', 'Member', 'Type', 'Principal', 'Terms', 'Total Due', 'Completion Date', 'Status'];
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
            tableHtml += `<td style="padding: 12px 8px;"><span style="padding: 4px 8px; border-radius: 4px; background: #ecfdf5; color: #059669; font-size: 0.75rem; font-weight: 500;">Completed</span></td>`;
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
            <Head title="GM Completed Loans" />
            
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Stats Header */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-emerald-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800">Total Completed</CardTitle>
                            <Archive className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_completed}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-800">Principal Repaid</CardTitle>
                            <div  className="h-4 w-4 text-green-600">₱</div>
                           
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_principal)}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-800">Total Repaid</CardTitle>
                            <div  className="h-4 w-4 text-green-600">₱</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_repaid)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card className="border-emerald-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-lg font-bold text-emerald-900">Completed Loans History</CardTitle>
                        <div className="flex gap-2">
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
                            <Button variant="outline" size="sm" onClick={printTable}>
                                <Printer className="h-4 w-4 mr-1" />
                                Print
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-emerald-100 overflow-hidden">
                            <Table>
                                <thead>
                                    <TableRow className="hover:bg-transparent border-b border-emerald-200">
                                        <TableHead className="w-16 font-semibold text-emerald-800">ID</TableHead>
                                        <TableHead className="font-semibold text-emerald-800">Member</TableHead>
                                        <TableHead className="font-semibold text-emerald-800">Type</TableHead>
                                        <TableHead className="font-semibold text-emerald-800 text-right">Principal</TableHead>
                                        <TableHead className="w-20 font-semibold text-emerald-800 text-right">Terms</TableHead>
                                        <TableHead className="font-semibold text-emerald-800 text-right">Total Due</TableHead>
                                        <TableHead className="w-28 font-semibold text-emerald-800">Completion Date</TableHead>
                                        <TableHead className="w-24 font-semibold text-emerald-800">Status</TableHead>
                                        <TableHead className="w-24 font-semibold text-emerald-800">Action</TableHead>
                                    </TableRow>
                                </thead>
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
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 capitalize">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Completed
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" asChild>
<Link href={`/dashboards/Gm/completed-loans/${loan.id}/view`}>
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
                                                No completed loans found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {filteredLoans.length > 10 && (
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-sm text-muted-foreground">
                                    Showing {filteredLoans.length} of {initialLoans.length} loans
                                </span>
                                <div className="flex gap-1">
                                    <Button variant="outline" size="sm">Previous</Button>
                                    <Button size="sm">Next</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}