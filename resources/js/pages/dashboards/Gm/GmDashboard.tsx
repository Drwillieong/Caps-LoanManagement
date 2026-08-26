import { Head, Link } from '@inertiajs/react';
import {
    TrendingUp,
    Users,
    Wallet,
    FileClock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    FileText,
    UserCheck,
    ShieldCheck,
    DollarSign,
    Activity,
    CreditCard,
    PiggyBank,
    BarChart3,
    Landmark,
    FileEdit,
    UserX,
    ClipboardCheck,
    ArrowUpRight,
    ArrowDownRight,
    Shield,
    Settings,
    BookOpen,
    Upload,
    Eye,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import { validateLoan, pendingEdits, pendingMembers, activityLog } from '@/routes/gm';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'GM Dashboard',
        href: dashboard().url,
    },
];

interface GmStats {
    total_loan_portfolio: number;
    active_members: number;
    pending_approvals: number;
    total_paid_amount: number;
    total_amount_due: number;
}

interface RecentPendingLoan {
    id: number;
    member_name: string;
    loan_type: string;
    principal_amount: number;
    total_amount_due: number;
    created_at: string;
}

interface LoanHealth {
    collection_rate: number;
    completed_loans: number;
    active_loans: number;
}

interface GmDashboardProps {
    stats: GmStats;
    recent_pending_loans: RecentPendingLoan[];
    loan_health: LoanHealth;
    business_loans_over_100k: number;
    total_share_capital: number;
    monthly_collections: number;
    monthly_disbursements: number;
    active_loan_count: number;
    approved_loan_count: number;
    pending_edits_count: number;
    pending_deactivation_count: number;
    pending_members_count: number;
    recent_pending_edits: Array<{
        id: number;
        member_name: string;
        request_type: string;
        proposed_status?: string;
        requested_by_name: string;
        created_at: string;
    }>;
    recent_pending_members: Array<{
        id: number;
        name: string;
        email: string;
        position: string;
        created_at: string;
    }>;
    recent_active_loans: Array<{
        id: number;
        member_name: string;
        loan_type: string;
        principal: number;
        total_due: number;
        status: string;
        release_date: string;
    }>;
    recent_approved_loans: Array<{
        id: number;
        member_name: string;
        loan_type: string;
        principal: number;
        total_due: number;
        status: string;
    }>;
}

function formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined || amount === '') return '₱0.00';

    const number = typeof amount === 'string' ? Number(amount) : amount;

    if (isNaN(number)) return '₱0.00';

    return `₱${number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatCompact(amount: number): string {
    if (amount >= 1000000) {
        return `₱${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `₱${(amount / 1000).toFixed(1)}K`;
    }
    return `₱${amount.toFixed(2)}`;
}

function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p.charAt(0)).join('').slice(0, 2).toUpperCase();
}

