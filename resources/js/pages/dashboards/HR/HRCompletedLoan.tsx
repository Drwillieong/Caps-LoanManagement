import { Head, Link } from '@inertiajs/react';
import { 
    Search, 
    Archive, 
    DollarSign, 
    Users, 
    CheckCircle2, 
    Filter, 
    Eye, 
    Download 
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
    { title: 'HR Dashboard', href: '/dashboards/HR/HRDashboard' },
    { title: 'Completed Loans', href: '/dashboards/HR/HRCompletedLoan' },
];

interface HRCompletedLoanProps {
    completed_loans: LoanTableRow[];
    stats: {
        total_completed: number;
        total_principal: number;
        total_repaid: number;
    };
}

export default function HRCompletedLoan({ completed_loans: initialLoans = [], stats = { total_completed: 0, total_principal: 0, total_repaid: 0 } }: HRCompletedLoanProps) {
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

    const filteredLoans = (Array.isArray(initialLoans) ? initialLoans : []).filter(loan => 
        loan.member_name?.toLowerCase().includes(search.toLowerCase()) ||
        loan.member_id?.includes(search)
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="HR Completed Loans" />
            
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Stats Header */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-emerald-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800">Total Completed</CardTitle>
                            <Archive className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_completed || 0}</div>

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
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Export CSV
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
                                        <TableHead className="w-28 font-semibold text-emerald-800">Completion Date</TableHead>
                                        <TableHead className="w-24 font-semibold text-emerald-800">Status</TableHead>
                                        <TableHead className="w-24 font-semibold text-emerald-800">Action</TableHead>
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
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 capitalize">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Completed
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/dashboards/HR/Loan/${loan.id}`}>
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
                                    Showing {filteredLoans.length} of {(Array.isArray(initialLoans) ? initialLoans.length : 0)} loans
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
