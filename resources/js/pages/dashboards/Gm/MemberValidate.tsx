import { Head, router, useForm } from '@inertiajs/react';
import {
    Search,
    CheckCircle2,
    XCircle,
    User,
    ArrowLeft,
    Calendar,
    MapPin,
    Briefcase,
    Heart,
    FileText,
    Clock,
    ShieldCheck,
    Wallet,
    Building2,
    DollarSign,
    PhilippinePeso,
    AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LiveClock } from '@/components/live-clock';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { type BreadcrumbItem } from '@/types';

interface MemberProfile {
    employee_id: string;
    payroll_id: string | null;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    place_of_birth: string | null;
    date_of_birth: string | null;
    sex: string | null;
    civil_status: string | null;
    educational_attainment: string | null;
    position: string | null;
    date_hired: string | null;
    basic_salary: number | null;
    income_type: string | null;
    net_income: number | null;
    share_capital_balance: number | null;
    other_source_of_income: string | null;
    facebook_account_name: string | null;
    mobile_number: string | null;
    permanent_mobile_number: string | null;
    present_address: string | null;
    present_zip_code: string | null;
    permanent_address: string | null;
    permanent_zip_code: string | null;
    spouse_occupation: string | null;
    spouse_gross_income: number | null;
    spouse_income_type: string | null;
    spouse_net_income: number | null;
    legal_beneficiary_1_name: string | null;
    real_properties_owned: string | null;
}

interface PendingMember {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    name: string;
    email: string;
    status: string;
    created_at: string;
    member_profile: MemberProfile | null;
}

interface Props {
    pendingMembers: PendingMember[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboards/Gm/GmDashboard' },
    { title: 'Member Validation', href: '/dashboards/Gm/MemberValidate' },
];

const detailBreadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboards/Gm/GmDashboard' },
    { title: 'Member Validation', href: '/dashboards/Gm/MemberValidate' },
    { title: 'Member Review', href: '#' },
];

function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
}

function formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatDateShort(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getInitials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function InfoGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            {children}
        </div>
    );
}

function InfoField({ label, value, isCurrency = false, isDate = false }: { label: string; value: string | number | null | undefined; isCurrency?: boolean; isDate?: boolean }) {
    let displayValue: string;
    if (value === null || value === undefined || value === '') {
        displayValue = '—';
    } else if (isCurrency) {
        displayValue = formatCurrency(value as number);
    } else if (isDate) {
        displayValue = formatDate(String(value));
    } else {
        displayValue = String(value);
    }

    return (
        <div className="flex flex-col gap-0.5 py-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
            <span className="text-sm font-semibold text-foreground">{displayValue}</span>
        </div>
    );
}

function SectionCard({ title, icon: Icon, description, children, className = '' }: { title: string; icon: React.ElementType; description?: string; children: React.ReactNode; className?: string }) {
    return (
        <Card className={`overflow-hidden ${className}`}>
            <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        {description && <CardDescription className="text-xs">{description}</CardDescription>}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {children}
            </CardContent>
        </Card>
    );
}

