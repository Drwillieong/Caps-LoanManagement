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
    { title: 'HR Dashboard', href: '/dashboards/HR/HRDashboard' },
    { title: 'Active Loans', href: '/dashboards/HR/HRActiveLoan' },
];

interface HRActiveLoanProps {
    active_loans: ActiveLoan[];
    stats: {
        total_active: number;
        total_principal: number;
        total_due: number;
    };
}

export default function HRActiveLoan({ active_loans = [], stats = { total_active: 0, total_principal: 0, total_due: 0 } }: HRActiveLoanProps) {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'overdue'>('all');

    // Backend data ready - no mocks needed
    const displayLoans = Array.isArray(active_loans) ? active_loans : [];
    const displayStats = stats || { total_active: 0, total_principal: 0, total_due: 0 };

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

    const filteredLoans = (Array.isArray(active_loans) ? active_loans : []).filter(loan => {
        const matchesSearch = loan.member_name?.toLowerCase().includes(search.toLowerCase()) ||
                             loan.member_id?.includes(search);
        const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="HR Active Loans" />
            
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Stats Header */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-emerald-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800">Total Active Loans</CardTitle>
                            <Clock className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{displayStats.total_active || 0}</div>
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
            </div>
        </AppLayout>
    );
}
