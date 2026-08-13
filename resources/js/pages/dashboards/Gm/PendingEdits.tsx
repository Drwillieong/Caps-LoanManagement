import { Head, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem, type ProfileUpdateRequest } from '@/types';
import {
    CheckCircle2,
    XCircle,
    FileEdit,
    User,
    Clock,
    AlertCircle,
    ArrowLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Loader2,
    Shield,
    Power,
    RotateCcw,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'GM Dashboard', href: '/dashboard' },
    { title: 'Pending Profile Edits', href: '/dashboards/Gm/PendingEdits' },
];

interface Props {
    pendingEdits: ProfileUpdateRequest[];
}

// Fields that are user-friendly to display in the diff view
const DISPLAY_FIELDS: Record<string, { label: string; category: string }> = {
    first_name: { label: 'First Name', category: 'Personal' },
    middle_name: { label: 'Middle Name', category: 'Personal' },
    last_name: { label: 'Last Name', category: 'Personal' },
    date_of_birth: { label: 'Date of Birth', category: 'Personal' },
    sex: { label: 'Sex', category: 'Personal' },
    civil_status: { label: 'Civil Status', category: 'Personal' },
    place_of_birth: { label: 'Place of Birth', category: 'Personal' },
    educational_attainment: { label: 'Educational Attainment', category: 'Personal' },
    mobile_number: { label: 'Mobile Number', category: 'Contact' },
    permanent_mobile_number: { label: 'Permanent Mobile Number', category: 'Contact' },
    present_address: { label: 'Present Address', category: 'Address' },
    present_zip_code: { label: 'Present Zip Code', category: 'Address' },
    permanent_address: { label: 'Permanent Address', category: 'Address' },
    permanent_zip_code: { label: 'Permanent Zip Code', category: 'Address' },
    position: { label: 'Position', category: 'Employment' },
    basic_salary: { label: 'Basic Salary', category: 'Employment' },
    income_type: { label: 'Income Type', category: 'Employment' },
    net_income: { label: 'Net Income', category: 'Employment' },
    share_capital_balance: { label: 'Share Capital Balance', category: 'Financial' },
    other_source_of_income: { label: 'Other Source of Income', category: 'Financial' },
    bank_account_number: { label: 'Bank Account Number', category: 'Financial' },
    tin_number: { label: 'TIN Number', category: 'Financial' },
    account_status: { label: 'Account Status', category: 'Account' },
    facebook_account_name: { label: 'Facebook Account', category: 'Personal' },
    spouse_occupation: { label: 'Spouse Occupation', category: 'Family' },
    spouse_gross_income: { label: 'Spouse Gross Income', category: 'Family' },
    spouse_income_type: { label: 'Spouse Income Type', category: 'Family' },
    spouse_net_income: { label: 'Spouse Net Income', category: 'Family' },
    legal_beneficiary_1_name: { label: 'Legal Beneficiary', category: 'Family' },
    real_properties_owned: { label: 'Real Properties Owned', category: 'Family' },
};

function formatDisplayValue(key: string, value: any): string {
    if (value === null || value === undefined || value === '') return '—';

    if (key === 'beneficiaries') {
        return formatBeneficiaries(value);
    }

    // Format currency fields
    if (['basic_salary', 'net_income', 'share_capital_balance', 'spouse_gross_income', 'spouse_net_income'].includes(key)) {
        const num = typeof value === 'string' ? cleanNumericValue(value) : value;
        if (isNaN(num)) return String(value);
        return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Format date fields
    if (['date_of_birth'].includes(key)) {
        if (typeof value === 'string' && value.includes('-')) {
            try {
                return new Date(value).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            } catch {
                return value;
            }
        }
    }

    // Capitalize sex and civil_status
    if (['sex', 'civil_status', 'income_type', 'spouse_income_type'].includes(key)) {
        if (typeof value === 'string') {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }
    }

    return String(value);
}

/**
 * Currency/numeric fields that need formatting-normalized comparison.
 */
const CURRENCY_FIELDS = [
    'basic_salary', 'net_income', 'share_capital_balance',
    'spouse_gross_income', 'spouse_net_income',
];

const BENEFICIARY_KEYS = ['beneficiaries', 'legal_beneficiary', 'legal_beneficiary_1_name'];

function cleanNumericValue(val: string | number) {
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace(/,/g, '')) || 0;
}

