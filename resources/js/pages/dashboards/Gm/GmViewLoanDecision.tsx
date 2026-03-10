import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { 
    UserCheck,
    FileText,
    Users,
    History,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Calendar,
    DollarSign,
    Building2,
    Mail
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
   
    {
        title: 'Approved & Disapproved History',
        href: '/dashboards/Gm/ApprovedLoan',
    },
    {
        title: 'Loan Decision Details',
        href: '#',
    },
];

interface LoanMember {
    id: number;
    name: string;
    email: string;
    member_id: string;
    date_hired?: string;
    basic_salary: number;
    share_capital_balance: number;
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
    co_makers: Array<{
        id: number;
        name: string;
        email: string;
        status: string;
    }>;
    past_loans: Array<{
        id: number;
        loan_type_name: string;
        principal_amount: number;
        total_amount_due: number;
        balance: number;
        status: string;
        release_date?: string;
        terms_months: number;
    }>;
    active_loans_count: number;
}

interface GmViewLoanDecisionProps {
    loan: Loan;
}

export default function GmViewLoanDecision() {
    const props = usePage().props as unknown as GmViewLoanDecisionProps;
    const loan = props.loan;

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
        const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            'pending_gm_review': { variant: 'secondary', label: 'Pending GM Review' },
            'pending_cc_review': { variant: 'secondary', label: 'Pending CC Review' },
            'approved': { variant: 'default', label: 'Approved' },
            'rejected': { variant: 'destructive', label: 'Rejected' },
            'rejected_by_gm': { variant: 'destructive', label: 'Rejected by GM' },
            'rejected_by_credit_com': { variant: 'destructive', label: 'Rejected by Credit Com' },
            'released': { variant: 'default', label: 'Released' },
            'paid_off': { variant: 'outline', label: 'Paid Off' },
        };
        
        const config = statusMap[status] || { variant: 'secondary' as const, label: status };
        
        return (
            <Badge variant={config.variant}>
                {config.label}
            </Badge>
        );
    }

    function getDecisionBadge() {
        const isApproved = ['approved', 'released', 'paid_off'].includes(loan.status);
        
        if (isApproved) {
            return (
                <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Approved by GM</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Rejected by GM</span>
                </div>
            );
        }
    }

    function getPastLoanStatusBadge(status: string) {
        const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            'approved': { variant: 'outline', label: 'Approved' },
            'released': { variant: 'default', label: 'Released' },
            'paid_off': { variant: 'default', label: 'Paid Off' },
        };
        
        const config = statusMap[status] || { variant: 'secondary' as const, label: status };
        
        return (
            <Badge variant={config.variant} className="text-xs">
                {config.label}
            </Badge>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Loan Decision Details - GM" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Loan Decision Details</h1>
                        <p className="text-muted-foreground text-sm">
                            View details of loan application decision made by GM
                        </p>
                    </div>
                    <Link
                        href="/dashboards/Gm/ApprovedLoan"
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to History
                    </Link>
                </div>

                {/* Decision Status */}
                <Card className={['approved', 'released', 'paid_off'].includes(loan.status) ? 'border-green-500' : 'border-red-500'}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {['approved', 'released', 'paid_off'].includes(loan.status) ? (
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                ) : (
                                    <XCircle className="h-8 w-8 text-red-600" />
                                )}
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {loan.loan_type_name}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Applied on {formatDate(loan.created_at)}
                                    </p>
                                </div>
                            </div>
                            {getStatusBadge(loan.status)}
                        </div>
                        
                        {loan.remarks && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-medium">GM Decision Remarks:</p>
                                <p className="text-sm text-muted-foreground mt-1">{loan.remarks}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Separator />

                {/* Member Information */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Member Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Member ID</p>
                                <p className="font-medium">{loan.member.member_id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Name</p>
                                <p className="font-medium">{loan.member.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-medium">{loan.member.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Date Hired</p>
                                <p className="font-medium">{loan.member.date_hired || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Basic Salary</p>
                                <p className="font-medium">{formatCurrency(loan.member.basic_salary)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Share Capital</p>
                                <p className="font-medium">{formatCurrency(loan.member.share_capital_balance)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Loan Details */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Loan Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Principal</p>
                                <p className="font-medium">{formatCurrency(loan.principal_amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Term</p>
                                <p className="font-medium">{loan.terms_months} Months</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Interest</p>
                                <p className="font-medium">{formatCurrency(loan.interest_amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Monthly Payment</p>
                                <p className="font-medium">{formatCurrency(loan.monthly_amortization)}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Payable</p>
                                <p className="font-medium text-base">{formatCurrency(loan.total_amount_due)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Active Loans</p>
                                <p className="font-medium text-base">{loan.active_loans_count}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Co-Maker Details */}
                {loan.co_makers && loan.co_makers.length > 0 && (
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Co-Maker{loan.co_makers.length > 1 ? 's' : ''}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {loan.co_makers.map((coMaker) => (
                                    <div key={coMaker.id} className="flex items-center gap-2 p-2 rounded-md border">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{coMaker.name}</p>
                                            <p className="text-xs text-muted-foreground">{coMaker.email}</p>
                                        </div>
                                        <span className={`text-xs ${coMaker.status === 'accepted' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                            {coMaker.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Past Loans History */}
                {loan.past_loans && loan.past_loans.length > 0 && (
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Loan History ({loan.past_loans.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium">Type</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium">Principal</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium">Terms</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium">Balance</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium">Status</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium">Released</th>
                                        </tr>
</thead>
                                    <tbody>
                                        {loan.past_loans.map((pastLoan) => (
                                            <tr key={pastLoan.id} className="border-t">
                                                <td className="px-3 py-2">{pastLoan.loan_type_name}</td>
                                                <td className="px-3 py-2">{formatCurrency(pastLoan.principal_amount)}</td>
                                                <td className="px-3 py-2">{pastLoan.terms_months} mo</td>
                                                <td className="px-3 py-2">{formatCurrency(pastLoan.balance)}</td>
                                                <td className="px-3 py-2">{getPastLoanStatusBadge(pastLoan.status)}</td>
                                                <td className="px-3 py-2">{pastLoan.release_date || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {loan.past_loans && loan.past_loans.length === 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">No previous loan history for this member.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

