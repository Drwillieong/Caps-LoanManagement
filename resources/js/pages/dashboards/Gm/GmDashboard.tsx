import { Head, Link } from '@inertiajs/react';
import { 
    TrendingUp, 
    Users, 
    Wallet, 
    FileClock, 
    CheckCircle2, 
    AlertCircle,
    ArrowRight
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'GM Dashboard',
        href: dashboard().url,
    },
];

// Types for GM Dashboard props
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
}

export default function GmDashboard({ 
    stats, 
    recent_pending_loans, 
    loan_health, 
    business_loans_over_100k 
}: GmDashboardProps) {
    
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

    // Calculate percentage change (mock calculation - you can adjust based on actual previous month data)
    const portfolioChange = stats.total_amount_due > 0 
        ? Math.round(((stats.total_paid_amount) / stats.total_amount_due) * 100) - 100
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="GM Dashboard" />
            
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* KPI Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Total Loan Portfolio</CardTitle>
                            <Wallet className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_loan_portfolio)}</div>
                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                                <TrendingUp className="size-3" /> 
                                {portfolioChange >= 0 ? '+' : ''}{portfolioChange}% from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 bg-white/50 dark:bg-emerald-950/10 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Active Members</CardTitle>
                            <Users className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_members}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total active members</p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                            <FileClock className="h-4 w-4 text-emerald-100" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending_approvals}</div>
                            <p className="text-xs text-emerald-100 mt-1 italic">
                                {stats.pending_approvals > 0 ? 'Action required by GM' : 'No pending approvals'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Recent Loan Activity - Takes up 4 columns */}
                    <Card className="lg:col-span-4 border-emerald-100">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-emerald-900 dark:text-emerald-100">Recent Applications</CardTitle>
                                <CardDescription>Loan requests awaiting your final signature.</CardDescription>
                            </div>
                            {recent_pending_loans.length > 0 && (
                                <Link
                                    href="/dashboards/Gm/ValidateLoan"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                    View All <ArrowRight className="h-4 w-4" />
                                </Link>
                            )}
                        </CardHeader>
                        <CardContent>
                            {recent_pending_loans.length > 0 ? (
                                <div className="space-y-4">
                                    {recent_pending_loans.map((loan) => (
                                        <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">{loan.member_name}</span>
                                                <span className="text-xs text-muted-foreground">{loan.loan_type} Loan</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono font-medium text-emerald-700">{formatCurrency(loan.total_amount_due)}</span>
                                                <div className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase font-bold">
                                                    <AlertCircle className="size-3" />
                                                    Review
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
                                    <p className="font-medium">No pending applications</p>
                                    <p className="text-sm">All loan applications have been processed</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary / Health - Takes up 3 columns */}
                    <Card className="lg:col-span-3 border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-emerald-900 dark:text-emerald-100">Loan Health</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                             <div className="flex items-center gap-4">
                                <div className="bg-emerald-100 p-2 rounded-lg">
                                    <CheckCircle2 className="text-emerald-600 size-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-muted-foreground italic">Collections Rate</p>
                                    <div className="h-2 w-full bg-emerald-100 rounded-full mt-1">
                                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${loan_health.collection_rate}%` }} />
                                    </div>
                                </div>
                                <span className="text-sm font-bold">{loan_health.collection_rate}%</span>
                             </div>

                             {/* Loan Statistics */}
                             <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                                    <p className="text-xs text-blue-600 font-medium">Active Loans</p>
                                    <p className="text-xl font-bold text-blue-700">{loan_health.active_loans}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                                    <p className="text-xs text-green-600 font-medium">Completed</p>
                                    <p className="text-xl font-bold text-green-700">{loan_health.completed_loans}</p>
                                </div>
                             </div>

                             {business_loans_over_100k > 0 && (
                                <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100">
                                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-2">GM Tip</h4>
                                    <p className="text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/80">
                                        There are <strong>{business_loans_over_100k}</strong> business loans exceeding ₱100k. Ensure you review the collateral documentation before approving.
                                    </p>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