/**
 * Normalize a single value for diff comparison:
 * - null / undefined / '' / '—' / '–' / '-' → null
 * - currency fields → parse to float with 2 decimals (strip ₱, commas)
 * - other → trimmed string
 */
function normalizeCompareValue(key: string, value: any): string | number | null {
    if (value === null || value === undefined || value === '' || value === '—' || value === '–' || value === '-') {
        return null;
    }

    // Currency fields: strip formatting and parse as float
    if (CURRENCY_FIELDS.includes(key)) {
        const num = cleanNumericValue(value);
        return isNaN(num) ? null : Math.round(num * 100) / 100; // round to 2 decimals
    }

    return String(value).trim();
}

function normalizeBeneficiaries(value: any): Array<Record<string, string>> {
    if (!Array.isArray(value)) return [];

    return value
        .map((beneficiary) => ({
            full_name: String(beneficiary?.full_name ?? '').trim(),
            relationship: String(beneficiary?.relationship ?? '').trim(),
            date_of_birth: String(beneficiary?.date_of_birth ?? '').trim(),
        }))
        .filter((beneficiary) => beneficiary.full_name || beneficiary.relationship || beneficiary.date_of_birth);
}

function getPendingValue(key: string, pending: any): any {
    const pendingValue = pending?.[key];
    if (pendingValue !== undefined) return pendingValue;

    const fallbackKey = PENDING_FALLBACK_KEYS[key];
    return fallbackKey ? pending?.[fallbackKey] : undefined;
}

function formatBeneficiaries(value: any): string {
    if (!value || (Array.isArray(value) && value.length === 0)) return '—';

    if (typeof value === 'string') return value.trim() || '—';

    if (Array.isArray(value)) {
        return value
            .map((b) => {
                if (typeof b === 'object' && b !== null) {
                    const name = b.name || b.full_name || '';
                    const relationship = b.relationship || b.relation || '';
                    return relationship ? `${name} (${relationship})` : name;
                }
                return String(b);
            })
            .filter(Boolean)
            .join('; ');
    }

    return String(value);
}

function beneficiariesChanged(original: any, pending: any): boolean {
    if (!BENEFICIARY_KEYS.some((key) => pending?.[key] !== undefined)) return false;

    const originalBeneficiaries = normalizeBeneficiaries(original?.beneficiaries);
    const pendingBeneficiaries = normalizeBeneficiaries(pending?.beneficiaries);

    if (pending?.beneficiaries !== undefined) {
        return JSON.stringify(originalBeneficiaries) !== JSON.stringify(pendingBeneficiaries);
    }

    if (pending?.legal_beneficiary !== undefined) {
        return normalizeCompareValue('legal_beneficiary', original?.legal_beneficiary ?? original?.legal_beneficiary_1_name) !== normalizeCompareValue('legal_beneficiary', pending.legal_beneficiary);
    }

    return false;
}

/**
 * Fallback map: Some fields in original_data may appear under a different key
 * in pending_data (e.g., form uses permanent_mobile_number, DISPLAY uses mobile_number).
 * When comparing, if the expected key is missing from pending_data, try these fallbacks.
 */
const PENDING_FALLBACK_KEYS: Record<string, string> = {
    mobile_number: 'permanent_mobile_number',
};

function hasChanged(key: string, original: any, pending: any): boolean {
    let origVal = original?.[key];
    let pendVal = pending?.[key];

    // Fallback: if pending doesn't have this key, try the fallback key
    if (pendVal === undefined && PENDING_FALLBACK_KEYS[key]) {
        pendVal = pending?.[PENDING_FALLBACK_KEYS[key]];
    }

    // If the key is absent from the pending payload entirely, it was not edited
    if (pendVal === undefined) return false;

    // Normalize both values for comparison
    const normalizedOrig = normalizeCompareValue(key, origVal);
    const normalizedPend = normalizeCompareValue(key, pendVal);

    // Both null/empty — no change
    if (normalizedOrig === null && normalizedPend === null) {
        return false;
    }

    // Compare normalized values
    return normalizedOrig !== normalizedPend;
}

