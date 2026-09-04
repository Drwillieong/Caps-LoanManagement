import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { LoanTablePagination } from '@/components/loan-table-pagination';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Input } from "@/components/ui/input";
import { 
    CheckCircle2,
    XCircle,
    Search,
    Ban
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'GM Loan Decision History',
        href: '/dashboards/Gm/ApprovedLoan',
    },
];

const PAGE_SIZE = 10;

interface LoanMember {
    id: number;
    name: string;
    email: string;
    member_id: string;
}

interface Loan {
    id: number;
    loan_type_name: string;
    principal_amount: number;
    terms_months: number;
    interest_amount: number;
    total_amount_due: number;
    monthly_amortization: number;
    status: string;
    created_at: string;
    release_date?: string;
    remarks?: string;
    member: LoanMember;
}

interface GmApprovedLoanProps {
    approvedLoans: Loan[];
    disapprovedLoans: Loan[];
}

export default function ApprovedLoan() {
    const props = usePage().props as unknown as GmApprovedLoanProps;
    const approvedLoans = props.approvedLoans || [];
    const disapprovedLoans = props.disapprovedLoans || [];
    
    const [activeTab, setActiveTab] = useState<'approved' | 'disapproved'>('approved');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const loans = activeTab === 'approved' ? approvedLoans : disapprovedLoans;
    const filteredLoans = useMemo(
        () =>
            loans.filter((loan) => {
                const term = searchTerm.toLowerCase();
                return (
                    loan.member.name.toLowerCase().includes(term) ||
                    loan.member.member_id.toLowerCase().includes(term) ||
                    loan.loan_type_name.toLowerCase().includes(term)
                );
            }),
        [loans, searchTerm],
    );
    const totalPages = Math.max(1, Math.ceil(filteredLoans.length / rowsPerPage));
    const paginatedLoans = filteredLoans.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    useEffect(() => setCurrentPage(1), [activeTab, searchTerm, rowsPerPage]);
    useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    function formatCurrency(amount: number): string {
        return `₱${(amount || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function getStatusBadge(status: string) {
        const statusMap: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
            pending_cc_review: { variant: 'secondary', label: 'Pending CC Review' },
            approved: { variant: 'default', label: 'Approved' },
            released: { variant: 'default', label: 'Released' },
            paid_off: { variant: 'outline', label: 'Paid Off' },
            rejected_by_gm: { variant: 'destructive', label: 'Rejected by GM' },
            rejected: { variant: 'destructive', label: 'Rejected' },
        };
        const config = statusMap[status] || { variant: 'secondary' as const, label: status };

        return (
            <Badge variant={config.variant}>
                {config.label}
            </Badge>
        );
    }

    // Calculate stats
    const totalApproved = approvedLoans.length;
    const totalDisapproved = disapprovedLoans.length;
    const totalApprovedAmount = approvedLoans.reduce((sum, loan) => sum + loan.principal_amount, 0);
    const totalDisapprovedAmount = disapprovedLoans.reduce((sum, loan) => sum + loan.principal_amount, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Approved & Disapproved History - GM" />

            <div className="space-y-6 px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Loan Decision History</h1>
                        <p className="text-muted-foreground text-sm">
                            View all approved and disapproved loan applications
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b">
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                            activeTab === 'approved' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Pending CC Review & Approved ({totalApproved})
                    </button>
                    <button
                        onClick={() => setActiveTab('disapproved')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                            activeTab === 'disapproved' 
                            ? 'border-red-600 text-red-600' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Ban className="h-4 w-4" />
                        Rejected by GM ({totalDisapproved})
                    </button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by member name, ID, or loan type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <Separator />

                {/* Table */}
{filteredLoans.length > 0 ? (
                    <div className="space-y-4">
                        <div className="rounded-md border border-emerald-100 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-emerald-200">
                                        <TableHead className="w-16 font-semibold text-emerald-800">Member ID</TableHead>
                                        <TableHead className="font-semibold text-emerald-800">Member Name</TableHead>
                                        <TableHead className="font-semibold text-emerald-800">Loan Type</TableHead>
                                        <TableHead className="font-semibold text-emerald-800 text-right">Principal</TableHead>
                                        <TableHead className="w-20 font-semibold text-emerald-800 text-right">Terms</TableHead>
                                        <TableHead className="font-semibold text-emerald-800 text-right">Total Due</TableHead>
                                        <TableHead className="w-28 font-semibold text-emerald-800">Date</TableHead>
                                        <TableHead className="w-24 font-semibold text-emerald-800">Status</TableHead>
                                        <TableHead className="w-24 font-semibold text-emerald-800 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedLoans.map((loanItem) => (
                                        <TableRow key={loanItem.id} className="hover:bg-emerald-50/50 border-b border-emerald-50 transition-colors">
                                            <TableCell className="font-mono text-sm font-medium">{loanItem.member.member_id}</TableCell>
                                            <TableCell className="font-medium">{loanItem.member.name}</TableCell>
                                            <TableCell>{loanItem.loan_type_name}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(loanItem.principal_amount)}</TableCell>
                                            <TableCell className="text-right">{loanItem.terms_months} mo</TableCell>
                                            <TableCell className="text-right font-mono font-semibold">{formatCurrency(loanItem.total_amount_due)}</TableCell>
                                            <TableCell>{formatDate(loanItem.created_at)}</TableCell>
                                            <TableCell>{getStatusBadge(loanItem.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/dashboards/Gm/Loan/${loanItem.id}/viewDecision`}>
                                                    <Button variant="outline" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            {activeTab === 'approved' ? (
                                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                            ) : (
                                <Ban className="h-12 w-12 text-muted-foreground mb-4" />
                            )}
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                No {activeTab === 'approved' ? 'Pending CC Review & Approved' : 'Rejected by GM'} Loans
                            </h3>
                            <p className="text-sm text-muted-foreground text-center">
                                {searchTerm 
                                    ? 'No loans match your search criteria.' 
                                    : `There are no ${activeTab === 'approved' ? 'pending CC review or approved' : 'rejected by GM'} loans in the history yet.`
                                }
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}