import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    Loader2,
    Upload,
    XCircle,
} from 'lucide-react';
import axios from 'axios';
import { useCallback, useRef, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { LiveClock } from '@/components/live-clock';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Member Validation', href: '/dashboards/Gm/MemberValidate' },
    { title: 'Bulk Upload', href: '/dashboards/Gm/BulkUploadMembers' },
];

interface ImportFailure {
    row: number;
    email: string;
    error: string;
}

interface ImportResult {
    success_count: number;
    sent_email_count: number;
    failed_count: number;
    failures: ImportFailure[];
}

type UploadState =
    | { status: 'idle' }
    | { status: 'uploading'; progress: number }
    | { status: 'processing' }
    | { status: 'success'; result: ImportResult }
    | { status: 'error'; message: string };

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function BulkUploadMembers() {
    const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isValidFile = (file: File): boolean => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return ALLOWED_EXTENSIONS.includes(ext);
    };

    const handleFileDrop = useCallback((file: File) => {
        if (!isValidFile(file)) {
            setUploadState({
                status: 'error',
                message: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.',
            });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadState({
                status: 'error',
                message: 'File size exceeds 10 MB limit.',
            });
            return;
        }
        setSelectedFile(file);
        setUploadState({ status: 'idle' });
    }, []);

    const onDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);

            const file = e.dataTransfer.files?.[0];
            if (file) handleFileDrop(file);
        },
        [handleFileDrop],
    );

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileDrop(file);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setUploadState({ status: 'uploading', progress: 0 });

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post(
                '/dashboards/Gm/BulkUploadMembers',
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const progress = Math.round(
                                (progressEvent.loaded / progressEvent.total) * 100,
                            );
                            setUploadState({ status: 'uploading', progress });
                        }
                    },
                },
            );

            const data = response.data;

            if (data.success) {
                setUploadState({
                    status: 'success',
                    result: data.data,
                });
            } else {
                setUploadState({
                    status: 'error',
                    message: data.message || 'An unexpected error occurred during import.',
                });
            }
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            const serverMessage = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;

            if (status === 419) {
                setUploadState({
                    status: 'error',
                    message: 'Your session has expired. Please refresh the page and try again.',
                });
                return;
            }

            setUploadState({
                status: 'error',
                message:
                    serverMessage || 'Network error. Please check your connection and try again.',
            });
        }
    };

    const handleDownloadTemplate = () => {
        window.open('/dashboards/Gm/BulkUploadMembers/template', '_blank');
    };

    const resetForm = () => {
        setSelectedFile(null);
        setUploadState({ status: 'idle' });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isProcessing =
        uploadState.status === 'uploading' || uploadState.status === 'processing';

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Bulk Upload Members" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <HeadingSmall
                        title="Bulk Member Upload"
                        description="Import legacy members in bulk via Excel or CSV. Each member will be created as active and receive a welcome email with login credentials."
                    />
                </div>

                {uploadState.status === 'success' ? (
                    /* ── Results Card ── */
                    <Card className="overflow-hidden border-emerald-200">
                        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-emerald-800 dark:text-emerald-300">
                                        Import Complete
                                    </CardTitle>
                                    <CardDescription className="text-emerald-700 dark:text-emerald-400">
                                        {uploadState.result.success_count} member(s) imported successfully
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Card className="border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/5">
                                    <CardContent className="flex flex-col items-center py-6 text-center">
                                        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                            {uploadState.result.success_count}
                                        </span>
                                        <span className="mt-1 text-sm text-muted-foreground">
                                            Members Created
                                        </span>
                                    </CardContent>
                                </Card>
                                <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/5">
                                    <CardContent className="flex flex-col items-center py-6 text-center">
                                        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                            {uploadState.result.sent_email_count}
                                        </span>
                                        <span className="mt-1 text-sm text-muted-foreground">
                                            Emails Sent
                                        </span>
                                    </CardContent>
                                </Card>
                                <Card
                                    className={
                                        uploadState.result.failed_count > 0
                                            ? 'border-red-200 bg-red-50/30 dark:bg-red-950/5'
                                            : 'border-gray-200 bg-gray-50/30 dark:bg-gray-950/5'
                                    }
                                >
                                    <CardContent className="flex flex-col items-center py-6 text-center">
                                        <span
                                            className={`text-3xl font-bold ${
                                                uploadState.result.failed_count > 0
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {uploadState.result.failed_count}
                                        </span>
                                        <span className="mt-1 text-sm text-muted-foreground">
                                            Failed Rows
                                        </span>
                                    </CardContent>
                                </Card>
                            </div>

                            {uploadState.result.failures.length > 0 && (
                                <div className="mt-6">
                                    <Separator className="mb-4" />
                                    <h4 className="mb-3 text-sm font-semibold text-red-700 dark:text-red-400">
                                        Failed Rows Details
                                    </h4>
                                    <div className="overflow-x-auto rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/40">
                                                    <TableHead className="w-16">Row</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Error Reason</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {uploadState.result.failures.map((failure, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-mono text-xs">
                                                            {failure.row}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">
                                                            {failure.email}
                                                        </TableCell>
                                                        <TableCell className="text-red-600 text-xs">
                                                            {failure.error}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <Button onClick={resetForm}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Another File
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* ── Error Alert ── */}
                        {uploadState.status === 'error' && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Import Failed</AlertTitle>
                                <AlertDescription>{uploadState.message}</AlertDescription>
                            </Alert>
                        )}

                        {/* ── Template Download Card ── */}
                        <Card className="overflow-hidden border-emerald-200/60">
                            <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                                        <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">
                                            Download Sample Template
                                        </h3>
                                        <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-400">
                                            Get a pre-formatted Excel (.xlsx) file with all required columns and example data.
                                            Leave the Employee ID column blank to auto-assign unique IDs (EMP-001, EMP-002, ...).
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadTemplate}
                                    className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Template
                                </Button>
                            </CardContent>
                        </Card>

                        {/* ── Upload Form ── */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Upload Member Data</CardTitle>
                                <CardDescription>
                                    Select an Excel (.xlsx, .xls) or CSV file containing your member records.
                                    The file must include the required columns as shown in the template.
                                    Leave Employee ID blank to auto-assign unique IDs.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpload}>
                                    <div className="space-y-6">
                                        {/* Dropzone */}
                                        <div
                                            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 ${
                                                isProcessing
                                                    ? 'cursor-not-allowed border-muted-foreground/20 bg-muted/30 opacity-60'
                                                    : dragActive
                                                      ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                      : 'border-muted-foreground/25 hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10'
                                            }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={onDrop}
                                            onClick={() => !isProcessing && fileInputRef.current?.click()}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={handleFileSelect}
                                                disabled={isProcessing}
                                                className="hidden"
                                            />

                                            {selectedFile ? (
                                                <div className="flex flex-col items-center gap-3 text-center">
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/50">
                                                        <FileSpreadsheet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-semibold text-foreground">
                                                            {selectedFile.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatFileSize(selectedFile.size)}
                                                        </p>
                                                    </div>
                                                    {!isProcessing && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                resetForm();
                                                            }}
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            Remove file
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 text-center">
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-semibold text-foreground">
                                                            Drop your file here, or{' '}
                                                            <span className="text-emerald-600 underline underline-offset-2">
                                                                browse
                                                            </span>
                                                        </p>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            Supports .xlsx, .xls, and .csv files (max 10MB)
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress bar during upload */}
                                        {isProcessing && (
                                            <div className="animate-in fade-in slide-in-from-top-2 space-y-3 duration-300">
                                                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-5 py-4">
                                                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-600" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-foreground">
                                                            Importing records & dispatching credentials...
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {uploadState.status === 'uploading'
                                                                ? `Uploading file... ${uploadState.progress}%`
                                                                : 'Processing rows, please wait...'}
                                                        </p>
                                                    </div>
                                                    {uploadState.status === 'uploading' && (
                                                        <span className="text-sm font-semibold text-emerald-600">
                                                            {uploadState.progress}%
                                                        </span>
                                                    )}
                                                </div>
                                                <Progress
                                                    value={
                                                        uploadState.status === 'uploading'
                                                            ? uploadState.progress
                                                            : 100
                                                    }
                                                />
                                            </div>
                                        )}

                                        {/* Submit */}
                                        <div className="flex items-center justify-end gap-3 border-t pt-6">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={resetForm}
                                                disabled={isProcessing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={!selectedFile || isProcessing}
                                                className="bg-emerald-600 font-medium hover:bg-emerald-700"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Spinner className="mr-2 h-4 w-4" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="mr-2 h-4 w-4" />
                                                        Import Members
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    );
}

