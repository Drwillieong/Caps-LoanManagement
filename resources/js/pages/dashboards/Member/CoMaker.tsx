import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem, type CoMakerProps } from '@/types';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { canSendEmail } from '@/hooks/use-internet-check';
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
    Loader2,
    Mail,
    User,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Member Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Co-Maker Requests',
        href: '/dashboards/Member/CoMaker',
    },
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatCurrency(amount: number | string): string {
    if (amount === null || amount === undefined || amount === '') return '₱0.00';

    const number = typeof amount === 'string' ? Number(amount) : amount;

    if (isNaN(number)) return '₱0.00';

    return `₱${number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export default function CoMaker({ coMakerRequests }: CoMakerProps) {
    const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);

    async function handleResponse(loanId: number, action: 'accept' | 'reject') {
        if (processingAction) return;

        const actionKey = action === 'accept' ? 'approve' : 'reject';
        setProcessingAction(actionKey);

        const isConnected = await canSendEmail();

        if (!isConnected) {
            toast.error('No internet connection. The email notification cannot be sent, but your response will still be saved.');
        }

        router.post(
            '/dashboards/Member/CoMaker/Respond',
            {
                loan_id: loanId,
                action: action,
            },
            {
                onSuccess: () => {
                    setProcessingAction(null);
                    if (action === 'accept') {
                        toast.success('You have accepted the co-maker request!');
                    } else {
                        toast('You have declined the co-maker request.');
                    }
                },
                onError: (errors: Record<string, string>) => {
                    setProcessingAction(null);
                    console.error('Error responding to co-maker request:', errors);

                    if (!errors || Object.keys(errors).length === 0) {
                        toast.error('An unexpected error occurred. Please try again.');
                        return;
                    }

                    const errorMessages = Object.values(errors);
                    const errorMessage = errorMessages.length > 0
                        ? String(errorMessages[0])
                        : 'Failed to respond to co-maker request. Please try again.';
                    toast.error(errorMessage);
                },
            }
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Co-Maker Requests" />

            <div className="space-y-6 px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Co-Maker Requests</h1>
                        <p className="text-muted-foreground mt-1">
                            Review and respond to loan applications where you've been selected as co-maker
                        </p>
                    </div>
                    {coMakerRequests.length > 0 && (
                        <Badge variant="secondary" className="text-sm">
                            {coMakerRequests.length} Pending
                        </Badge>
                    )}
                </div>

                {coMakerRequests.length > 0 ? (
                    <div className="space-y-4">
                        {coMakerRequests.map((request) => {
                            const isProcessingThis = processingAction !== null;
                            const isApproveDisabled = processingAction !== null && processingAction !== 'approve';
                            const isRejectDisabled = processingAction !== null && processingAction !== 'reject';

                            return (
                                <Card key={request.id} className="overflow-hidden">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src="" alt={request.requester.name} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                                        {getInitials(request.requester.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-base font-semibold">
                                                        Loan Application from {request.requester.name}
                                                    </CardTitle>
                                                    <CardDescription className="flex items-center gap-1.5 mt-0.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        Requested on {formatDate(request.created_at)}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                                                <Clock className="h-3.5 w-3.5 mr-1" />
                                                Awaiting Response
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                    <UserCheck className="h-4 w-4 text-slate-500" />
                                                    Applicant Information
                                                </div>
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Name</span>
                                                        <span className="font-medium">{request.requester.name}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                                            <Mail className="h-3.5 w-3.5" />
                                                            Email
                                                        </span>
                                                        <span className="font-medium truncate max-w-[200px]">{request.requester.email}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                    <FileText className="h-4 w-4 text-slate-500" />
                                                    Loan Details
                                                </div>
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Loan Type</span>
                                                        <span className="font-medium">{request.loan_type_name}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Principal</span>
                                                        <span className="font-medium">{formatCurrency(request.principal_amount)}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Term</span>
                                                        <span className="font-medium">{request.terms_months} Months</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Interest</span>
                                                        <span className="font-medium">{formatCurrency(request.interest_amount)}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Total Payable</span>
                                                        <span className="font-semibold">{formatCurrency(request.total_amount_due)}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Monthly Payment</span>
                                                        <span className="font-semibold text-blue-600">
                                                            {formatCurrency(request.monthly_amortization)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="my-4" />

                                        <div className="flex flex-col-reverse sm:flex-row gap-3">
                                            <Button
                                                onClick={() => handleResponse(request.loan_id, 'reject')}
                                                variant="destructive"
                                                disabled={isProcessingThis || isRejectDisabled}
                                                className="flex-1 sm:flex-none"
                                            >
                                                {processingAction === 'reject' ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Rejecting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Decline Request
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => handleResponse(request.loan_id, 'accept')}
                                                disabled={isProcessingThis || isApproveDisabled}
                                                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                {processingAction === 'approve' ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Accepting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                        Accept Co-Maker Request
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <p className="text-xs text-muted-foreground text-center pt-1">
                                            By accepting, you agree to be responsible for this loan if the applicant defaults.
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pending Requests</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-sm">
                                You don't have any co-maker requests at the moment. When someone selects you as a co-maker, it will appear here.
                            </p>
                            <Link
                                href="/dashboards/Member/ApplyLoan"
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition"
                            >
                                Apply for a Loan
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </CardContent>
                    </Card>
                )}

                <Alert className="border-slate-200 bg-slate-50">
                    <AlertCircle className="h-4 w-4 text-slate-600" />
                    <AlertTitle className="font-semibold text-slate-900">What is a Co-Maker?</AlertTitle>
                    <AlertDescription className="text-sm text-slate-600 mt-1">
                        A co-maker is a person who agrees to be equally responsible for repaying the loan if the primary borrower defaults.
                        By accepting a co-maker request, you acknowledge this responsibility.
                    </AlertDescription>
                </Alert>
            </div>
        </AppLayout>
    );
}
