import { Head, Link } from '@inertiajs/react';
import { 
    Search, 
    Clock, 
    DollarSign, 
    Filter, 
    Eye, 
    Edit, 
    Trash2 
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
    { title: 'GM Dashboard', href: '/dashboards/Gm/GmDashboard' },
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
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(displayStats.total_principal)}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800">Total Due</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-600" />
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
                                                        <Link href={`/dashboards/Gm/Loan/${loan.id}`}>
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
                <Card className="border-amber-100 bg-amber-50">
                    <CardContent className="p-4 text-sm text-amber-800">
                        <strong>Note:</strong> Backend data will override mock data from GmDashboardController.
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
