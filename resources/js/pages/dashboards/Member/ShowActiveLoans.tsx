import { Head, Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { LiveClock } from '@/components/live-clock';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type MemberActiveLoanProps } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Active Loans', href: '/dashboards/Member/ShowActiveLoans' },
];

function formatCurrency(amount: number | string | null | undefined): string {
    const value = typeof amount === 'string' ? Number(amount) : amount;

    if (value === null || value === undefined || Number.isNaN(value)) {
        return 'PHP 0.00';
    }

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(value);
}

function formatDate(date: string | null): string {
    if (!date) return 'Not yet released';

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(date));
}

export default function ShowActiveLoans({
    activeLoans = [],
    hasActiveLoan = activeLoans.length > 0,
}: Partial<MemberActiveLoanProps>) {
    const [search, setSearch] = useState('');

    const filteredLoans = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return activeLoans;

        return activeLoans.filter((loan) =>
            [loan.loan_type_name, String(loan.id)]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query)),
        );
    }, [activeLoans, search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Active Loans" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            Active Loans
                        </h1>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Review your current loans, payment terms, and
                            monthly obligations.
                        </p>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search loans"
                            className="h-10 pl-9"
                            aria-label="Search active loans"
                        />
                    </div>
                </div>

                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="gap-1 border-b px-5 py-4">
                        <CardTitle className="text-base font-semibold">
                            Loan Overview
                        </CardTitle>
                        <CardDescription>
                            {hasActiveLoan
                                ? `${filteredLoans.length} ${filteredLoans.length === 1 ? 'loan' : 'loans'} shown`
                                : '0 loans shown'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="min-w-[180px] px-5 py-3 text-xs font-medium tracking-normal text-muted-foreground uppercase">
                                        Loan Type
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-right text-xs font-medium tracking-normal text-muted-foreground uppercase">
                                        Loan Amount
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-right text-xs font-medium tracking-normal text-muted-foreground uppercase">
                                        Interest Rate
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-right text-xs font-medium tracking-normal text-muted-foreground uppercase">
                                        Term
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-right text-xs font-medium tracking-normal text-muted-foreground uppercase">
                                        Total Payable
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-right text-xs font-medium tracking-normal text-muted-foreground uppercase">
                                        Monthly Payment
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium tracking-normal text-muted-foreground uppercase">
                                        Start Date
                                    </TableHead>
                                    <TableHead className="px-5 py-3 text-right text-xs font-medium tracking-normal text-muted-foreground uppercase">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLoans.length > 0 ? (
                                    filteredLoans.map((loan) => {
                                        const interestRate =
                                            loan.principal_amount > 0
                                                ? (Number(
                                                      loan.interest_amount,
                                                  ) /
                                                      Number(
                                                          loan.principal_amount,
                                                      )) *
                                                  100
                                                : null;

                                        return (
                                            <TableRow
                                                key={loan.id}
                                                className="border-border/70 hover:bg-muted/30"
                                            >
                                                <TableCell className="px-5 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-foreground">
                                                            {
                                                                loan.loan_type_name
                                                            }
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Loan #{loan.id}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-right font-medium tabular-nums">
                                                    {formatCurrency(
                                                        loan.principal_amount,
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-right text-muted-foreground tabular-nums">
                                                    {interestRate === null
                                                        ? 'N/A'
                                                        : `${interestRate.toFixed(2)}%`}
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-right tabular-nums">
                                                    {loan.terms_months} mo.
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-right font-medium tabular-nums">
                                                    {formatCurrency(
                                                        loan.total_amount_due,
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-right tabular-nums">
                                                    {formatCurrency(
                                                        loan.monthly_amortization,
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-muted-foreground">
                                                    {formatDate(
                                                        loan.release_date,
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-5 py-4 text-right">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={`/dashboards/Member/active-loans/${loan.id}/view`}
                                                        >
                                                            View Loan
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : hasActiveLoan ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="h-32 px-5 text-center text-sm text-muted-foreground"
                                        >
                                            No active loans match your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <TableRow className="border-border/70 hover:bg-transparent">
                                        <TableCell className="px-5 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-muted-foreground">
                                                    No active loan
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    New released loans will
                                                    appear here.
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-5 text-right text-muted-foreground">
                                            -
                                        </TableCell>
                                        <TableCell className="px-4 py-5 text-right text-muted-foreground">
                                            -
                                        </TableCell>
                                        <TableCell className="px-4 py-5 text-right text-muted-foreground">
                                            -
                                        </TableCell>
                                        <TableCell className="px-4 py-5 text-right text-muted-foreground">
                                            -
                                        </TableCell>
                                        <TableCell className="px-4 py-5 text-right text-muted-foreground">
                                            -
                                        </TableCell>
                                        <TableCell className="px-4 py-5 text-muted-foreground">
                                            -
                                        </TableCell>
                                        <TableCell className="px-5 py-5 text-right">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link href="/dashboards/Member/ApplyLoan">
                                                    Apply
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
