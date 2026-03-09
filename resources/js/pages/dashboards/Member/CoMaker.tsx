import { Head, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem, type CoMakerProps } from '@/types';
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
    DollarSign,
    Calendar,
    FileText,
    ArrowRight,
    AlertCircle
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

export default function CoMaker({ coMakerRequests }: CoMakerProps) {
    const form = useForm({
        loan_id: 0,
        action: '' as 'accept' | 'reject',
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

    function formatCurrency(amount: number | string): string {
        if (amount === null || amount === undefined || amount === '') return '₱0.00';

        const number = typeof amount === 'string' ? Number(amount) : amount;

        if (isNaN(number)) return '₱0.00';

        return `₱${number.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    // Handle accept/reject actions
    function handleResponse(loanId: number, action: 'accept' | 'reject') {
        router.post('/dashboards/Member/CoMaker/Respond', {
            loan_id: loanId,
            action: action,
        }, {
            onSuccess: () => {
                if (action === 'accept') {
                    toast.success('You have accepted the co-maker request!');
                } else {
                    toast('You have declined the co-maker request.');
                }
            },
            onError: (errors: Record<string, string>) => {
                console.error('Error responding to co-maker request:', errors);
                
                // Check if errors is empty or undefined
                if (!errors || Object.keys(errors).length === 0) {
                    toast.error('An unexpected error occurred. Please try again.');
                    return;
                }
                
                // Extract error message - Inertia returns errors as object { field: message }
                const errorMessages = Object.values(errors);
                const errorMessage = errorMessages.length > 0 
                    ? String(errorMessages[0]) 
                    : 'Failed to respond to co-maker request. Please try again.';
                toast.error(errorMessage);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Co-Maker Requests" />

            <div className="space-y-6 px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Co-Maker Requests</h1>
                        <p className="text-muted-foreground">
                            Review and respond to loan applications where you've been selected as co-maker
                        </p>
                    </div>
                  
                </div>

                {/* Pending Co-Maker Requests */}
                {coMakerRequests && coMakerRequests.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-500" />
                            <h2 className="text-lg font-semibold">
                                Pending Requests ({coMakerRequests.length})
                            </h2>
                        </div>

                        {coMakerRequests.map((request) => (
                            <Card key={request.id} className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                                <Users className="h-6 w-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100">
                                                    Loan Application from {request.requester.name}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    Requested on {formatDate(request.created_at)}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-yellow-500">Awaiting Response</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Requester Info */}
                                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-emerald-900">
                                                <UserCheck className="h-4 w-4 text-emerald-600" />
                                                Applicant Information
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Name:</span>
                                                    <span className="ml-2 font-medium">{request.requester.name}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Email:</span>
                                                    <span className="ml-2">{request.requester.email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Loan Details */}
                                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-emerald-900">
                                                <FileText className="h-4 w-4 text-emerald-600" />
                                                Loan Details
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Loan Type</p>
                                                    <p className="font-semibold">{request.loan_type_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Principal</p>
                                                    <p className="font-semibold">{formatCurrency(request.principal_amount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Term</p>
                                                    <p className="font-semibold">{request.terms_months} Months</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Interest</p>
                                                    <p className="font-semibold">{formatCurrency(request.interest_amount)}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Total Payable</p>
                                                    <p className="font-semibold text-lg">{formatCurrency(request.total_amount_due)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Monthly Payment</p>
                                                    <p className="font-semibold text-lg text-blue-600">
                                                        {formatCurrency(request.monthly_amortization)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                            <Button
                                                onClick={() => handleResponse(request.loan_id, 'accept')}
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Accept Co-Maker Request
                                            </Button>
                                            <Button
                                                onClick={() => handleResponse(request.loan_id, 'reject')}
                                                variant="destructive"
                                                className="flex-1"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Decline Request
                                            </Button>
                                        </div>

                                        <p className="text-xs text-muted-foreground text-center">
                                            By accepting, you agree to be responsible for this loan if the applicant defaults.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Requests</h3>
                            <p className="text-gray-500 text-center mb-6">
                                You don't have any co-maker requests at the moment.
                            </p>
                            <Link
                                href="/dashboards/Member/ApplyLoan"
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white hover:opacity-90 transition"
                            >
                                Apply for a Loan
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Info Card */}
                <Card className="border-emerald-100 bg-emerald-50">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-emerald-800">What is a Co-Maker?</h4>
                                <p className="text-sm text-emerald-700 mt-1">
                                    A co-maker is a person who agrees to be equally responsible for repaying the loan if the primary borrower defaults. 
                                    By accepting a co-maker request, you acknowledge this responsibility.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
