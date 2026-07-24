import { Head, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    History,
    LoaderCircle,
    Search,
    Upload,
    WalletCards,
} from 'lucide-react';
import { type ElementType, type FormEvent, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { LiveClock } from '@/components/live-clock';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Upload Payroll', href: '/dashboard' },

];

type ProcessingState = {
    active: boolean;
    message: string | null;
    started_at: string | null;
    upload_id?: number | null;
};

type PayrollStats = {
    missed_deductions: number;
    partial_deductions: number;
    overdue_loans: number;
    consecutive_missed_loans: number;
    payroll_uploads: number;
    failed_rows: number;
};

type PayrollUploadHistory = {
    id: number;
    original_file_name: string;
    cutoff_date: string;
    status: string;
    total_rows: number;
    processed_rows: number;
    failed_rows: number;
    duplicate_rows: number;
    paid_count: number;
    partial_count: number;
    missed_count: number;
    total_expected_amount: number;
    total_deducted_amount: number;
    uploaded_by: string;
    started_at: string | null;
    finished_at: string | null;
    error_message: string | null;
};

type FailedRow = {
    id: number;
    upload_id: number;
    row_number: number;
    employee_id: string | null;
    payroll_id: string | null;
    member_id: string | null;
    employee_name: string | null;
    cutoff_date: string | null;
    deduction_amount: number;
    status: string;
    deduction_status: string | null;
    errors: string[];
    file_name: string | null;
};

type ExceptionLoan = {
    id: number;
    member_name: string;
    employee_id: string | null;
    loan_type: string;
    status: string;
    remaining_balance: number;
    next_exception: string | null;
    exception_status: string | null;
};

type ManualPaymentLoan = {
    id: number;
    label: string;
    member_name: string;
    employee_id: string | null;
    loan_type: string;
    remaining_balance: number;
    next_due_amount: number;
    next_due_date: string | null;
};


interface UploadSalaryDeductProps {
    processing: ProcessingState;
    stats: PayrollStats;
    recentUpload: PayrollUploadHistory | null;
    uploadHistory: PayrollUploadHistory[];
    failedRows: FailedRow[];
    exceptionLoans: ExceptionLoan[];
    manualPaymentLoans: ManualPaymentLoan[];
    expectedColumns: {
        required_identifier: string;
        required_amount: string;
        required_cutoff: string;
        accepted_columns: string[];
        matching_order: string[];
        member_id_format: string;
    };
}

