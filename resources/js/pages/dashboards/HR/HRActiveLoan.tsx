import { Head, Link } from '@inertiajs/react';
import { Clock, Eye, Filter, Printer, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { LoanTablePagination } from '@/components/loan-table-pagination';
import { LiveClock } from '@/components/live-clock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { ActiveLoan, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Active Loans', href: '/dashboards/HR/HRActiveLoan' }];

interface HRActiveLoanProps {
    active_loans: ActiveLoan[];
    stats: {
        total_active: number;
        total_principal: number;
        total_due: number;
    };
}

export default function HRActiveLoan({
    active_loans = [],
    stats = { total_active: 0, total_principal: 0, total_due: 0 },
}: HRActiveLoanProps) {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'overdue'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const displayLoans = Array.isArray(active_loans) ? active_loans : [];
    const displayStats = stats || { total_active: 0, total_principal: 0, total_due: 0 };

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount || 0);
    }

    function formatDate(dateStr: string): string {
        if (!dateStr) return '-';

        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    const filteredLoans = useMemo(
        () =>
            displayLoans.filter((loan) => {
                const term = search.toLowerCase();
                const matchesSearch = loan.member_name?.toLowerCase().includes(term) || loan.member_id?.toLowerCase().includes(term);
                const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;

                return matchesSearch && matchesStatus;
            }),
        [displayLoans, filterStatus, search],
    );
    const totalPages = Math.max(1, Math.ceil(filteredLoans.length / rowsPerPage));
    const paginatedLoans = filteredLoans.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus, rowsPerPage]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const statusClass = (status: string) =>
        status === 'overdue'
            ? 'rounded-full border-red-200 bg-red-50 px-2.5 text-red-700'
            : 'rounded-full border-emerald-200 bg-emerald-50 px-2.5 text-emerald-700';

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="HR Active Loans" />
            <style>{`
                @media print {
                    body { background: white !important; }
                    .no-print, nav, aside, header { display: none !important; }
                    .print-only { display: block !important; }
                    .print-area { padding: 0 !important; }
                    .print-card { border: 0 !important; box-shadow: none !important; }
                    .print-table { overflow: visible !important; border-color: #94a3b8 !important; }
                    .print-table table { width: 100% !important; border-collapse: collapse !important; font-size: 11px !important; }
                    .print-table th { background: #e2e8f0 !important; color: #0f172a !important; text-transform: uppercase !important; }
                    .print-table th, .print-table td { border: 1px solid #94a3b8 !important; padding: 6px !important; }
                }
            `}</style>

            <div className="print-area flex flex-1 flex-col gap-6 p-6">
                <div className="print-only hidden border-b border-slate-300 pb-4">
                    <h1 className="text-xl font-bold text-slate-950">CAPS Loan Management</h1>
                    <p className="text-sm text-slate-600">HR Active Loans Report</p>
                    <p className="text-xs text-slate-500">Date generated: {new Date().toLocaleString('en-PH')}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-slate-200 bg-white shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-700">Total Active Loans</CardTitle>
                            <Clock className="h-4 w-4 text-slate-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-950">{displayStats.total_active || 0}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-white shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-700">Total Principal</CardTitle>
                            <span className="text-xs font-semibold text-slate-500">PHP</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-950">{formatCurrency(displayStats.total_principal)}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-white shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-700">Total Due</CardTitle>
                            <span className="text-xs font-semibold text-slate-500">PHP</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-950">{formatCurrency(displayStats.total_due)}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="print-card border-slate-200 shadow-sm">
                    <CardHeader className="no-print flex flex-col gap-4 pb-4 lg:flex-row lg:items-center lg:justify-between">
                        <CardTitle className="text-lg font-bold text-slate-900">Active Loans</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <Input
                                placeholder="Search member ID or name..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-64 max-w-sm border-slate-300"
                            />
                            <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                                <Search className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setFilterStatus('all')}>
                                <Filter className="mr-1 h-4 w-4" />
                                All ({displayLoans.length})
                            </Button>
                            <Button size="sm" onClick={() => window.print()}>
                                <Printer className="mr-1 h-4 w-4" />
                                Print
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="print-table overflow-hidden rounded-md border border-slate-200">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-slate-200 bg-slate-100 hover:bg-slate-100">
                                        <TableHead className="w-16 font-bold uppercase tracking-wide text-slate-700">ID</TableHead>
                                        <TableHead className="font-bold uppercase tracking-wide text-slate-700">Member</TableHead>
                                        <TableHead className="font-bold uppercase tracking-wide text-slate-700">Type</TableHead>
                                        <TableHead className="text-right font-bold uppercase tracking-wide text-slate-700">Principal</TableHead>
                                        <TableHead className="w-20 text-right font-bold uppercase tracking-wide text-slate-700">Terms</TableHead>
                                        <TableHead className="text-right font-bold uppercase tracking-wide text-slate-700">Total Due</TableHead>
                                        <TableHead className="w-28 font-bold uppercase tracking-wide text-slate-700">Date</TableHead>
                                        <TableHead className="w-24 font-bold uppercase tracking-wide text-slate-700">Status</TableHead>
                                        <TableHead className="no-print w-32 font-bold uppercase tracking-wide text-slate-700">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedLoans.length > 0 ? (
                                        paginatedLoans.map((loan) => (
                                            <TableRow key={loan.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                                                <TableCell className="font-mono text-sm font-medium">{loan.member_id}</TableCell>
                                                <TableCell className="font-medium text-slate-900">{loan.member_name}</TableCell>
                                                <TableCell>{loan.loan_type}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(loan.principal)}</TableCell>
                                                <TableCell className="text-right">{loan.terms} mo</TableCell>
                                                <TableCell className="text-right font-mono font-semibold">{formatCurrency(loan.total_due)}</TableCell>
                                                <TableCell>{formatDate(loan.date)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={statusClass(loan.status)}>
                                                        {loan.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="no-print">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/dashboards/HR/active-loans/${loan.id}/view`}>
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-32 text-center">
                                                <div className="flex flex-col items-center gap-2 text-slate-500">
                                                    <Clock className="h-8 w-8 text-slate-300" />
                                                    <span className="font-medium">No active loans found</span>
                                                    <span className="text-sm">Try adjusting the search or filter.</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <LoanTablePagination
                            currentPage={currentPage}
                            rowsPerPage={rowsPerPage}
                            totalItems={filteredLoans.length}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={setRowsPerPage}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
