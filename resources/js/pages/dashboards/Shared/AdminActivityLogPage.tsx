import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    Activity,
    ArrowUpDown,
    CalendarIcon,
    Download,
    RefreshCw,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { LiveClock } from '@/components/live-clock';
import { LoanTablePagination } from '@/components/loan-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type {
    ActivityLog,
    ActivityLogApiResponse,
    BreadcrumbItem,
} from '@/types';

interface AdminActivityLogPageProps {
    breadcrumbs: BreadcrumbItem[];
    description: string;
    headTitle: string;
    title: string;
}

const DEFAULT_PER_PAGE = 10;

const emptyMeta: ActivityLogApiResponse['meta'] = {
    current_page: 1,
    last_page: 1,
    per_page: DEFAULT_PER_PAGE,
    total: 0,
    from: null,
    to: null,
};

const emptyStats: ActivityLogApiResponse['stats'] = {
    total: 0,
    today: 0,
    filtered: 0,
};

function actorFor(activity: ActivityLog) {
    return activity.actor ?? activity.user;
}

function formatAction(value: string) {
    return value.replace(/_/g, ' ').toUpperCase();
}

function formatRole(value?: string | null) {
    return value ? value.toUpperCase() : 'N/A';
}

function formatActivityDate(value: string, pattern: string) {
    const date = parseISO(value);

    if (Number.isNaN(date.getTime())) {
        return 'Invalid date';
    }

    return format(date, pattern);
}

function badgeVariant(actionType: string) {
    if (actionType.includes('reject') || actionType.includes('failed')) {
        return 'destructive' as const;
    }

    if (
        actionType.includes('approve') ||
        actionType.includes('created') ||
        actionType.includes('processed')
    ) {
        return 'default' as const;
    }

    return 'secondary' as const;
}

function csvCell(value: unknown) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function initialDateRange(): DateRange | undefined {
    if (typeof window === 'undefined') {
        return undefined;
    }

    const params = new URLSearchParams(window.location.search);
    const from = params.get('date_from');
    const to = params.get('date_to');

    return from
        ? {
              from: parseISO(from),
              to: to ? parseISO(to) : undefined,
          }
        : undefined;
}