export default function MemberValidate({ pendingMembers }: Props) {
    const [view, setView] = useState<'queue' | 'detail'>('queue');
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [selectedMember, setSelectedMember] = useState<PendingMember | null>(null);
    const [showRejectForm, setShowRejectForm] = useState(false);

    const rejectForm = useForm({
        rejection_reason: '',
    });

    const filteredMembers = pendingMembers.filter((member) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
            member.name.toLowerCase().includes(term) ||
            member.email.toLowerCase().includes(term) ||
            (member.member_profile?.employee_id || '').toLowerCase().includes(term) ||
            member.first_name.toLowerCase().includes(term) ||
            member.last_name.toLowerCase().includes(term)
        );
    });

    const profile = selectedMember?.member_profile;

    const openDetail = (member: PendingMember) => {
        setSelectedMember(member);
        setView('detail');
        setShowRejectForm(false);
        rejectForm.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const backToQueue = () => {
        setView('queue');
        setSelectedMember(null);
        setShowRejectForm(false);
        rejectForm.reset();
    };

    const handleApprove = (memberId: number) => {
        if (!confirm('Are you sure you want to approve this member? A welcome email with credentials will be sent.')) {
            return;
        }

        setProcessingId(memberId);
        router.post(
            `/dashboards/Gm/Member/${memberId}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Member approved successfully! Welcome email sent with credentials.');
                    setProcessingId(null);
                    backToQueue();
                },
                onError: () => {
                    toast.error('Failed to approve member. Please try again.');
                    setProcessingId(null);
                },
            }
        );
    };

    const handleReject = () => {
        if (!rejectForm.data.rejection_reason.trim()) {
            toast.error('Please provide a rejection reason.');
            return;
        }

        if (!selectedMember) return;

        setProcessingId(selectedMember.id);
        rejectForm.post(
            `/dashboards/Gm/Member/${selectedMember.id}/reject`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Member registration rejected. HR has been notified.');
                    setProcessingId(null);
                    setShowRejectForm(false);
                    rejectForm.reset();
                    backToQueue();
                },
                onError: () => {
                    toast.error('Failed to reject member. Please try again.');
                    setProcessingId(null);
                },
            }
        );
    };

    const toggleRejectForm = () => {
        setShowRejectForm((prev) => !prev);
        if (showRejectForm) {
            rejectForm.reset();
        }
    };

    const meetsFinancialCriteria = profile
        ? (profile.basic_salary && profile.basic_salary > 0) &&
          (profile.share_capital_balance && profile.share_capital_balance > 0)
        : false;

    return (
        <AppLayout breadcrumbs={view === 'detail' ? detailBreadcrumbs : breadcrumbs} headerRight={<LiveClock />}>
            <Head title={view === 'detail' ? 'Member Review' : 'Member Validation'} />

            <div className="min-h-screen">
                {view === 'queue' && (
                    <div className="space-y-6 px-6 py-8 animate-in fade-in duration-300">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight">Member Validation</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Review and validate pending member registrations awaiting GM approval.
                                </p>
                            </div>
                        </div>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="relative w-full lg:max-w-sm">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name, email, or employee ID..."
                                        className="pl-9"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {filteredMembers.length > 0 ? (
                            <Card className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="border-b bg-muted/40">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Member</th>
                                                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Employee ID</th>
                                                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Position</th>
                                                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Applied On</th>
                                                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMembers.map((member) => (
                                                <tr key={member.id} className="border-b transition-colors hover:bg-muted/30">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                                {getInitials(member.first_name, member.last_name)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{member.name}</p>
                                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs">
                                                        {member.member_profile?.employee_id || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {member.member_profile?.position || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {formatDateShort(member.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => openDetail(member)}>
                                                                <User className="mr-1.5 h-3.5 w-3.5" />
                                                                Review
                                                            </Button>
                                                          
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ) : (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                        <FileText className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-1">
                                        {search ? 'No matching members found' : 'No pending member registrations'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">
                                        {search
                                            ? 'Try adjusting your search criteria to find what you are looking for.'
                                            : 'All member registrations have been processed. New submissions will appear here.'}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {view === 'detail' && selectedMember && (
                    <div className="animate-in fade-in duration-300">
                        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                            <div className="px-6 py-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Button variant="ghost" size="icon" onClick={backToQueue} className="h-8 w-8">
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                        <div>
                                            <h2 className="text-sm font-semibold leading-tight">Member Review</h2>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedMember.name} — {selectedMember.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                            onClick={() => handleApprove(selectedMember.id)}
                                            disabled={processingId === selectedMember.id}
                                        >
                                            {processingId === selectedMember.id ? (
                                                <Spinner className="mr-2 h-4 w-4" />
                                            ) : (
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                            )}
                                            Approve
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={toggleRejectForm}
                                            disabled={processingId === selectedMember.id}
                                            className="shadow-sm"
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            {showRejectForm ? 'Cancel' : 'Reject'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showRejectForm && (
                            <div className="mx-6 mt-6 animate-in slide-in-from-top-2 duration-200">
                                <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/10">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            <CardTitle className="text-red-800 dark:text-red-300">Reject Member Registration</CardTitle>
                                        </div>
                                        <CardDescription>
                                            You are rejecting <strong>{selectedMember.name}</strong> ({selectedMember.email}). HR will be notified with the reason below.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="rejection-reason" className="text-red-700 dark:text-red-400">
                                                Rejection Reason <span className="text-red-500">*</span>
                                            </Label>
                                            <Textarea
                                                id="rejection-reason"
                                                value={rejectForm.data.rejection_reason}
                                                onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                                placeholder="Enter the reason for rejection. This will be sent to HR and the applicant..."
                                                className="min-h-[120px] resize-y border-red-200 focus-visible:ring-red-500/30 dark:border-red-800"
                                                disabled={processingId === selectedMember.id}
                                            />
                                            {rejectForm.errors.rejection_reason && (
                                                <p className="text-sm text-red-600 dark:text-red-400">{rejectForm.errors.rejection_reason}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 px-6 py-4">
                                        <Button variant="outline" onClick={toggleRejectForm} disabled={processingId === selectedMember.id}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleReject}
                                            disabled={processingId === selectedMember.id || !rejectForm.data.rejection_reason.trim()}
                                        >
                                            {processingId === selectedMember.id && <Spinner className="mr-2 h-4 w-4" />}
                                            Confirm Rejection
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        )}

                        <div className="space-y-6 px-6 py-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary shrink-0">
                                            {getInitials(selectedMember.first_name, selectedMember.last_name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                                <h3 className="text-2xl font-bold tracking-tight">{selectedMember.name}</h3>
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300">
                                                    Pending Validation
                                                </Badge>
                                                {meetsFinancialCriteria && (
                                                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-400">
                                                        <ShieldCheck className="mr-1 h-3 w-3" />
                                                        Financial Criteria Met
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-3">{selectedMember.email}</p>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    ID: #{selectedMember.id}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    Applied {formatDateShort(selectedMember.created_at)}
                                                </span>
                                                {profile && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Briefcase className="h-3.5 w-3.5" />
                                                        {profile.position || 'N/A'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {profile ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <SectionCard title="Personal Profile" icon={User} description="Basic personal information">
                                        <InfoGrid>
                                            <InfoField label="Family Name" value={profile.last_name} />
                                            <InfoField label="First Name" value={profile.first_name} />
                                            <InfoField label="Middle Name" value={profile.middle_name} />
                                            <InfoField label="Sex" value={profile.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : null} />
                                            <InfoField label="Civil Status" value={profile.civil_status ? profile.civil_status.charAt(0).toUpperCase() + profile.civil_status.slice(1) : null} />
                                            <InfoField label="Date of Birth" value={profile.date_of_birth} isDate />
                                            <InfoField label="Place of Birth" value={profile.place_of_birth} />
                                            <InfoField label="Educational Attainment" value={profile.educational_attainment} />
                                        </InfoGrid>
                                    </SectionCard>

                                    <SectionCard title="Contact & Addresses" icon={MapPin} description="Address and contact details">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Present Address</p>
                                                <p className="text-sm font-medium">
                                                    {profile.present_address || '—'}
                                                    {profile.present_zip_code && <span className="text-muted-foreground ml-1">({profile.present_zip_code})</span>}
                                                </p>
                                            </div>
                                            <Separator />
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Permanent Address</p>
                                                <p className="text-sm font-medium">
                                                    {profile.permanent_address || '—'}
                                                    {profile.permanent_zip_code && <span className="text-muted-foreground ml-1">({profile.permanent_zip_code})</span>}
                                                </p>
                                            </div>
                                            <Separator />
                                            <InfoGrid>
                                                <InfoField label="Mobile Number" value={profile.mobile_number} />
                                                <InfoField label="Cellphone Number" value={profile.permanent_mobile_number} />
                                                <InfoField label="Facebook Account" value={profile.facebook_account_name} />
                                                <InfoField label="Email" value={selectedMember.email} />
                                            </InfoGrid>
                                        </div>
                                    </SectionCard>

                                    <SectionCard title="Employment & Financial Assessment" icon={Briefcase} description="Employment and income details">
                                        <InfoGrid>
                                            <InfoField label="Employee ID" value={profile.employee_id} />
                                            <InfoField label="Payroll ID" value={profile.payroll_id} />
                                            <InfoField label="Position" value={profile.position} />
                                            <InfoField label="Date Hired" value={profile.date_hired} isDate />
                                            <InfoField label="Income Type" value={profile.income_type} />
                                        </InfoGrid>
                                        <Separator className="my-4" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Card className="bg-muted/30 border-dashed">
                                                <CardContent className="pt-4 pb-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Income</span>
                                                    </div>
                                                    <p className="text-lg font-bold">{formatCurrency(profile.basic_salary)}</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-muted/30 border-dashed">
                                                <CardContent className="pt-4 pb-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Income</span>
                                                    </div>
                                                    <p className="text-lg font-bold">{formatCurrency(profile.net_income)}</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                        <Separator className="my-4" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Card className="bg-muted/30 border-dashed">
                                                <CardContent className="pt-4 pb-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Share Capital</span>
                                                    </div>
                                                    <p className="text-lg font-bold">{formatCurrency(profile.share_capital_balance)}</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-muted/30 border-dashed">
                                                <CardContent className="pt-4 pb-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Other Income</span>
                                                    </div>
                                                    <p className="text-lg font-medium">{profile.other_source_of_income || '—'}</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </SectionCard>

                                    <SectionCard title="Assets & Family" icon={Heart} description="Spouse, beneficiaries and properties">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Spouse Information</p>
                                                <InfoGrid>
                                                    <InfoField label="Spouse Occupation" value={profile.spouse_occupation} />
                                                    <InfoField label="Spouse Income Type" value={profile.spouse_income_type} />
                                                    <InfoField label="Spouse Gross Income" value={profile.spouse_gross_income} isCurrency />
                                                    <InfoField label="Spouse Net Income" value={profile.spouse_net_income} isCurrency />
                                                </InfoGrid>
                                            </div>
                                            <Separator />
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Beneficiary & Properties</p>
                                                <InfoGrid>
                                                    <InfoField label="Legal Beneficiary" value={profile.legal_beneficiary_1_name} />
                                                    <InfoField label="Real Properties Owned" value={profile.real_properties_owned} />
                                                </InfoGrid>
                                            </div>
                                        </div>
                                    </SectionCard>
                                </div>
                            ) : (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                            <User className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-1 text-muted-foreground">No Profile Data Available</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            This member account exists but has no submitted profile information. Approvals should be made with caution.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
