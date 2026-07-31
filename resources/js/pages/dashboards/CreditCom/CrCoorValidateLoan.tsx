import { Head, useForm, Link } from '@inertiajs/react';
import React, { useState, ChangeEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem, type GmValidateLoanProps, type GmPendingLoan } from '@/types';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Users, 
    UserCheck, 
    Clock, 
    CheckCircle2, 
    XCircle,
    Calendar,
    FileText,
    ArrowRight,
    AlertCircle,
    Building2,
    Mail,
    Phone,
    History,
    Shield,
    Loader2
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Loan Applications', href: '/dashboards/CreditCom/LoanApplication' },
    {
        title: 'Validate Loan Application',
        href: '/dashboards/CreditCom/ValidateLoan',
    },
];

export default function CrCoorValidateLoan({ pendingLoans }: React.PropsWithChildren<GmValidateLoanProps>): React.ReactElement {
    const [selectedLoan, setSelectedLoan] = useState<GmPendingLoan | null>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState<boolean>(false);
    const [processingAction, setProcessingAction] = useState<"approve" | "reject" | null>(null);

    const approveForm = useForm({
        remarks: '',
    });

    const rejectForm = useForm({
        remarks: '',
    });

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
            'pending_cc_review': { variant: 'secondary', label: 'Pending CC Review' },
            'endorsed_by_gm': { variant: 'secondary', label: 'Endorsed by GM' },
            'pending_gm_review': { variant: 'secondary', label: 'Pending GM Review' },
            'approved': { variant: 'default', label: 'Approved' },
            'rejected': { variant: 'destructive', label: 'Rejected' },
            'rejected_by_co_maker': { variant: 'destructive', label: 'Rejected by Co-Maker' },
            'rejected_by_gm': { variant: 'destructive', label: 'Rejected by GM' },
            'rejected_by_credit_com': { variant: 'destructive', label: 'Rejected by Credit Com' },
            'released': { variant: 'default', label: 'Released' },
            'paid_off': { variant: 'default', label: 'Paid Off' },
            'awaiting_comaker': { variant: 'secondary', label: 'Awaiting Co-Maker' },
            'accepted': { variant: 'default', label: 'Accepted' },
        };
        
        const config = statusMap[status] || { variant: 'secondary' as const, label: status };
        
        return (
            <Badge variant={config.variant}>
                {config.label}
            </Badge>
        );
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

    function handleApprove(loanId: number) {
        setProcessingAction("approve");

        approveForm.post(`/dashboards/CreditCom/Loan/${loanId}/approve`, {
            onSuccess: () => {
                toast.success('Loan application approved successfully!');
            },
            onError: (errors: Record<string, string>) => {
                console.error('Error approving loan:', errors);
                toast.error('Failed to approve loan. Please try again.');
            },
            onFinish: () => {
                setProcessingAction(null);
            },
        });
    }

    function handleReject(loanId: number) {
        setProcessingAction("reject");

        rejectForm.post(`/dashboards/CreditCom/Loan/${loanId}/reject`, {
            onSuccess: () => {
                toast.success('Loan application rejected.');
                setIsRejectDialogOpen(false);
                setSelectedLoan(null);
                rejectForm.reset();
            },
            onError: (errors: Record<string, string>) => {
                console.error('Error rejecting loan:', errors);
                toast.error('Failed to reject loan. Please try again.');
            },
            onFinish: () => {
                setProcessingAction(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Validate Loan Application - Credit Coordinator" />

            <div className="space-y-6 px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Loan Application Review</h1>
                        <p className="text-muted-foreground text-sm">
                            Review and validate loan applications from members
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition"
                    >
                        Back 
                    </Link>
                </div>

                {/* Pending Loans Count */}
                <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        {pendingLoans.length} Pending Application{pendingLoans.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <Separator />

                {/* Pending Loan Applications */}
                {pendingLoans && pendingLoans.length > 0 ? (
                    <div className="space-y-6">
{pendingLoans.map((loan: GmPendingLoan) => (
                            <Card key={loan.id} className="shadow-sm">
                                <CardHeader className="pb-4 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">
                                                    {loan.loan_type_name}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2 text-xs">
                                                    <Calendar className="h-3 w-3" />
                                                    Applied {formatDate(loan.created_at)}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        {getStatusBadge(loan.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-5">
                                        {/* Member Information */}
                                        <div>
                                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                <UserCheck className="h-4 w-4" />
                                                Member Information
                                            </h4>
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
                                        </div>

                                        <Separator />

                                        {/* Loan Details */}
                                        <div>
                                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Loan Details
                                            </h4>
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
                                        </div>

                                        <Separator />

                                        {/* Co-Maker Details */}
                                        {loan.co_makers && loan.co_makers.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Co-Maker{loan.co_makers.length > 1 ? 's' : ''}
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {loan.co_makers.map((coMaker: any) => (
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
                                            </div>
                                        )}

                                        {/* Past Loans History */}
                                        {loan.past_loans && loan.past_loans.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                    <History className="h-4 w-4" />
                                                    Loan History ({loan.past_loans.length})
                                                </h4>
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
                                                            {loan.past_loans.map((pastLoan: any) => (
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
                                            </div>
                                        )}

                                        {loan.past_loans && loan.past_loans.length === 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                    <History className="h-4 w-4" />
                                                    Loan History
                                                </h4>
                                                <p className="text-sm text-muted-foreground">No previous loan history for this member.</p>
                                            </div>
                                        )}

                                        <Separator />

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Button
                                                onClick={() => handleApprove(loan.id)}
                                                className="flex-1"
                                                disabled={processingAction !== null}
                                            >
                                                {processingAction === "approve" ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                )}
                                                {processingAction === "approve" ? "Accepting..." : "Approve Application"}
                                            </Button>
                                            
                                            <Dialog open={isRejectDialogOpen && selectedLoan?.id === loan.id} onOpenChange={(open: boolean) => {
                                                setIsRejectDialogOpen(open);
                                                if (!open) setSelectedLoan(null);
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => {
                                                            if (processingAction) return;
                                                            setSelectedLoan(loan);
                                                            setIsRejectDialogOpen(true);
                                                        }}
                                                        disabled={processingAction !== null}
                                                    >
                                                        {processingAction === "reject" ? (
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 mr-2" />
                                                        )}
                                                        {processingAction === "reject" ? "Rejecting..." : "Reject Application"}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Reject Loan Application</DialogTitle>
                                                        <DialogDescription>
                                                            Please provide a reason for rejecting this loan application for {loan.member.name}.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <Label htmlFor="remarks">Rejection Reason *</Label>
                                                        <Input
                                                            id="remarks"
                                                            placeholder="Enter reason for rejection..."
                                                            value={rejectForm.data.remarks}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) => rejectForm.setData('remarks', e.target.value)}
                                                            className="mt-2"
                                                        />
                                                        {rejectForm.errors.remarks && (
                                                            <p className="text-sm text-red-500 mt-1">{rejectForm.errors.remarks}</p>
                                                        )}
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => {
                                                            setIsRejectDialogOpen(false);
                                                            setSelectedLoan(null);
                                                        }}>
                                                            Cancel
                                                        </Button>
                                                        <Button 
                                                            variant="destructive"
                                                            onClick={() => handleReject(loan.id)}
                                                            disabled={!rejectForm.data.remarks.trim() || processingAction !== null}
                                                        >
                                                            {processingAction === "reject" ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Rejecting...
                                                                </>
                                                            ) : (
                                                                "Confirm Rejection"
                                                            )}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">All Caught Up</h3>
                            <p className="text-sm text-muted-foreground text-center mb-6">
                                There are no pending loan applications to review at this time.
                            </p>
                            <Link
                                href="/dashboards/CreditCom/CreditComDashboard"
                                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white hover:opacity-90 transition"
                            >
                                Return to Dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Info Card */}
                <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-sm">Review Guidelines</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Please review all member details, loan terms, co-maker information, and past loan history before making a decision. Ensure all requirements are met before approval.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
