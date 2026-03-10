import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
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

    const loans = activeTab === 'approved' ? approvedLoans : disapprovedLoans;
    
    // Filter loans by search term
    const filteredLoans = loans.filter(loan => 
        loan.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.member.member_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loan_type_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    function formatCurrency(amount: number): string {
        const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `₱${num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function getStatusBadge(status: string) {
        const pendingCCReviewStatusMap: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
            'pending_cc_review': { variant: 'secondary', label: 'Pending CC Review' },
            'approved': { variant: 'default', label: 'Approved' },
            'released': { variant: 'default', label: 'Released' },
            'paid_off': { variant: 'outline', label: 'Paid Off' },
        };
        
        const rejectedByGMStatusMap: Record<string, { variant: 'destructive' | 'secondary'; label: string }> = {
            'rejected_by_gm': { variant: 'destructive', label: 'Rejected by GM' },
            'rejected': { variant: 'destructive', label: 'Rejected' },
        };
        
        const map = activeTab === 'approved' ? pendingCCReviewStatusMap : rejectedByGMStatusMap;
        const config = map[status] || { variant: 'secondary' as const, label: status };
        
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

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className={activeTab === 'approved' ? 'border-blue-500 border-2' : ''}>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                Pending CC Review
                            </CardDescription>
                            <CardTitle className="text-2xl">{totalApproved}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground">{formatCurrency(totalApprovedAmount)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                Rejected by GM
                            </CardDescription>
                            <CardTitle className="text-2xl">{totalDisapproved}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground">{formatCurrency(totalDisapprovedAmount)}</p>
                        </CardContent>
                    </Card>
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
                        Pending CC Review ({totalApproved})
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
                    <div className="border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Member ID</th>
                                    <th className="px-4 py-3 text-left font-medium">Member Name</th>
                                    <th className="px-4 py-3 text-left font-medium">Loan Type</th>
                                    <th className="px-4 py-3 text-left font-medium">Principal</th>
                                    <th className="px-4 py-3 text-left font-medium">Terms</th>
                                    <th className="px-4 py-3 text-left font-medium">Total Due</th>
                                    <th className="px-4 py-3 text-left font-medium">Date</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-right font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLoans.map((loanItem, index) => (
                                    <tr key={loanItem.id} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-muted/30'}`}>
                                        <td className="px-4 py-3 font-medium">{loanItem.member.member_id}</td>
                                        <td className="px-4 py-3">{loanItem.member.name}</td>
                                        <td className="px-4 py-3">{loanItem.loan_type_name}</td>
                                        <td className="px-4 py-3">{formatCurrency(loanItem.principal_amount)}</td>
                                        <td className="px-4 py-3">{loanItem.terms_months} mo</td>
                                        <td className="px-4 py-3">{formatCurrency(loanItem.total_amount_due)}</td>
                                        <td className="px-4 py-3">{formatDate(loanItem.created_at)}</td>
                                        <td className="px-4 py-3">{getStatusBadge(loanItem.status)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/dashboards/Gm/Loan/${loanItem.id}/viewDecision`}>
                                                <Button variant="outline" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                No {activeTab === 'approved' ? 'Pending CC Review' : 'Rejected by GM'} Loans
                            </h3>
                            <p className="text-sm text-muted-foreground text-center">
                                {searchTerm 
                                    ? 'No loans match your search criteria.' 
                                    : `There are no ${activeTab === 'approved' ? 'pending CC review' : 'rejected by GM'} loans in the history yet.`
                                }
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