function StatusBadge({ status, variant = 'secondary' }: { status: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }) {
    const map: Record<string, { label: string; className: string }> = {
        pending_gm_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 border-amber-300' },
        pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 border-amber-300' },
        approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        released: { label: 'Active', className: 'bg-blue-100 text-blue-800 border-blue-300' },
        active: { label: 'Active', className: 'bg-blue-100 text-blue-800 border-blue-300' },
        paid_off: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        inactive: { label: 'Inactive', className: 'bg-rose-100 text-rose-800 border-rose-300' },
        rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-300' },
        rejected_by_gm: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-300' },
        status_change: { label: 'Status Change', className: 'bg-orange-100 text-orange-800 border-orange-300' },
        profile_update: { label: 'Profile Edit', className: 'bg-sky-100 text-sky-800 border-sky-300' },
    };

    const config = map[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-300' };

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
}

export default function GmDashboard({
    stats,
    recent_pending_loans,
    loan_health,
    business_loans_over_100k,
    total_share_capital,
    monthly_collections,
    monthly_disbursements,
    active_loan_count,
    approved_loan_count,
    pending_edits_count,
    pending_deactivation_count,
    pending_members_count,
    recent_pending_edits,
    recent_pending_members,
    recent_active_loans,
    recent_approved_loans,
}: GmDashboardProps) {
    const collectionRate = Math.min(100, Math.max(0, loan_health.collection_rate || 0));
    const combinedPending = (stats.pending_approvals || 0) + pending_edits_count + pending_members_count;

    const quickLinks = [
        { title: 'Loan Applications', href: '/dashboards/Gm/LoanApplication', icon: FileText, desc: 'Process and review loan requests', badge: stats.pending_approvals > 0 ? stats.pending_approvals : null },
        { title: 'Loan Validation', href: '/dashboards/Gm/ValidateLoan', icon: ClipboardCheck, desc: 'Validate pending loan applications', badge: stats.pending_approvals > 0 ? stats.pending_approvals : null },
        { title: 'Member Registry', href: '/dashboards/Gm/MemberValidate', icon: Users, desc: 'Validate new member registrations', badge: pending_members_count > 0 ? pending_members_count : null },
        { title: 'Pending Edits', href: '/dashboards/Gm/PendingEdits', icon: FileEdit, desc: 'Review profile & status changes', badge: pending_edits_count > 0 ? pending_edits_count : null },
        { title: 'Active Loans', href: '/dashboards/Gm/GMActiveLoan', icon: Wallet, desc: 'Monitor active loan accounts', badge: null },
        { title: 'Financial Reports', href: '/dashboards/Gm/ApprovedLoan', icon: BarChart3, desc: 'Loan approvals and reports', badge: approved_loan_count > 0 ? approved_loan_count : null },
        { title: 'System Audit Logs', href: '/dashboards/Gm/ActivityLog', icon: BookOpen, desc: 'Track administrative activities', badge: null },
        { title: 'Bulk Upload', href: '/dashboards/Gm/BulkUploadMembers', icon: Upload, desc: 'Import members in bulk', badge: null },
    ];

    const actionItems = [
        ...(stats.pending_approvals > 0 ? [{
            id: 'loans',
            title: 'Loan Applications',
            count: stats.pending_approvals,
            href: '/dashboards/Gm/ValidateLoan',
            icon: FileText,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
        }] : []),
        ...(pending_edits_count > 0 ? [{
            id: 'edits',
            title: 'Profile & Status Edits',
            count: pending_edits_count,
            href: '/dashboards/Gm/PendingEdits',
            icon: FileEdit,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
            border: 'border-sky-200',
        }] : []),
        ...(pending_deactivation_count > 0 ? [{
            id: 'deactivations',
            title: 'Account Deactivations',
            count: pending_deactivation_count,
            href: '/dashboards/Gm/PendingEdits',
            icon: UserX,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-200',
        }] : []),
        ...(pending_members_count > 0 ? [{
            id: 'members',
            title: 'New Member Registrations',
            count: pending_members_count,
            href: '/dashboards/Gm/MemberValidate',
            icon: UserCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
        }] : []),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="GM Executive Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                       
                    </h1>
                    <p className="text-muted-foreground">
                        
                    </p>
                </div>

                {/* KPI Summary Cards - Top Row */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-slate-200 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Outstanding Principal
                            </CardTitle>
                            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.total_loan_portfolio)}</div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Activity className="h-3 w-3" />
                                <span>{active_loan_count} active loans</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Combined Pending Actions
                            </CardTitle>
                            <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
                                <FileClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{combinedPending}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Across loans, members & edits
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Total Share Capital
                            </CardTitle>
                            <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
                                <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(total_share_capital)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.active_members} active member accounts
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Monthly Collections
                            </CardTitle>
                            <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
                                <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(monthly_collections)}</div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <span>Disbursed: {formatCurrency(monthly_disbursements)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actionable Priority Section - Middle */}
                <div className="grid gap-4 lg:grid-cols-7">
                    {/* Pending Action Items Feed - Left 4 cols */}
                    <Card className="lg:col-span-4 border-slate-200 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <CardTitle className="text-base text-slate-900 dark:text-slate-100">Pending Action Items</CardTitle>
                                <CardDescription>Direct shortcuts for items awaiting your approval</CardDescription>
                            </div>
                            {actionItems.length > 0 && (
                                <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                                    {actionItems.length} urgent
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="pt-4">
                            {actionItems.length > 0 ? (
                                <div className="grid gap-3">
                                    {actionItems.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${item.bg} ${item.border}`}
                                        >
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                                                <item.icon className={`h-5 w-5 ${item.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</h4>
                                                <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {item.count}
                                                </span>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                                        <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">All Caught Up</h3>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                        No pending approvals, profile edits, or member validations at this time.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Financial Health - Right 3 cols */}
                    <Card className="lg:col-span-3 border-slate-200 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-base text-slate-900 dark:text-slate-100">Financial Health</CardTitle>
                            <CardDescription>Collections performance and portfolio overview</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 flex flex-col gap-5">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Collection Rate
                                    </span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {collectionRate}%
                                    </span>
                                </div>
                                <Progress value={collectionRate} className="h-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 p-3">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active Loans</p>
                                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{loan_health.active_loans}</p>
                                </div>
                                <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 p-3">
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Completed</p>
                                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{loan_health.completed_loans}</p>
                                </div>
                                <div className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-3">
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pending GM</p>
                                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.pending_approvals}</p>
                                </div>
                                <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Approved</p>
                                    <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{approved_loan_count}</p>
                                </div>
                            </div>

                            {business_loans_over_100k > 0 && (
                                <div className="rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2">
                                            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">High-Value Business Loans</h4>
                                            <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                                                <strong>{business_loans_over_100k}</strong> loan(s) exceeding ₱100k need collateral review before approval.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Approval Pipeline - Active & Approved Loans */}
                <div className="grid gap-4 lg:grid-cols-7">
                    <Card className="lg:col-span-4 border-slate-200 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <CardTitle className="text-base text-slate-900 dark:text-slate-100">Loan Approval Pipeline</CardTitle>
                                <CardDescription>Recent approved and disbursed loans</CardDescription>
                            </div>
                            <Link href="/dashboards/Gm/GMActiveLoan" className="text-xs text-primary hover:underline flex items-center gap-1">
                                View All <ArrowRight className="h-3 w-3" />
                            </Link>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {recent_active_loans.length > 0 || recent_approved_loans.length > 0 ? (
                                <div className="space-y-3">
                                    {recent_active_loans.map((loan) => (
                                        <div key={`active-${loan.id}`} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                    <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{loan.member_name}</span>
                                                    <p className="text-xs text-muted-foreground">{loan.loan_type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{formatCurrency(loan.total_due)}</span>
                                                <StatusBadge status={loan.status} />
                                            </div>
                                        </div>
                                    ))}
                                    {recent_approved_loans.map((loan) => (
                                        <div key={`approved-${loan.id}`} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                                    <ClipboardCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{loan.member_name}</span>
                                                    <p className="text-xs text-muted-foreground">{loan.loan_type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{formatCurrency(loan.total_due)}</span>
                                                <StatusBadge status={loan.status} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                        <FileText className="h-7 w-7 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No Loans in Pipeline</h3>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                        Active and approved loans will appear here.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Feed - Right 3 cols */}
                    <Card className="lg:col-span-3 border-slate-200 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-base text-slate-900 dark:text-slate-100">Recent Activity</CardTitle>
                            <CardDescription>Pending members and profile edits</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                {recent_pending_members.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <UserCheck className="h-3.5 w-3.5" />
                                            Member Registrations
                                        </h4>
                                        <div className="space-y-2">
                                            {recent_pending_members.slice(0, 3).map((member) => (
                                                <div key={`member-${member.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <Avatar className="h-8 w-8 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                                                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate block">{member.name}</span>
                                                        <span className="text-xs text-muted-foreground truncate">{member.position || 'N/A'}</span>
                                                    </div>
                                                    <StatusBadge status="pending" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {recent_pending_edits.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <FileEdit className="h-3.5 w-3.5" />
                                            Profile & Status Edits
                                        </h4>
                                        <div className="space-y-2">
                                            {recent_pending_edits.slice(0, 4).map((edit) => (
                                                <div key={`edit-${edit.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                                                        <FileEdit className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate block">{edit.member_name}</span>
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {edit.request_type === 'status_change' ? `Change to ${edit.proposed_status}` : 'Profile update'}
                                                        </span>
                                                    </div>
                                                    <StatusBadge status={edit.request_type} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {recent_pending_members.length === 0 && recent_pending_edits.length === 0 && (
                                    <div className="text-center py-8">
                                        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30 text-emerald-600" />
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No pending activity</p>
                                        <p className="text-xs text-muted-foreground">All profile edits and member registrations are up to date.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Management Links - Bottom */}
                <div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 tracking-wide uppercase truncate">
                        Quick Management Links
                    </h2>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.title}
                                href={link.href}
                                className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all text-center group"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                                    <link.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-tight break-words">{link.title}</span>
                                {link.badge && (
                                    <span className="text-[10px] font-bold bg-red-100 text-red-800 rounded-full px-2 py-0.5">
                                        {link.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}