export default function PendingEdits({ pendingEdits }: Props) {
    const [selectedRequest, setSelectedRequest] = useState<ProfileUpdateRequest | null>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [showAllFields, setShowAllFields] = useState(false);

    const rejectForm = useForm({
        rejection_reason: '',
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isStatusChangeRequest = (request: ProfileUpdateRequest) => {
        return request.request_type === 'status_change' ||
            request.pending_data?.account_status !== undefined ||
            request.pending_data?.proposed_status !== undefined;
    };

    const visiblePendingEdits = useMemo(() => {
        const uniqueById = Array.from(new Map((pendingEdits ?? []).map((edit) => [edit.id, edit])).values());
        const statusChangeRequests = uniqueById.filter(isStatusChangeRequest);

        return uniqueById
            .filter((edit) => {
                if (isStatusChangeRequest(edit)) return true;

                return !statusChangeRequests.some((statusChange) => {
                    const editTime = new Date(edit.created_at).getTime();
                    const statusChangeTime = new Date(statusChange.created_at).getTime();
                    const sameSubmissionWindow = Math.abs(editTime - statusChangeTime) <= 10000;

                    return statusChange.member_id === edit.member_id &&
                        statusChange.requested_by_email === edit.requested_by_email &&
                        sameSubmissionWindow;
                });
            })
            .map((edit) => ({
                ...edit,
                request_type: (isStatusChangeRequest(edit) ? 'status_change' : 'profile_update') as ProfileUpdateRequest['request_type'],
            }));
    }, [pendingEdits]);

    const handleApprove = async (requestId: number) => {
        setProcessingId(requestId);

        router.post(`/dashboards/Gm/PendingEdits/${requestId}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile update approved successfully! Changes have been applied.');
                setSelectedRequest(null);
                setProcessingId(null);
            },
            onError: (errors) => {
                console.error('Error approving edit:', errors);
                toast.error('Failed to approve update. Please try again.');
                setProcessingId(null);
            },
        });
    };

    const handleReject = () => {
        if (!selectedRequest) return;
        if (!rejectForm.data.rejection_reason.trim()) {
            toast.error('Please provide a rejection reason.');
            return;
        }

        setProcessingId(selectedRequest.id);

        rejectForm.post(`/dashboards/Gm/PendingEdits/${selectedRequest.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile update request rejected.');
                setIsRejectDialogOpen(false);
                setSelectedRequest(null);
                rejectForm.reset();
                setProcessingId(null);
            },
            onError: (errors) => {
                console.error('Error rejecting edit:', errors);
                toast.error('Failed to reject update. Please try again.');
                setProcessingId(null);
            },
        });
    };

    const diffFields = useMemo(() => {
        if (!selectedRequest) return { changed: [], unchanged: [] };
        if (selectedRequest.request_type === 'status_change') return { changed: [], unchanged: [] };

        const { original_data, pending_data } = selectedRequest;
        const changedFields: Array<{ key: string; label: string; category: string; original: any; pending: any }> = [];
        const unchangedFields: Array<{ key: string; label: string; category: string; original: any; pending: any }> = [];

        Object.entries(DISPLAY_FIELDS).forEach(([key, config]) => {
            const orig = original_data?.[key];
            const pend = getPendingValue(key, pending_data);
            const changed = hasChanged(key, original_data, pending_data);

            const entry = {
                key,
                label: config.label,
                category: config.category,
                original: orig,
                pending: pend,
            };

            if (changed) {
                changedFields.push(entry);
            } else {
                unchangedFields.push(entry);
            }
        });

        if (beneficiariesChanged(original_data, pending_data)) {
            changedFields.push({
                key: 'beneficiaries',
                label: 'Beneficiaries',
                category: 'Family / Beneficiaries',
                original: original_data?.beneficiaries,
                pending: pending_data?.beneficiaries ?? pending_data?.legal_beneficiary ?? pending_data?.legal_beneficiary_1_name,
            });
        }

        return { changed: changedFields, unchanged: showAllFields ? unchangedFields : [] };
    }, [selectedRequest, showAllFields]);

    // Group changed fields by category
    const changedByCategory = useMemo(() => {
        const groups: Record<string, Array<{ key: string; label: string; category: string; original: any; pending: any }>> = {};
        diffFields.changed.forEach((field) => {
            if (!groups[field.category]) groups[field.category] = [];
            groups[field.category].push(field);
        });
        return groups;
    }, [diffFields.changed]);

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Pending Profile Edits — GM Review" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
                        Pending Edit Requests
                    </h1>
                    <p className="text-muted-foreground">
                        Review and approve/reject Secretary-proposed profile and account status changes
                    </p>
                </div>

                <Separator />

                {!selectedRequest ? (
                    <>
                        {/* Pending Requests List */}
                        {visiblePendingEdits.length > 0 ? (
                            <div className="space-y-4">
                                {visiblePendingEdits.map((edit) => (
                                    <Card
                                        key={edit.id}
                                        className="cursor-pointer transition-all hover:border-emerald-300 hover:shadow-md"
                                        onClick={() => setSelectedRequest(edit)}
                                    >
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                                        <User className="h-6 w-6 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-base">{edit.member_name}</h3>
                                                        <p className="text-sm text-muted-foreground">{edit.member_email}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <FileEdit className="h-3 w-3" />
                                                                {edit.request_type === 'status_change' ? 'Status change' : 'Profile edit'} by: {edit.requested_by_name}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDate(edit.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                                        {edit.request_type === 'status_change' ? `To ${edit.proposed_status}` : 'Pending Review'}
                                                    </Badge>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            </div>
                                            {edit.request_type === 'status_change' && edit.proposed_status === 'inactive' && edit.reason && (
                                                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
                                                        Deactivation Reason
                                                    </p>
                                                    <p className="mt-1 text-sm text-red-800">{edit.reason}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-emerald-900 dark:text-emerald-100">
                                        No Pending Profile Updates
                                    </h3>
                                    <p className="text-muted-foreground max-w-md">
                                        All profile update requests have been reviewed. New submissions from HR will appear here.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                ) : (
                    /* Detail Diff View */
                    <div className="space-y-6">
                        {/* Back Button & Actions */}
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setIsRejectDialogOpen(false);
                                    rejectForm.reset();
                                }}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to List
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowAllFields(!showAllFields)}
                                >
                                    {showAllFields ? (
                                        <><EyeOff className="mr-2 h-4 w-4" /> Show Changes Only</>
                                    ) : (
                                        <><Eye className="mr-2 h-4 w-4" /> Show All Fields</>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Member Info Card */}
                        <Card className="border-emerald-100">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                                        <User className="h-7 w-7 text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold">{selectedRequest.member_name}</h2>
                                        <p className="text-sm text-muted-foreground">{selectedRequest.member_email}</p>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                            <span>Employee ID: {selectedRequest.member_id}</span>
                                            <span>Requested by: {selectedRequest.requested_by_name}</span>
                                            <span>{formatDate(selectedRequest.created_at)}</span>
                                        </div>
                                        {selectedRequest.request_type === 'status_change' && selectedRequest.reason && (
                                            <p className="mt-2 text-sm text-muted-foreground">Reason: {selectedRequest.reason}</p>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-sm px-3 py-1">
                                        Pending GM Review
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Diff View / Status Change Card */}
                        {isStatusChangeRequest(selectedRequest) ? (
                            <Card className="border-red-200 bg-red-50/50">
                                <CardHeader className="border-b border-red-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                            <Shield className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">
                                                Account Status Change Request
                                            </CardTitle>
                                            <CardDescription>
                                                {selectedRequest.proposed_status === 'inactive' ? 'Account Deactivation' : 'Account Reactivation'} Request
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid gap-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-1">Current Account Status</p>
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 capitalize">
                                                    {selectedRequest.original_data?.account_status || 'active'}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-muted-foreground mb-1">Proposed Account Status</p>
                                                <Badge variant={selectedRequest.proposed_status === 'inactive' ? 'destructive' : 'default'} className="capitalize">
                                                    {selectedRequest.proposed_status}
                                                </Badge>
                                            </div>
                                        </div>

                                        {selectedRequest.reason && (
                                            <div className="rounded-lg border border-red-100 bg-white p-4">
                                                <p className="text-sm font-medium text-muted-foreground mb-1">Reason for Request</p>
                                                <p className="text-sm text-red-800">{selectedRequest.reason}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="overflow-hidden">
                                <CardHeader className="bg-muted/30 border-b">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">
                                            Side-by-Side Comparison
                                        </CardTitle>
                                        {diffFields.changed.length > 0 && (
                                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                                                {diffFields.changed.length} field{diffFields.changed.length > 1 ? 's' : ''} changed
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription>
                                        Review the proposed change before approving or rejecting
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Column Headers */}
                                    <div className="grid grid-cols-2 border-b bg-muted/20">
                                        <div className="px-6 py-3 text-sm font-semibold text-muted-foreground border-r">
                                            Current Active Value
                                        </div>
                                        <div className="px-6 py-3 text-sm font-semibold text-emerald-700">
                                            Proposed Secretary Edit
                                        </div>
                                    </div>

                                    {/* Changed Fields by Category */}
                                    {Object.entries(changedByCategory).map(([category, fields]) => (
                                        <div key={category}>
                                            <div className="px-6 py-2 bg-amber-50/50 border-b text-xs font-bold text-amber-800 uppercase tracking-wider">
                                                {category} — Changes Detected
                                            </div>
                                            {fields.map((field) => (
                                                <div key={field.key} className="grid grid-cols-2 border-b hover:bg-emerald-50/30 transition-colors">
                                                    <div className="px-6 py-3 border-r">
                                                        <div className="text-xs text-muted-foreground mb-1">{field.label}</div>
                                                        <div className="text-sm font-medium text-red-600/80 line-through decoration-red-400">
                                                            {formatDisplayValue(field.key, field.original)}
                                                        </div>
                                                    </div>
                                                    <div className="px-6 py-3 bg-emerald-50/50">
                                                        <div className="text-xs text-muted-foreground mb-1">{field.label}</div>
                                                        <div className="text-sm font-semibold text-emerald-700">
                                                            {formatDisplayValue(field.key, field.pending)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    {/* Unchanged Fields (if showAllFields is true) */}
                                    {showAllFields && diffFields.unchanged.length > 0 && (
                                        <div>
                                            <div className="px-6 py-2 bg-muted/40 border-b text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                Unchanged Fields
                                            </div>
                                            {diffFields.unchanged.map((field) => (
                                                <div key={field.key} className="grid grid-cols-2 border-b hover:bg-muted/20 transition-colors">
                                                    <div className="px-6 py-3 border-r">
                                                        <div className="text-xs text-muted-foreground mb-1">{field.label}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {formatDisplayValue(field.key, field.original)}
                                                        </div>
                                                    </div>
                                                    <div className="px-6 py-3">
                                                        <div className="text-xs text-muted-foreground mb-1">{field.label}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {formatDisplayValue(field.key, field.pending)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {diffFields.changed.length === 0 && !showAllFields && (
                                        <div className="px-6 py-12 text-center text-muted-foreground">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>No recognizable changes detected in standard fields.</p>
                                            <p className="text-xs mt-1">Click "Show All Fields" to view the full data.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                size="lg"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                onClick={() => handleApprove(selectedRequest.id)}
                                disabled={processingId !== null}
                            >
                                {processingId === selectedRequest.id ? (
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                )}
                                {processingId === selectedRequest.id ? 'Approving...' : selectedRequest.request_type === 'status_change' ? 'Approve Status Change' : 'Approve Changes'}
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => {
                                    setIsRejectDialogOpen(true);
                                    rejectForm.reset();
                                }}
                                disabled={processingId !== null}
                            >
                                <XCircle className="h-5 w-5 mr-2" />
                                Reject Request
                            </Button>
                        </div>

                        {/* Info Card */}
                        <Card className="border-emerald-100 bg-emerald-50/50">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-sm text-emerald-900">Review Guidelines</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Approving will immediately update the member's active profile with the proposed changes.
                                            Rejecting will discard the changes, and the HR team will be notified with your reason.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Reject Dialog */}
                <Dialog open={isRejectDialogOpen} onOpenChange={(open) => {
                    setIsRejectDialogOpen(open);
                    if (!open) rejectForm.reset();
                }}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <XCircle className="h-5 w-5" />
                                Reject Profile Update Request
                            </DialogTitle>
                            <DialogDescription>
                                You are rejecting the proposed profile changes for{' '}
                                <strong>{selectedRequest?.member_name}</strong>.
                                Please provide a mandatory reason for rejection.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="rejection_reason" className="text-red-700">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="rejection_reason"
                                    placeholder="Enter the reason for rejecting this profile update request..."
                                    value={rejectForm.data.rejection_reason}
                                    onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                    className="min-h-[120px] resize-y border-red-200 focus-visible:ring-red-500/30"
                                    disabled={processingId !== null}
                                />
                                {rejectForm.errors.rejection_reason && (
                                    <p className="text-sm text-red-600">{rejectForm.errors.rejection_reason}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsRejectDialogOpen(false);
                                    rejectForm.reset();
                                }}
                                disabled={processingId !== null}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={processingId !== null || !rejectForm.data.rejection_reason.trim()}
                            >
                                {processingId === selectedRequest?.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <XCircle className="h-4 w-4 mr-2" />
                                )}
                                {processingId === selectedRequest?.id ? 'Rejecting...' : 'Confirm Rejection'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

