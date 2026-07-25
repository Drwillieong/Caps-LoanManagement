import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { LiveClock } from '@/components/live-clock'
import { dashboard } from '@/routes'
import { type BreadcrumbItem } from '@/types'
import {
    Users,
    Clock,
    HandCoins,
    CheckCircle2,
    TrendingUp,
    Calendar,
    Briefcase,
    ArrowRight,
    Plus,
} from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Secretary Dashboard',
        href: dashboard().url,
    },
]

interface HrStats {
    total_members: number
    active_members: number
    inactive_members: number
    pending_loans: number
    active_loans: number
    completed_loans: number
    total_loan_portfolio: number
    total_paid_amount: number
    members_with_loans: number
}

interface LoanStatusBreakdown {
    [key: string]: number
}

interface RecentMember {
    id: number
    full_name: string
    email: string
    position: string
    date_hired: string
    created_at: string
}

interface HrDashboardProps {
    stats: HrStats
    loan_status_breakdown: LoanStatusBreakdown
    recent_members: RecentMember[]
}

export default function HrDashboard({
    stats,
    loan_status_breakdown,
    recent_members,
}: HrDashboardProps) {
    const totalLoans = loan_status_breakdown 
        ? Object.values(loan_status_breakdown).reduce((a, b) => a + b, 0)
        : 0

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return 'N/A'
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    if (!stats || !loan_status_breakdown || !recent_members) {
        return (
            <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
                <Head title="HR Dashboard" />
                <div className="flex items-center justify-center h-full p-6">
                    <p className="text-muted-foreground">Loading dashboard data...</p>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="HR Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* ===== KPI CARDS (Same Styling as GM) ===== */}
                <div className="grid gap-4 md:grid-cols-3">
                     <Link href="/dashboards/HR/SeeUsers">
                    <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle  className="text-sm font-medium text-emerald-800 dark:text-emerald-300" >
                                Total Members 
                            </CardTitle>
                            <Users className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_members}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Registered cooperative members
                            </p>
                        </CardContent>
                    </Card>
                    </Link>
                     <Link href="/dashboards/HR/HRActiveLoan">
                    <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                           
                                <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                    Active Loans
                                </CardTitle>
                           
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.active_loans}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Currently running loans
                            </p>
                        </CardContent>
                    </Card></Link>

                    <Card className="border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Pending Loans
                            </CardTitle>
                            <Clock className="h-4 w-4 text-emerald-100" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loan_status_breakdown.pending}
                            </div>
                            <p className="text-xs text-emerald-100 mt-1 italic">
                                Awaiting approval
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ===== MAIN GRID ===== */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Loan Status Overview */}
                    <Card className="lg:col-span-4 border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-emerald-900 dark:text-emerald-100">
                                Loan Status Overview
                            </CardTitle>
                            <CardDescription>
                                Breakdown of all loan statuses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-5">
                                {Object.entries(loan_status_breakdown).map(
                                    ([key, value]) => {
                                        const labelMap: Record<string, string> = {
                                            rejected_by_credit_com: 'Rejected by Credit Committee',
                                            rejected_by_gm: 'Rejected by General Manager',
                                        };
                                        const label = labelMap[key] || key.replace(/_/g, ' ');
                                        return (
                                        <div
                                            key={key}
                                            className="rounded-lg p-4 border bg-emerald-50/60 dark:bg-emerald-950/10 border-emerald-100"
                                        >
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {label}
                                            </p>
                                            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                                {value as number}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {totalLoans > 0
                                                    ? Math.round(
                                                          ((value as number) /
                                                              totalLoans) *
                                                              100
                                                      )
                                                    : 0}
                                                % of total
                                            </p>
                                        </div>
                                        );
                                    }
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Members */}
                    <Card className="lg:col-span-3 border-emerald-100">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-emerald-900 dark:text-emerald-100">
                                    Recent Members
                                </CardTitle>
                                <CardDescription>
                                    Newly added members (30 days)
                                </CardDescription>
                            </div>
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
                                    {recent_members.map((member: any) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100"
                                        >
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {member.full_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {member.email}
                                                </p>
                                            </div>
                                            <div className="text-right text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <Briefcase className="h-3 w-3" />
                                                    {member.position}
                                                </div>
                                                <div className="flex items-center gap-1 justify-end">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(
                                                        member.created_at
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
                                    <p className="font-medium">
                                        No recent members
                                    </p>
                                    <p className="text-sm">
                                        New members will appear here
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ===== QUICK ACTIONS (Styled Like GM Tip Box) ===== */}
                <Card className="border-emerald-100">
                    <CardHeader>
                        <CardTitle className="text-emerald-900 dark:text-emerald-100">
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-4 gap-4">
                            <Link
                                href="/dashboards/HR/create"
                                className="flex items-center justify-between p-4 rounded-lg border hover:bg-emerald-50 transition group"
                            >
                                <div>
                                    <p className="font-medium">
                                        Create Member Account
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Add new cooperative member
                                    </p>
                                </div>
                                <Plus className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="/dashboards/HR/HRActiveLoan"
                                className="flex items-center justify-between p-4 rounded-lg border hover:bg-emerald-50 transition group"
                            >
                                <div>
                                    <p className="font-medium">
                                        Active Loans
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {stats.active_loans} active loans
                                    </p>
                                </div>
                                <HandCoins className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="/dashboards/HR/HRCompletedLoan"
                                className="flex items-center justify-between p-4 rounded-lg border hover:bg-emerald-50 transition group"
                            >
                                <div>
                                    <p className="font-medium">
                                        Completed Loans
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {stats.completed_loans} completed
                                    </p>
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}