export default function UploadSalaryDeduct({
    processing,
    stats,
    recentUpload,
    uploadHistory,
    failedRows,
    exceptionLoans,
    manualPaymentLoans,
    expectedColumns,
}: UploadSalaryDeductProps) {
    const [historySearch, setHistorySearch] = useState('');
    const [exceptionSearch, setExceptionSearch] = useState('');
    const [manualOpen, setManualOpen] = useState(false);

    const uploadForm = useForm<{
        payroll_file: File | null;
        cutoff_date: string;
        remarks: string;
    }>({
        payroll_file: null,
        cutoff_date: new Date().toISOString().slice(0, 10),
        remarks: '',
    });

    const manualForm = useForm({
        loan_id: '',
        amount: '',
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: 'cash',
        reference_number: '',
        remarks: '',
    });

    const filteredHistory = useMemo(
        () =>
            uploadHistory.filter((upload) =>
                `${upload.original_file_name} ${upload.cutoff_date} ${upload.uploaded_by}`
                    .toLowerCase()
                    .includes(historySearch.toLowerCase()),
            ),
        [historySearch, uploadHistory],
    );

    const filteredExceptions = useMemo(
        () =>
            exceptionLoans.filter((loan) =>
                `${loan.member_name} ${loan.employee_id ?? ''} ${loan.loan_type}`
                    .toLowerCase()
                    .includes(exceptionSearch.toLowerCase()),
            ),
        [exceptionLoans, exceptionSearch],
    );

    function submitUpload(event: FormEvent) {
        event.preventDefault();

        uploadForm.post('/dashboards/Gm/UploadSalaryDeduct', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => uploadForm.reset('payroll_file', 'remarks'),
        });
    }

    const [exporting, setExporting] = useState(false);

    async function handleExport() {
        const cutoffDate = uploadForm.data.cutoff_date;

        if (!cutoffDate) {
            toast.error('Please select a cutoff date before exporting.');
            return;
        }

        setExporting(true);
        try {
            const url = new URL('/api/salary-deductions/export', window.location.origin);
            url.searchParams.set('cutoff_date', cutoffDate);

            const res = await fetch(url.toString(), {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!res.ok) {
                throw new Error(await readExportError(res));
            }

            const contentType = res.headers.get('Content-Type') ?? '';
            if (res.redirected || contentType.includes('text/html') || contentType.includes('application/json')) {
                throw new Error(await readExportError(res));
            }

            const blob = await res.blob();

            if (blob.size === 0) {
                throw new Error('The export returned an empty file.');
            }

            const filename = filenameFromDisposition(
                res.headers.get('Content-Disposition'),
                `salary_deduction_report_${cutoffDate}.xlsx`,
            );

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);

            toast.success('Salary deduction report exported successfully.');
        } catch (error) {
            console.error('Export error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to export salary deduction report. Please try again.');
        } finally {
            setExporting(false);
        }
    }

    function submitManualPayment(event: FormEvent) {
        event.preventDefault();

        manualForm.post('/dashboards/Gm/UploadSalaryDeduct/manual-payment', {
            preserveScroll: true,
            onSuccess: () => {
                manualForm.reset('loan_id', 'amount', 'reference_number', 'remarks');
                setManualOpen(false);
            },
        });
    }


    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Payroll Deductions" />

            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-6">
                <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Payroll Deduction Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Process salary deduction files, review exceptions, and record manual payments.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button variant="outline" asChild>
                            <a href="/dashboards/Gm/UploadSalaryDeduct/template">
                                <Download className="size-4" />
                                Template
                            </a>
                        </Button>

                        <Button
                            variant="outline"
                            type="button"
                            disabled={exporting || processing.active}
                            onClick={handleExport}
                        >
                            {exporting ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="size-4" />
                            )}
                            Export Salary Deduction Report
                        </Button>

                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => {
                                const url = processing.active
                                    ? '/dashboards/Gm/UploadSalaryDeduct/stop-maintenance'
                                    : '/dashboards/Gm/UploadSalaryDeduct/start-maintenance';

                                uploadForm.post(url, {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        // member pages will switch automatically
                                    },
                                });
                            }}
                        >

                            {processing.active ? (
                                <CheckCircle2 className="size-4" />
                            ) : (
                                <Banknote className="size-4" />
                            )}
                            {processing.active ? 'Stop Maintenance' : 'Start Maintenance'}
                        </Button>



                        <Dialog open={manualOpen} onOpenChange={setManualOpen}>

                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Banknote className="size-4" />
                                    Manual Payment
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <form onSubmit={submitManualPayment} className="space-y-5">
                                    <DialogHeader>
                                        <DialogTitle>Record Manual Payment</DialogTitle>
                                        <DialogDescription>
                                            Cash, GCash, bank transfer, and adjustment entries update the loan ledger immediately.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="loan_id">Loan</Label>
                                            <select
                                                id="loan_id"
                                                value={manualForm.data.loan_id}
                                                onChange={(event) =>
                                                    manualForm.setData('loan_id', event.target.value)
                                                }
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                required
                                            >
                                                <option value="">Select an active loan</option>
                                                {manualPaymentLoans.map((loan) => (
                                                    <option key={loan.id} value={loan.id}>
                                                        {loan.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <FieldError message={manualForm.errors.loan_id} />
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="amount">Amount</Label>
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={manualForm.data.amount}
                                                    onChange={(event) =>
                                                        manualForm.setData('amount', event.target.value)
                                                    }
                                                    required
                                                />
                                                <FieldError message={manualForm.errors.amount} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="payment_date">Payment Date</Label>
                                                <Input
                                                    id="payment_date"
                                                    type="date"
                                                    value={manualForm.data.payment_date}
                                                    onChange={(event) =>
                                                        manualForm.setData('payment_date', event.target.value)
                                                    }
                                                    required
                                                />
                                                <FieldError message={manualForm.errors.payment_date} />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="payment_method">Method</Label>
                                                <select
                                                    id="payment_method"
                                                    value={manualForm.data.payment_method}
                                                    onChange={(event) =>
                                                        manualForm.setData('payment_method', event.target.value)
                                                    }
                                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                >
                                                    <option value="cash">Cash</option>
                                                    <option value="gcash">GCash</option>
                                                    <option value="bank_transfer">Bank Transfer</option>
                                                    <option value="adjustment">Adjustment</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="reference_number">Reference</Label>
                                                <Input
                                                    id="reference_number"
                                                    value={manualForm.data.reference_number}
                                                    onChange={(event) =>
                                                        manualForm.setData('reference_number', event.target.value)
                                                    }
                                                    placeholder="OR, GCash, bank ref"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="manual_remarks">Remarks</Label>
                                            <Input
                                                id="manual_remarks"
                                                value={manualForm.data.remarks}
                                                onChange={(event) =>
                                                    manualForm.setData('remarks', event.target.value)
                                                }
                                                placeholder="Optional notes"
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={manualForm.processing}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {manualForm.processing && (
                                                <LoaderCircle className="size-4 animate-spin" />
                                            )}
                                            Save Payment
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                {processing.active && (
                    <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                        <LoaderCircle className="size-4 animate-spin" />
                        <AlertTitle>Payroll processing mode is active</AlertTitle>
                        <AlertDescription>
                            Member pages are temporarily showing the payroll maintenance screen.
                        </AlertDescription>
                    </Alert>
                )}

                <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                    <MetricCard
                        title="Missed"
                        value={stats.missed_deductions}
                        icon={AlertTriangle}
                        tone="red"
                    />
                    <MetricCard
                        title="Partial"
                        value={stats.partial_deductions}
                        icon={WalletCards}
                        tone="amber"
                    />
                    <MetricCard
                        title="Overdue"
                        value={stats.overdue_loans}
                        icon={History}
                        tone="slate"
                    />
                    <MetricCard
                        title="Consecutive Misses"
                        value={stats.consecutive_missed_loans}
                        icon={AlertTriangle}
                        tone="red"
                    />
                    <MetricCard
                        title="Failed Rows"
                        value={stats.failed_rows}
                        icon={FileSpreadsheet}
                        tone="amber"
                    />
                    <MetricCard
                        title="Uploads"
                        value={stats.payroll_uploads}
                        icon={CheckCircle2}
                        tone="emerald"
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Payroll File</CardTitle>
                            <CardDescription>
                                Accepted matching order: {expectedColumns.matching_order.join(' -> ')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-5" onSubmit={submitUpload}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="cutoff_date">Cutoff Date</Label>
                                        <Input
                                            id="cutoff_date"
                                            type="date"
                                            value={uploadForm.data.cutoff_date}
                                            onChange={(event) =>
                                                uploadForm.setData('cutoff_date', event.target.value)
                                            }
                                            required
                                        />
                                        <FieldError message={uploadForm.errors.cutoff_date} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="payroll_file">Excel / CSV File</Label>
                                        <Input
                                            id="payroll_file"
                                            type="file"
                                            accept=".xlsx,.xls,.csv,.ods"
                                            onChange={(event) =>
                                                uploadForm.setData(
                                                    'payroll_file',
                                                    event.currentTarget.files?.[0] ?? null,
                                                )
                                            }
                                            required
                                        />
                                        <FieldError message={uploadForm.errors.payroll_file} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Input
                                        id="remarks"
                                        value={uploadForm.data.remarks}
                                        onChange={(event) =>
                                            uploadForm.setData('remarks', event.target.value)
                                        }
                                        placeholder="Payroll batch notes"
                                    />
                                </div>

                                <div className="rounded-md border bg-muted/30 p-4">
                                    <p className="text-sm font-medium">Expected columns</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {expectedColumns.accepted_columns.map((column) => (
                                            <Badge key={column} variant="secondary">
                                                {column}
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        {expectedColumns.member_id_format}
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={uploadForm.processing || processing.active}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
                                >
                                    {uploadForm.processing ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                    ) : (
                                        <Upload className="size-4" />
                                    )}
                                    Process Payroll
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recently Processed Cutoff</CardTitle>
                            <CardDescription>
                                Latest payroll batch summary.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentUpload ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InfoTile label="Cutoff" value={formatDate(recentUpload.cutoff_date)} />
                                    <InfoTile label="Status" value={recentUpload.status} badge />
                                    <InfoTile label="Rows Applied" value={recentUpload.processed_rows} />
                                    <InfoTile label="Failed Rows" value={recentUpload.failed_rows} tone="amber" />
                                    <InfoTile
                                        label="Expected"
                                        value={formatCurrency(recentUpload.total_expected_amount)}
                                    />
                                    <InfoTile
                                        label="Deducted"
                                        value={formatCurrency(recentUpload.total_deducted_amount)}
                                        tone="emerald"
                                    />
                                </div>
                            ) : (
                                <EmptyState
                                    icon={FileSpreadsheet}
                                    title="No payroll uploads yet"
                                    description="Processed cutoff summaries will appear here."
                                />
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Exception Dashboard</CardTitle>
                                <CardDescription>
                                    Loans with missed, partial, overdue, or deferred deductions.
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={exceptionSearch}
                                    onChange={(event) => setExceptionSearch(event.target.value)}
                                    className="pl-9"
                                    placeholder="Search exceptions"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Loan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExceptions.length > 0 ? (
                                            filteredExceptions.map((loan) => (
                                                <TableRow key={loan.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{loan.member_name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {loan.employee_id ?? 'No employee ID'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{loan.loan_type}</TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={loan.exception_status ?? loan.status} />
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {formatCurrency(loan.remaining_balance)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableEmpty colSpan={4} message="No exception loans found." />
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Failed Payroll Rows</CardTitle>
                            <CardDescription>
                                Rows that need correction before they can affect loan balances.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Row</TableHead>
                                            <TableHead>Identifier</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Issue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {failedRows.length > 0 ? (
                                            failedRows.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell>#{row.row_number}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {row.employee_id ?? row.payroll_id ?? row.member_id ?? 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Upload #{row.upload_id}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        {formatCurrency(row.deduction_amount)}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs text-sm text-muted-foreground">
                                                        {(row.errors ?? []).join(', ') || row.status}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableEmpty colSpan={4} message="No failed rows recorded." />
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Card>
                    <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Payroll Upload History</CardTitle>
                            <CardDescription>
                                Processed files, validation counts, and deduction outcomes.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={historySearch}
                                onChange={(event) => setHistorySearch(event.target.value)}
                                className="pl-9"
                                placeholder="Search history"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Upload</TableHead>
                                        <TableHead>Cutoff</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Rows</TableHead>
                                        <TableHead>Outcomes</TableHead>
                                        <TableHead className="text-right">Deducted</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHistory.length > 0 ? (
                                        filteredHistory.map((upload) => (
                                            <TableRow key={upload.id}>
                                                <TableCell>
                                                    <div className="font-medium">#{upload.id}</div>
                                                    <div className="max-w-52 truncate text-xs text-muted-foreground">
                                                        {upload.original_file_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatDate(upload.cutoff_date)}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={upload.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{upload.processed_rows}</span>
                                                    <span className="text-muted-foreground"> / {upload.total_rows}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="outline">{upload.paid_count} paid</Badge>
                                                        <Badge variant="outline">{upload.partial_count} partial</Badge>
                                                        <Badge variant="outline">{upload.missed_count} missed</Badge>
                                                        {upload.failed_rows > 0 && (
                                                            <Badge variant="destructive">
                                                                {upload.failed_rows} failed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(upload.total_deducted_amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableEmpty colSpan={6} message="No payroll upload history found." />
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function MetricCard({
    title,
    value,
    icon: Icon,
    tone,
}: {
    title: string;
    value: number;
    icon: ElementType;
    tone: 'emerald' | 'amber' | 'red' | 'slate';
}) {
    const tones = {
        emerald: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
        amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
        red: 'border-red-100 bg-red-50/70 text-red-700',
        slate: 'border-slate-100 bg-slate-50/70 text-slate-700',
    };

    return (
        <Card className={cn('shadow-sm', tones[tone])}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="size-4" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold">{value}</div>
            </CardContent>
        </Card>
    );
}

function InfoTile({
    label,
    value,
    badge = false,
    tone = 'slate',
}: {
    label: string;
    value: string | number;
    badge?: boolean;
    tone?: 'slate' | 'emerald' | 'amber';
}) {
    return (
        <div className="rounded-md border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="mt-1 text-base font-semibold">
                {badge ? <StatusBadge status={String(value)} /> : (
                    <span
                        className={cn(
                            tone === 'emerald' && 'text-emerald-700',
                            tone === 'amber' && 'text-amber-700',
                        )}
                    >
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const normalized = status.replaceAll('_', ' ');

    if (['failed', 'missed', 'overdue'].includes(status)) {
        return <Badge variant="destructive">{normalized}</Badge>;
    }

    if (['partial', 'processing', 'duplicate'].includes(status)) {
        return (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                {normalized}
            </Badge>
        );
    }

    if (['paid', 'processed', 'manual_payment'].includes(status)) {
        return (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {normalized}
            </Badge>
        );
    }

    return <Badge variant="secondary">{normalized}</Badge>;
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-md bg-muted/30 p-8 text-center">
            <Icon className="mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">{title}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-28 text-center text-muted-foreground">
                {message}
            </TableCell>
        </TableRow>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return <p className="text-sm text-destructive">{message}</p>;
}

type ExportErrorResponse = {
    message?: string;
    errors?: Record<string, string | string[]>;
};

async function readExportError(response: Response): Promise<string> {
    if (response.redirected) {
        return 'The export request was redirected. Please refresh the page and sign in again.';
    }

    const contentType = response.headers.get('Content-Type') ?? '';

    if (contentType.includes('application/json')) {
        const data = (await response.json().catch(() => null)) as ExportErrorResponse | null;
        const validationError = firstValidationError(data?.errors);

        return validationError ?? data?.message ?? `Export failed with status ${response.status}.`;
    }

    const text = await response.text().catch(() => '');
    const cleanedText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (cleanedText && !contentType.includes('text/html')) {
        return cleanedText.slice(0, 200);
    }

    return `Export failed with status ${response.status}.`;
}

function firstValidationError(errors?: Record<string, string | string[]>): string | null {
    if (!errors) return null;

    for (const error of Object.values(errors)) {
        if (Array.isArray(error) && error[0]) {
            return error[0];
        }

        if (typeof error === 'string' && error) {
            return error;
        }
    }

    return null;
}

function filenameFromDisposition(disposition: string | null, fallback: string): string {
    if (!disposition) return fallback;

    const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (encodedMatch?.[1]) {
        try {
            return decodeURIComponent(encodedMatch[1].replace(/^"|"$/g, ''));
        } catch {
            return encodedMatch[1];
        }
    }

    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);

    return filenameMatch?.[1] ?? fallback;
}

function formatCurrency(amount: number | string): string {
    const value = typeof amount === 'string' ? Number(amount) : amount;

    if (!Number.isFinite(value)) {
        return 'PHP 0.00';
    }

    return `PHP ${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatDate(value: string | null): string {
    if (!value) return 'N/A';

    return new Date(value).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