export default function AdminActivityLogPage({
    breadcrumbs,
    description,
    headTitle,
    title,
}: AdminActivityLogPageProps) {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState(emptyStats);
    const [meta, setMeta] = useState(emptyMeta);
    const [actionTypes, setActionTypes] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterActor, setFilterActor] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        initialDateRange,
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PER_PAGE);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const buildParams = useCallback(
        (page = currentPage, perPage = rowsPerPage) => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString(),
            });

            if (searchTerm.trim()) {
                params.set('search', searchTerm.trim());
            }

            if (filterAction !== 'all') {
                params.set('action_type', filterAction);
            }

            if (filterActor !== 'all') {
                params.set('actor_role', filterActor);
            }

            if (dateRange?.from) {
                params.set('date_from', format(dateRange.from, 'yyyy-MM-dd'));
            }

            if (dateRange?.to) {
                params.set('date_to', format(dateRange.to, 'yyyy-MM-dd'));
            }

            return params;
        },
        [currentPage, dateRange, filterAction, filterActor, searchTerm, rowsPerPage],
    );

    const syncDateFilterToUrl = (range?: DateRange) => {
        const params = buildParams(1);

        params.delete('date_from');
        params.delete('date_to');

        if (range?.from) {
            params.set('date_from', format(range.from, 'yyyy-MM-dd'));
        }

        if (range?.to) {
            params.set('date_to', format(range.to, 'yyyy-MM-dd'));
        }

        router.get(
            window.location.pathname,
            Object.fromEntries(params.entries()),
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const fetchActivities = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/admin/activity-logs?${buildParams().toString()}`,
                {
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Unable to load activity logs.');
            }

            const payload = (await response.json()) as ActivityLogApiResponse;

            setActivities(payload.data);
            setMeta(payload.meta);
            setStats(payload.stats);
            setActionTypes(payload.filters.action_types);
            setSelected(new Set());
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load activity logs.',
            );
        } finally {
            setIsLoading(false);
        }
    }, [buildParams]);

    useEffect(() => {
        const timeout = window.setTimeout(
            () => {
                void fetchActivities();
            },
            searchTerm ? 300 : 0,
        );

        return () => window.clearTimeout(timeout);
    }, [fetchActivities, searchTerm]);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterAction('all');
        setFilterActor('all');
        setDateRange(undefined);
        setCurrentPage(1);
        setSelected(new Set());
        router.get(
            window.location.pathname,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const exportCSV = async () => {
        const exportLimit = Math.min(
            Math.max(stats.filtered, DEFAULT_PER_PAGE),
            500,
        );
        const response = await fetch(
            `/api/admin/activity-logs?${buildParams(1, exportLimit).toString()}`,
            {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                },
            },
        );

        if (!response.ok) {
            setError('Unable to export activity logs.');
            return;
        }

        const payload = (await response.json()) as ActivityLogApiResponse;
        const rows = payload.data;
        const headers = [
            'Date',
            'Actor Email',
            'Role',
            'Action',
            'Details',
            'Loan',
        ];
        const csv = [
            headers.map(csvCell).join(','),
            ...rows.map((activity) => {
                const actor = actorFor(activity);

                return [
                    formatActivityDate(
                        activity.created_at,
                        'MMM dd, yyyy HH:mm',
                    ),
                    actor?.email ?? 'Unknown user',
                    formatRole(actor?.role),
                    formatAction(activity.action_type),
                    activity.reject_reason
                        ? `${activity.description} Reason: ${activity.reject_reason}`
                        : activity.description,
                    activity.loan
                        ? `#${activity.loan.id} - PHP ${activity.loan.principal_amount.toLocaleString()}`
                        : '-',
                ]
                    .map(csvCell)
                    .join(',');
            }),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'activity-log.csv';
        link.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title={headTitle} />

            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">{title}</h1>
                        <p className="max-w-md text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Button
                            onClick={() => void exportCSV()}
                            variant="outline"
                            size="sm"
                            disabled={stats.filtered === 0 || isLoading}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void fetchActivities()}
                            disabled={isLoading}
                            className="gap-2"
                        >
                            <RefreshCw
                                className={
                                    isLoading
                                        ? 'h-4 w-4 animate-spin'
                                        : 'h-4 w-4'
                                }
                            />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="border-emerald-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800">
                                Total Activities
                            </CardTitle>
                            <Activity className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800">
                                Today
                            </CardTitle>
                            <Activity className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.today.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 bg-white/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800">
                                Filtered Results
                            </CardTitle>
                            <Activity className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.filtered.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                        {error}
                    </Card>
                )}

                <Card className="overflow-hidden shadow-xl">
                    <CardHeader className="flex flex-col gap-4 border-b bg-muted/30 p-6">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-semibold tracking-tight">
                                Activity History
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Filter and audit administrative actions by date,
                                actor role, action type, or keyword.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <Input
                                placeholder="Search descriptions, actors, loans..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-10 flex-1 md:max-w-md"
                            />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 w-full justify-start gap-2 text-left font-normal lg:w-[280px]"
                                    >
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(
                                                        dateRange.from,
                                                        'MMM dd, yyyy',
                                                    )}{' '}
                                                    -{' '}
                                                    {format(
                                                        dateRange.to,
                                                        'MMM dd, yyyy',
                                                    )}
                                                </>
                                            ) : (
                                                format(
                                                    dateRange.from,
                                                    'MMM dd, yyyy',
                                                )
                                            )
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Filter by date range
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="range"
                                        numberOfMonths={2}
                                        selected={dateRange}
                                        onSelect={(range) => {
                                            setDateRange(range);
                                            setCurrentPage(1);
                                            syncDateFilterToUrl(range);
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Select
                                value={filterActor}
                                onValueChange={(value) => {
                                    setFilterActor(value);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-10 w-full lg:w-[150px]">
                                    <SelectValue placeholder="Actor role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Roles
                                    </SelectItem>
                                    <SelectItem value="gm">GM</SelectItem>
                                    <SelectItem value="hr">HR</SelectItem>
                                    <SelectItem value="creditcom">
                                        CreditCom
                                    </SelectItem>
                                   
                                </SelectContent>
                            </Select>
                            <Select
                                value={filterAction}
                                onValueChange={(value) => {
                                    setFilterAction(value);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-10 w-full lg:w-[220px]">
                                    <SelectValue placeholder="Action type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Actions
                                    </SelectItem>
                                    {actionTypes.map((actionType) => (
                                        <SelectItem
                                            key={actionType}
                                            value={actionType}
                                        >
                                            {formatAction(actionType)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {(searchTerm ||
                                filterAction !== 'all' ||
                                filterActor !== 'all' ||
                                dateRange?.from) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-10 px-3"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <Table className="min-w-[720px]">
                            <TableHeader>
                                <TableRow className="border-b border-emerald-200 hover:bg-transparent">
                                    <TableHead className="w-[50px] font-semibold text-emerald-800"></TableHead>
                                    <TableHead className="w-[150px] font-semibold text-emerald-800">
                                        <div className="flex h-12 items-center gap-1 text-xs font-medium text-emerald-700/80 uppercase">
                                            <ArrowUpDown className="h-3 w-3" />
                                            Date & Time
                                        </div>
                                    </TableHead>
                                    <TableHead className="hidden font-semibold text-emerald-800 sm:table-cell">
                                        Email
                                    </TableHead>
                                    <TableHead className="w-[90px] font-semibold text-emerald-800">
                                        Role
                                    </TableHead>
                                    <TableHead className="w-[170px] font-semibold text-emerald-800">
                                        <div className="flex h-12 items-center gap-1 text-xs font-medium text-emerald-700/80 uppercase">
                                            <ArrowUpDown className="h-3 w-3" />
                                            Action
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[1%] max-w-[320px] font-semibold text-emerald-800">
                                        Details
                                    </TableHead>
                                    <TableHead className="hidden w-[150px] font-semibold text-emerald-800 md:table-cell">
                                        Loan
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-28 text-center text-muted-foreground"
                                        >
                                            Loading activity logs...
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!isLoading &&
                                    activities.map((activity) => {
                                        const actor = actorFor(activity);

                                        return (
                                            <TableRow
                                                key={activity.id}
                                                className="border-b border-emerald-50 transition-colors hover:bg-emerald-50/50 [&:has([data-state=checked]):hover]:bg-emerald-100/50 [&:last-child]:border-b"
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selected.has(
                                                            activity.id.toString(),
                                                        )}
                                                        onCheckedChange={() => {
                                                            const newSelected =
                                                                new Set(
                                                                    selected,
                                                                );
                                                            const activityId =
                                                                activity.id.toString();

                                                            if (
                                                                newSelected.has(
                                                                    activityId,
                                                                )
                                                            ) {
                                                                newSelected.delete(
                                                                    activityId,
                                                                );
                                                            } else {
                                                                newSelected.add(
                                                                    activityId,
                                                                );
                                                            }

                                                            setSelected(
                                                                newSelected,
                                                            );
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="font-mono text-sm">
                                                        {formatActivityDate(
                                                            activity.created_at,
                                                            'MMM dd, yyyy',
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatActivityDate(
                                                            activity.created_at,
                                                            'HH:mm',
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden max-w-[160px] truncate text-sm font-medium sm:table-cell">
                                                    {actor?.email ??
                                                        'Unknown user'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs font-medium"
                                                    >
                                                        {formatRole(
                                                            actor?.role,
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={badgeVariant(
                                                            activity.action_type,
                                                        )}
                                                        className="px-2.5 py-0.5 text-xs font-medium"
                                                    >
                                                        {formatAction(
                                                            activity.action_type,
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[320px] whitespace-normal">
                                                    <div
                                                        className="line-clamp-2 text-sm leading-tight"
                                                        title={
                                                            activity.description
                                                        }
                                                    >
                                                        {activity.description}
                                                    </div>
                                                    {activity.reject_reason && (
                                                        <div
                                                            className="mt-1 max-w-[280px] truncate rounded-full bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive"
                                                            title={
                                                                activity.reject_reason
                                                            }
                                                        >
                                                            {
                                                                activity.reject_reason
                                                            }
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {activity.loan ? (
                                                        <div className="space-y-1">
                                                            <span className="block font-mono text-xs text-muted-foreground">
                                                                #
                                                                {
                                                                    activity
                                                                        .loan.id
                                                                }
                                                            </span>
                                                            <div className="text-sm font-semibold">
                                                                PHP{' '}
                                                                {activity.loan.principal_amount.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="border-t bg-muted/30 p-4 sm:p-6">
                        <LoanTablePagination
                            currentPage={currentPage}
                            rowsPerPage={rowsPerPage}
                            totalItems={meta.total}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={(rows) => {
                                setRowsPerPage(rows);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </Card>

                {!isLoading && activities.length === 0 && (
                    <Card className="border-2 border-dashed border-muted p-16 text-center shadow-sm transition-all duration-300 hover:shadow-md">
                        <Activity className="mx-auto mb-6 h-20 w-20 text-muted-foreground/50" />
                        <h3 className="mb-2 text-2xl font-bold text-foreground">
                            No activities found
                        </h3>
                        <p className="mx-auto mb-8 max-w-lg leading-relaxed text-muted-foreground">
                            {searchTerm ||
                            filterAction !== 'all' ||
                            filterActor !== 'all' ||
                            dateRange?.from
                                ? 'No results match your current search and filter criteria. Try different terms.'
                                : 'Activity log is empty. Administrative actions will appear here as they occur.'}
                        </p>
                        <Button
                            onClick={clearFilters}
                            variant="outline"
                            size="lg"
                            className="mx-auto w-full max-w-sm"
                        >
                            Reset Filters & Search
                        </Button>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
