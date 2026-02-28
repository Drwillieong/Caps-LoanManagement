import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem, type GmLoanApplicationProps } from '@/types';

import { 
    Clock, 
    ArrowRight,
    CheckCircle2,
    FileText,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
   
    { title: 'Loan Applications', href: '/dashboards/Gm/LoanApplication' },
];

export default function LoanApplication({ pendingLoans }: GmLoanApplicationProps) {

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    function formatCurrency(amount: number): string {
        return `₱${amount.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function getStatusConfig(status: string) {
        const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            pending_gm_review:  { variant: 'secondary',    label: 'Pending Review' },
            approved:           { variant: 'default',      label: 'Approved' },
            rejected:           { variant: 'destructive',  label: 'Rejected' },
            released:           { variant: 'default',      label: 'Released' },
            paid_off:           { variant: 'outline',      label: 'Paid Off' },
            awaiting_comaker:   { variant: 'secondary',    label: 'Awaiting Co-Maker' },
            accepted:           { variant: 'default',      label: 'Accepted' },
        };
        return map[status] ?? { variant: 'outline' as const, label: status.replace(/_/g, ' ') };
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Loan Applications – GM" />

            <div className="space-y-6 px-4 sm:px-6 py-6 max-w-screen-2xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Loan Applications</h1>
                        <p className="text-muted-foreground mt-1">
                            Review and validate pending member loan requests
                        </p>
                    </div>

                  
                </div>

                <Separator />

                {/* Summary */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                        {pendingLoans.length} pending application{pendingLoans.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Table / Empty State */}
                {pendingLoans.length > 0 ? (
                    <Card className="shadow-sm border">
                        <CardHeader className="pb-4">
                            <CardTitle>Pending Applications</CardTitle>
                            <CardDescription>
                                Click any row to view full details and take action
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead className="bg-muted/60 border-b sticky top-0">
                                        <tr>
                                            <th className="w-14 px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                #
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Loan Type
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
                                                Member
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Member ID
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Principal
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Terms
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Applied
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="w-32 px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-border">
                                        {pendingLoans.map((loan, index) => (
                                            <tr 
                                                key={loan.id}
                                                className={cn(
                                                    "group hover:bg-muted/40 transition-colors",
                                                    "focus-within:bg-muted/30 focus-within:ring-1 focus-within:ring-ring"
                                                )}
                                            >
                                                <td className="px-4 py-4 text-sm text-muted-foreground font-medium">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-4 font-medium">
                                                    {loan.loan_type_name}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {loan.member.name}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                                    {loan.member.member_id}
                                                </td>
                                                <td className="px-4 py-4 text-right font-medium tabular-nums">
                                                    {formatCurrency(loan.principal_amount)}
                                                </td>
                                                <td className="px-4 py-4 text-center text-sm">
                                                    {loan.terms_months} mo
                                                </td>
                                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                                    {formatDate(loan.created_at)}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {(() => {
                                                        const { variant, label } = getStatusConfig(loan.status);
                                                        return <Badge variant={variant}>{label}</Badge>;
                                                    })()}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        className="gap-1.5"
                                                        asChild
                                                    >
                                                        <Link href={`/dashboards/Gm/Loan/${loan.id}/view`}>
                                                            View
                                                            <ArrowRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed bg-muted/30">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="rounded-full bg-muted p-4 mb-6">
                                <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No Pending Applications</h3>
                            <p className="text-muted-foreground max-w-md mb-8">
                                There are currently no loan applications awaiting General Manager review.
                            </p>
                            <Button asChild>
                                <Link href="/dashboard">
                                    Return to Dashboard
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}