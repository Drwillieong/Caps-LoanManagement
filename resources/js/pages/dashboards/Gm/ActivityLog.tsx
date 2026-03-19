import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown, Activity, RefreshCw, Download } from 'lucide-react';
import type { ActivityLog, BreadcrumbItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  activities: ActivityLog[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
];

export default function ActivityLogPage({ activities }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;

  const filteredActivities = activities.filter(activity =>
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterAction === 'all' || activity.action_type === filterAction)
  );

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportCSV = () => {
    const headers = ['Date,Action,User,Loan,Description,Reject Reason,IP'];
    const csv = [
      headers.join(','),
      ...filteredActivities.map(activity =>
        `${format(parseISO(activity.created_at), 'MMM dd, yyyy HH:mm')},${activity.action_type.replace('_', ' ').toUpperCase()},${activity.user.name},${activity.loan ? `#${activity.loan.id} - ₱${activity.loan.principal_amount?.toLocaleString()}` : '-'},${activity.description},${activity.reject_reason || ''},${activity.ip_address || ''}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity-log.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalActivities = activities.length;
  const todayActivities = activities.filter(a => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parseISO(a.created_at) >= today;
  }).length;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterAction('all');
    setCurrentPage(1);
    setSelected(new Set());
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
      <Head title="Activity Log" />

      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
            <p className="text-muted-foreground max-w-md">
              Monitor all GM loan management activities and transactions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={exportCSV} variant="outline" size="sm" disabled={filteredActivities.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl lg:text-4xl font-bold text-primary">{totalActivities.toLocaleString()}</CardTitle>
              <CardDescription className="text-primary/80 font-medium">Total Activities</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl lg:text-4xl font-bold text-destructive">{todayActivities.toLocaleString()}</CardTitle>
              <CardDescription className="text-destructive/80 font-medium">Today</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl lg:text-4xl font-bold">{filteredActivities.length.toLocaleString()}</CardTitle>
              <CardDescription className="font-medium">Filtered Results</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="overflow-hidden shadow-xl">
          <CardHeader className="flex flex-row items-center p-6 pb-4 gap-3 bg-gradient-to-r from-muted/50">
            <Input
              placeholder="Search descriptions, users, loans..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 md:max-w-md h-10"
            />
            <Select value={filterAction} onValueChange={(value) => {
              setFilterAction(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || filterAction !== 'all') && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 px-3">
                Clear
              </Button>
            )}
          </CardHeader>

          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-border/50">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[150px]">
                    <div className="font-medium text-xs uppercase tracking-wide text-muted-foreground/80 flex items-center gap-1 h-12">
                      <ArrowUpDown className="h-3 w-3" />
                      Date & Time
                    </div>
                  </TableHead>
                  <TableHead className="w-[110px]">
                    <div className="font-medium text-xs uppercase tracking-wide text-muted-foreground/80 flex items-center gap-1 h-12">
                      <ArrowUpDown className="h-3 w-3" />
                      Action
                    </div>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">User</TableHead>
                  <TableHead className="hidden md:table-cell w-[150px]">Loan</TableHead>
                  <TableHead className="w-[1%] max-w-[260px]">Description</TableHead>
                  <TableHead className="hidden lg:table-cell w-[220px]">Reject Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActivities.map((activity) => (
                  <TableRow key={activity.id} className="[&:has([data-state=checked]):hover]:bg-accent/50 [&:last-child]:border-b">
                    <TableCell>
                      <Checkbox
                        checked={selected.has(activity.id.toString())}
                        onCheckedChange={() => {
                          const newSelected = new Set(selected);
                          if (newSelected.has(activity.id.toString())) {
                            newSelected.delete(activity.id.toString());
                          } else {
                            newSelected.add(activity.id.toString());
                          }
                          setSelected(newSelected);
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="text-sm font-mono">{format(parseISO(activity.created_at), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-muted-foreground">{format(parseISO(activity.created_at), 'HH:mm')}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={activity.action_type === 'rejected' ? 'destructive' :
                          activity.action_type === 'approved' ? 'default' : 'secondary'}
                        className="text-xs px-2.5 py-0.5 font-medium whitespace-nowrap"
                      >
                        {activity.action_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-medium text-sm truncate max-w-[120px]">
                      {activity.user.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        {activity.loan ? (
                          <>
                            <span className="font-mono text-xs text-muted-foreground block">
                              #{activity.loan.id}
                            </span>
                            <div className="font-semibold text-sm">
                              ₱{activity.loan.principal_amount?.toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <div
                        className="text-sm line-clamp-2 leading-tight"
                        title={activity.description}
                      >
                        {activity.description}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {activity.reject_reason ? (
                        <div className="text-destructive font-medium text-sm bg-destructive/5 px-3 py-1.5 rounded-full max-w-[200px] truncate">
                          {activity.reject_reason}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <CardFooter className="p-6 pt-0 border-t bg-muted/30 gap-4 flex-col-reverse sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredActivities.length)} of{' '}
                <span className="font-semibold">{filteredActivities.length}</span> results
              </div>
              <div className="flex items-center gap-1 order-1 sm:order-2 w-full sm:w-auto justify-center sm:justify-end">
                <Button
                  variant={currentPage === 1 ? "outline" : "default"}
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-3 min-w-[80px]"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = currentPage <= 3
                      ? i + 1
                      : totalPages <= 5
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;
                    
                    // Final safety check for pageNum validity
                    if (pageNum <= 0 || pageNum > totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="h-9 w-9"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant={currentPage === totalPages ? "outline" : "default"}
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 min-w-[80px]"
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {paginatedActivities.length === 0 && (
          <Card className="border-2 border-dashed border-muted p-16 text-center shadow-sm hover:shadow-md transition-all duration-300">
            <Activity className="h-20 w-20 mx-auto mb-6 text-muted-foreground/50" />
            <h3 className="text-2xl font-bold mb-2 text-foreground">No activities found</h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
              {searchTerm || filterAction !== 'all'
                ? 'No results match your current search and filter criteria. Try different terms.'
                : 'Activity log is empty. Loan management actions will appear here as they occur.'
              }
            </p>
            <Button onClick={clearFilters} variant="outline" size="lg" className="w-full max-w-sm mx-auto">
              Reset Filters & Search
            </Button>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}