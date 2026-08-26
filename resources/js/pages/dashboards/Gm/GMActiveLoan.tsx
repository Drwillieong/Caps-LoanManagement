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

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Active Loans', href: '/dashboards/Gm/GMActiveLoan' }];

interface GMActiveLoanProps {
    active_loans: ActiveLoan[];
    stats: {
        total_active: number;
        total_principal: number;
        total_due: number;
    };
}

export default function GMActiveLoan({
    active_loans = [],
    stats = { total_active: 0, total_principal: 0, total_due: 0 },
}: GMActiveLoanProps) {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'overdue'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const displayLoans = Array.isArray(active_loans) ? active_loans : [];

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount || 0);
    }

    function formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    const filteredLoans = useMemo(
        () =>
            displayLoans.filter((loan) => {
                const term = search.toLowerCase();
                const matchesSearch = loan.member_name.toLowerCase().includes(term) || loan.member_id.toLowerCase().includes(term);
                const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;

                return matchesSearch && matchesStatus;
            }),
        [displayLoans, filterStatus, search],
    );
    const totalPages = Math.max(1, Math.ceil(filteredLoans.length / rowsPerPage));
    const paginatedLoans = filteredLoans.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    useEffect(() => setCurrentPage(1), [search, filterStatus, rowsPerPage]);
    useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

    const statusClass = (status: string) =>
        status === 'overdue'
            ? 'rounded-full border-red-200 bg-red-50 px-2.5 text-red-700'
            : 'rounded-full border-emerald-200 bg-emerald-50 px-2.5 text-emerald-700';

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="GM Active Loans" />
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
                    .print-table { display: block !important; }
                }
            `}</style>

            <div className="print-area flex flex-1 flex-col gap-6 p-6">
                <div className="print-only hidden border-b border-slate-300 pb-4">
                    <h1 className="text-xl font-bold text-slate-950">CAPS Loan Management</h1>
                    <p className="text-sm text-slate-600">GM Active Loans Report</p>
                    <p className="text-xs text-slate-500">Date generated: {new Date().toLocaleString('en-PH')}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        ['Total Active Loans', stats.total_active, <Clock key="clock" className="h-4 w-4 text-slate-500" />],
                        ['Total Principal', formatCurrency(stats.total_principal), <span key="php" className="text-xs font-semibold text-slate-500">PHP</span>],
                        ['Total Due', formatCurrency(stats.total_due), <span key="php2" className="text-xs font-semibold text-slate-500">PHP</span>],
                    ].map(([label, value, icon]) => (
                        <Card key={String(label)} className="border-slate-200 bg-white shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-700">{label}</CardTitle>
                                {icon}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-950">{value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="print-card border-slate-200 shadow-sm">
                    <CardHeader className="no-print flex flex-col gap-4 pb-4 lg:flex-row lg:items-center lg:justify-between">
                        <CardTitle className="text-lg font-bold text-slate-900">Active Loans</CardTitle>
                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                            <Input placeholder="Search member ID or name..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full border-slate-300 sm:w-64 sm:max-w-sm" />
                            <Button variant="outline" size="sm" onClick={() => setSearch('')} className="min-h-[44px] sm:min-h-9">
                                <Search className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setFilterStatus('all')} className="min-h-[44px] sm:min-h-9">
                                <Filter className="mr-1 h-4 w-4" />
                                All ({displayLoans.length})
                            </Button>
                            <Button size="sm" onClick={() => window.print()} className="min-h-[44px] sm:min-h-9">
                                <Printer className="mr-1 h-4 w-4" />
                                Print
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Mobile card list (visible below md) */}
                        <div className="space-y-4 md:hidden">
                            {paginatedLoans.length > 0 ? (
                                paginatedLoans.map((loan) => (
                                    <div key={loan.id} className="no-print rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">{loan.member_name}</p>
                                                <p className="mt-0.5 text-xs text-slate-500">{loan.member_id}</p>
                                            </div>
                                            <Badge variant="outline" className={`${statusClass(loan.status)} shrink-0`}>
                                                {loan.status}
                                            </Badge>
                                        </div>

                                        <dl className="mt-3 space-y-1.5 text-sm">
                                            <div className="flex justify-between gap-4">
                                                <dt className="text-slate-500">Type</dt>
                                                <dd className="text-right text-slate-900">{loan.loan_type}</dd>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <dt className="text-slate-500">Principal</dt>
                                                <dd className="text-right font-mono text-slate-900">{formatCurrency(loan.principal)}</dd>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <dt className="text-slate-500">Terms</dt>
                                                <dd className="text-right text-slate-900">{loan.terms} mo</dd>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <dt className="text-slate-500">Total Due</dt>
                                                <dd className="text-right font-mono font-semibold text-slate-900">{formatCurrency(loan.total_due)}</dd>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <dt className="text-slate-500">Date</dt>
                                                <dd className="text-right text-slate-900">{formatDate(loan.date)}</dd>
                                            </div>
                                        </dl>

                                        <div className="mt-4">
                                            <Button variant="outline" size="sm" asChild className="min-h-[44px] w-full">
                                                <Link href={`/dashboards/Gm/active-loans/${loan.id}/view`}>
                                                    <Eye className="h-4 w-4" />
                                                    View Details
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-500">
                                    <p className="text-sm font-medium">No active loans found</p>
                                    <p className="text-xs">Try adjusting the search or filter.</p>
                                </div>
                            )}
                        </div>

                        {/* Table (visible at md and above) */}
                        <div className="print-table hidden overflow-hidden rounded-md border border-slate-200 md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-slate-200 bg-slate-100 hover:bg-slate-100">
                                        {['ID', 'Member', 'Type', 'Principal', 'Terms', 'Total Due', 'Date', 'Status', 'Action'].map((head) => (
                                            <TableHead key={head} className={`${['Principal', 'Terms', 'Total Due'].includes(head) ? 'text-right ' : ''}${head === 'Action' ? 'no-print ' : ''}font-bold uppercase tracking-wide text-slate-700`}>
                                                {head}
                                            </TableHead>
                                        ))}
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

                        <LoanTablePagination currentPage={currentPage} rowsPerPage={rowsPerPage} totalItems={filteredLoans.length} onPageChange={setCurrentPage} onRowsPerPageChange={setRowsPerPage} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
