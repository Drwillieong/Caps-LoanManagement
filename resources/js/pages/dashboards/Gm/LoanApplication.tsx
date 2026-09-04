import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { LoanTablePagination } from '@/components/loan-table-pagination';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { type BreadcrumbItem, type GmLoanApplicationProps } from '@/types';

import {
  Clock,
  CheckCircle2,
  Search,
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Loan Applications', href: '/dashboards/Gm/LoanApplication' },
];

export default function LoanApplication({ pendingLoans }: GmLoanApplicationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredLoans = useMemo(
    () =>
      pendingLoans.filter((loan) => {
        const term = searchTerm.toLowerCase();
        return (
          loan.member.name.toLowerCase().includes(term) ||
          loan.member.member_id.toLowerCase().includes(term) ||
          loan.loan_type_name.toLowerCase().includes(term)
        );
      }),
    [pendingLoans, searchTerm],
  );
  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / rowsPerPage));
  const paginatedLoans = filteredLoans.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => setCurrentPage(1), [searchTerm, rowsPerPage]);
  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

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

  function getStatusConfig(status: string) {
    const map: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      pending_gm_review: { variant: 'secondary', label: 'Pending Review' },
      pending_cc_review: { variant: 'secondary', label: 'Pending CC Review' },
      endorsed_by_gm: { variant: 'secondary', label: 'Endorsed by GM' },
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

  // Calculate stats
  const totalPending = pendingLoans.length;
  const totalPendingAmount = pendingLoans.reduce((sum, loan) => sum + loan.principal_amount, 0);

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
      <Head title="Loan Applications – GM" />

      <div className="space-y-6 px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Loan Applications</h1>
            <p className="text-muted-foreground text-sm">
              Review and validate member loan requests awaiting GM approval
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition"
          >
            Back to Dashboard
          </Link>
        </div>

        <Separator />

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

        {/* Content */}
        {filteredLoans.length > 0 ? (
          <div className="space-y-4">
            <div className="border rounded-md">
              <table className="w-full text-sm">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Member ID</th>
                  <th className="px-4 py-3 text-left font-medium">Member Name</th>
                  <th className="px-4 py-3 text-left font-medium">Loan Type</th>
                  <th className="px-4 py-3 text-left font-medium">Principal</th>
                  <th className="px-4 py-3 text-left font-medium">Terms</th>
                  <th className="px-4 py-3 text-left font-medium">Applied Date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLoans.map((loan, index) => {
                  const { variant, label } = getStatusConfig(loan.status);

                  return (
                    <tr
                      key={loan.id}
                      className={cn(
                        'border-t',
                        index % 2 === 0 ? 'bg-white' : 'bg-muted/30'
                      )}
                    >
                      <td className="px-4 py-3 font-medium">{loan.member.member_id}</td>
                      <td className="px-4 py-3">{loan.member.name}</td>
                      <td className="px-4 py-3">{loan.loan_type_name}</td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        {formatCurrency(loan.principal_amount)}
                      </td>
                      <td className="px-4 py-3">{loan.terms_months} mo</td>
                      <td className="px-4 py-3">{formatDate(loan.created_at)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={variant}>{label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboards/Gm/Loan/${loan.id}/view`}>
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
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
          /* EMPTY STATE */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Pending Applications
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                {searchTerm
                  ? 'No loans match your search criteria.'
                  : 'There are currently no loan applications awaiting General Manager review.'
                }
              </p>
              {!searchTerm && (
                <Button
                  asChild
                  size="lg"
                  className="mt-6 min-w-[300px] h-12 text-base font-semibold"
                >
                  <Link href="/dashboard">
                    Return to Dashboard
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}