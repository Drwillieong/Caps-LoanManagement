import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { 
    Users, 
    UserX,
    Clock, 
    HandCoins, 
    CheckCircle, 
    TrendingUp,
    Calendar,
    Briefcase,
    ArrowRight,
    Plus,
    FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'HR Dashboard',
        href: dashboard().url,
    },
];

interface RecentMember {
    id: number;
    full_name: string;
    email: string;
    position: string;
    date_hired: string | null;
    created_at: string;
}

interface Stats {
    total_members: number;
    active_members: number;
    inactive_members: number;
    pending_loans: number;
    active_loans: number;
    completed_loans: number;
    total_loan_portfolio: number;
    total_paid_amount: number;
    members_with_loans: number;
}

interface LoanStatusBreakdown {
    pending: number;
    approved: number;
    released: number;
    paid_off: number;
    rejected: number;
}

interface HrDashboardProps {
    stats: Stats;
    loan_status_breakdown: LoanStatusBreakdown;
    recent_members: RecentMember[];
}

export default function HrDashboard({ 
    stats, 
    loan_status_breakdown, 
    recent_members 
}: HrDashboardProps) {
    
    // Format currency
    function formatCurrency(amount: number | string): string {
        if (amount === null || amount === undefined || amount === '') return '₱0.00';
        
        const number = typeof amount === 'string' ? Number(amount) : amount;
        
        if (isNaN(number)) return '₱0.00';
        
        return `₱${number.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    // Format date
    function formatDate(dateStr: string | null): string {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    // Calculate total loans
    const totalLoans = Object.values(loan_status_breakdown).reduce((a, b) => a + b, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="HR Dashboard" />

            <div className="flex flex-col gap-6 p-6">

                {/* === HEADER === */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">HR Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Overview of members and loan status
                        </p>
                    </div>
                </div>

                {/* === MEMBER STATS CARDS === */}
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                    {/* Total Members */}
                    <Card className="border-l-4 border-l-blue-500 shadow-md">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Members</p>
                                    <p className="text-3xl font-bold">{stats.total_members}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Loans */}
                    <Card className="border-l-4 border-l-blue-500 shadow-md">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Loans</p>
                                    <p className="text-3xl font-bold">{stats.active_loans}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                    <TrendingUp className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Completed Loans */}
                    <Card className="border-l-4 border-l-green-500 shadow-md">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Completed Loans</p>
                                    <p className="text-3xl font-bold">{stats.completed_loans}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                

                {/* === LOAN STATUS BREAKDOWN === */}
                <Card className="shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5" />
                            Loan Status Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            {/* Pending */}
                            <div className="rounded-lg bg-orange-50 p-4 border border-orange-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    <p className="text-sm text-orange-700">Pending</p>
                                </div>
                                <p className="text-2xl font-bold text-orange-700">{loan_status_breakdown.pending}</p>
                                <p className="text-xs text-orange-600 mt-1">
                                    {totalLoans > 0 ? Math.round((loan_status_breakdown.pending / totalLoans) * 100) : 0}% of total
                                </p>
                            </div>

                            {/* Approved */}
                            <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                    <p className="text-sm text-blue-700">Approved</p>
                                </div>
                                <p className="text-2xl font-bold text-blue-700">{loan_status_breakdown.approved}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {totalLoans > 0 ? Math.round((loan_status_breakdown.approved / totalLoans) * 100) : 0}% of total
                                </p>
                            </div>

                            {/* Released */}
                            <div className="rounded-lg bg-purple-50 p-4 border border-purple-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-purple-600" />
                                    <p className="text-sm text-purple-700">Released</p>
                                </div>
                                <p className="text-2xl font-bold text-purple-700">{loan_status_breakdown.released}</p>
                                <p className="text-xs text-purple-600 mt-1">
                                    {totalLoans > 0 ? Math.round((loan_status_breakdown.released / totalLoans) * 100) : 0}% of total
                                </p>
                            </div>

                            {/* Paid Off */}
                            <div className="rounded-lg bg-green-50 p-4 border border-green-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <p className="text-sm text-green-700">Paid Off</p>
                                </div>
                                <p className="text-2xl font-bold text-green-700">{loan_status_breakdown.paid_off}</p>
                                <p className="text-xs text-green-600 mt-1">
                                    {totalLoans > 0 ? Math.round((loan_status_breakdown.paid_off / totalLoans) * 100) : 0}% of total
                                </p>
                            </div>

                            {/* Rejected */}
                            <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserX className="h-4 w-4 text-red-600" />
                                    <p className="text-sm text-red-700">Rejected</p>
                                </div>
                                <p className="text-2xl font-bold text-red-700">{loan_status_breakdown.rejected}</p>
                                <p className="text-xs text-red-600 mt-1">
                                    {totalLoans > 0 ? Math.round((loan_status_breakdown.rejected / totalLoans) * 100) : 0}% of total
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* === RECENT MEMBERS & QUICK ACTIONS === */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Members */}
                    <Card className="shadow-md">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5" />
                                Recent Members (30 days)
                            </CardTitle>
                            <Link
                                href="/dashboards/HR/SeeUsers"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                                View All <ArrowRight className="h-4 w-4" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recent_members.length > 0 ? (
                                <div className="space-y-4">
                                    {recent_members.map((member) => (
                                        <div 
                                            key={member.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                    <span className="text-sm font-medium text-primary">
                                                        {member.full_name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/dashboards/HR/MembersProfile/${member.id}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {member.full_name}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Briefcase className="h-3 w-3" />
                                                    {member.position}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(member.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">No recent members</p>
                                    <p className="text-sm">New members will appear here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="h-5 w-5" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3">
                                <Link
                                    href="/dashboards/HR/create"
                                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200">
                                            <Plus className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Create New Member</p>
                                            <p className="text-xs text-muted-foreground">Add a new member to the system</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                </Link>

                                <Link
                                    href="/dashboards/HR/SeeUsers"
                                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200">
                                            <Users className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">View All Members</p>
                                            <p className="text-xs text-muted-foreground">Manage existing members</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                </Link>

                                <Link
                                    href="/dashboards/HR/HRActiveLoan"
                                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 group-hover:bg-purple-200">
                                            <HandCoins className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">View Active Loans</p>
                                            <p className="text-xs text-muted-foreground">{stats.active_loans} active loans</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                </Link>

                                <Link
                                    href="/dashboards/HR/HRCompletedLoan"
                                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 group-hover:bg-indigo-200">
                                            <CheckCircle className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">View Completed Loans</p>
                                            <p className="text-xs text-muted-foreground">{stats.completed_loans} completed loans</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </AppLayout>
    );
}
