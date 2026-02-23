import { Head, Link } from '@inertiajs/react';
import { LiveClock } from '@/components/live-clock';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { FileText, Clock, CheckCircle, HandCoins, Wallet, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Member Dashboard',
        href: dashboard().url,
    },
];

export default function MemberDashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Member Dashboard" />

            <div className="flex flex-col gap-6 p-6">

                {/* === STAT CARDS === */}
                <div className="grid gap-6 md:grid-cols-5">

                    {/* Active Loan */}
                    <Link
                        href="/dashboards/Member/ActiveLoan?tab=active"
                        className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition block"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Loan</p>
                                <h2 className="text-2xl font-bold">1</h2>
                            </div>
                            <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                    </Link>

                    {/* Completed Loan */}
                    <Link
                        href="/dashboards/Member/CompletedLoan?tab=completed"
                        className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition block"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Completed Loans</p>
                                <h2 className="text-2xl font-bold">3</h2>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </Link>

                    {/* Shared Capital */}
                    <div className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Shared Capital</p>
                                <h2 className="text-2xl font-bold">₱ 50,000</h2>
                            </div>
                            <Wallet className="h-8 w-8 text-indigo-600" />
                        </div>
                    </div>

                    {/* Loan Balance */}
                    <div className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Loan Balance</p>
                                <h2 className="text-2xl font-bold">₱ 25,000</h2>
                            </div>
                            <HandCoins className="h-8 w-8 text-purple-600" />
                        </div>
                    </div>

                    {/* Co-Maker Requests */}
                    <Link
                        href="/dashboards/Member/CoMaker"
                        className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition block"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Co-Maker Requests</p>
                                <h2 className="text-2xl font-bold">1</h2>
                            </div>
                            <Users className="h-8 w-8 text-orange-600" />
                        </div>
                    </Link>

                </div>

                {/* === QUICK ACTION SECTION === */}
                <div className="rounded-2xl border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Quick Actions</h2>
                    </div>

                    <div className="flex flex-wrap gap-4">

                        <Link
                            href="/dashboards/Member/ApplyLoan"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white hover:opacity-90 transition"
                        >
                            <FileText className="h-4 w-4" />
                            Apply for Loan
                        </Link>

                        <Link
                            href="/dashboards/Member/PendingApplication"
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted transition"
                        >
                            <Clock className="h-4 w-4" />
                            View Pending Application
                        </Link>

                        <Link
                            href="/dashboards/Member/CoMaker"
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted transition"
                        >
                            <Users className="h-4 w-4" />
                            Choose Co-Maker
                        </Link>

                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
