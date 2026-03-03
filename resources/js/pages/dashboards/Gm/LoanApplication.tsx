import { Head, Link } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem, type GmLoanApplicationProps } from '@/types';

import {
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
    const map: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      pending_gm_review: { variant: 'secondary', label: 'Pending Review' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      released: { variant: 'default', label: 'Released' },
      paid_off: { variant: 'outline', label: 'Paid Off' },
      awaiting_comaker: { variant: 'secondary', label: 'Awaiting Co-Maker' },
      accepted: { variant: 'default', label: 'Accepted' },
    };

    return map[status] ?? {
      variant: 'outline' as const,
      label: status.replace(/_/g, ' '),
    };
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
      <Head title="Loan Applications – GM" />

      <div className="space-y-6 px-4 sm:px-6 py-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Loan Applications
          </h1>
          <p className="text-muted-foreground">
            Review and validate member loan requests awaiting GM approval
          </p>
        </div>

        <Separator />

        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {pendingLoans.length} pending application
            {pendingLoans.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Content */}
        {pendingLoans.length > 0 ? (
          <Card className="shadow-sm border">
            <CardHeader className="pb-4">
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>
                Select an application to review full details and take action
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-muted/60 border-b">
                    <tr>
                      <th className="w-14 px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Loan Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase min-w-[180px]">
                        Member
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Member ID
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                        Principal
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                        Terms
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Applied
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="w-32 px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {pendingLoans.map((loan, index) => {
                      const { variant, label } = getStatusConfig(loan.status);

                      return (
                        <tr
                          key={loan.id}
                          className={cn(
                            'group hover:bg-muted/40 transition-colors',
                            'focus-within:bg-muted/30 focus-within:ring-1 focus-within:ring-ring'
                          )}
                        >
                          <td className="px-4 py-4 text-sm text-muted-foreground">
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
                            <Badge variant={variant}>{label}</Badge>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                href={`/dashboards/Gm/Loan/${loan.id}/view`}
                                className="inline-flex items-center gap-1.5"
                              >
                                View
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* EMPTY STATE – WIDE CARD */
          <Card className="border-dashed bg-muted/30 w-full max-w-7xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-full max-w-3xl flex flex-col items-center">
                <div className="rounded-full bg-muted p-4 mb-6">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                </div>

                <h3 className="text-2xl font-semibold mb-3">
                  No Pending Applications
                </h3>

                <p className="text-muted-foreground max-w-xl mb-10">
                  There are currently no loan applications awaiting General
                  Manager review.
                </p>

                <Button
                  asChild
                  size="lg"
                  className="min-w-[300px] h-12 text-base font-semibold"
                >
                  <Link href="/dashboards/Gm">
                    Return to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}