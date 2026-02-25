import { Head, Link, usePage } from '@inertiajs/react';
import { LiveClock } from '@/components/live-clock';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { FileText, Clock, CheckCircle, HandCoins, Wallet, Users, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Member Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    comakerRequestCount?: number;
}

export default function MemberDashboard({ comakerRequestCount = 0 }: DashboardProps) {
    const [coMakerCount, setCoMakerCount] = useState(comakerRequestCount);

    // Fetch co-maker request count on mount
    useEffect(() => {
        fetch('/dashboards/Member/CoMaker/Count')
            .then(res => res.json())
            .then(data => {
                if (data.count !== undefined) {
                    setCoMakerCount(data.count);
                }
            })
            .catch(err => console.error('Error fetching co-maker count:', err));
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Member Dashboard" />

            <div className="flex flex-col gap-6 p-6">

                {/* === CO-MAKER NOTIFICATION BANNER === */}
                {coMakerCount > 0 && (
                    <Card className="border-l-4 border-l-orange-500 bg-orange-50">
                        <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                                    <Bell className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-orange-800">
                                        You have {coMakerCount} pending co-maker request{coMakerCount > 1 ? 's' : ''}!
                                    </p>
                                    <p className="text-sm text-orange-700">
                                        A member has selected you as their co-maker. Please review and respond.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/dashboards/Member/CoMaker"
                                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 transition"
                            >
                                View Requests
                            </Link>
                        </CardContent>
                    </Card>
                )}

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
                        className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition block relative ${
                            coMakerCount > 0 ? 'border-orange-300 bg-orange-50' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Co-Maker Requests</p>
                                <h2 className="text-2xl font-bold">{coMakerCount}</h2>
                            </div>
                            <Users className={`h-8 w-8 ${coMakerCount > 0 ? 'text-orange-600' : 'text-orange-600'}`} />
                        </div>
                        {coMakerCount > 0 && (
                            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                {coMakerCount}
                            </div>
                        )}
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
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted transition ${
                                coMakerCount > 0 ? 'border-orange-300 bg-orange-50 text-orange-700' : ''
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            {coMakerCount > 0 ? `Co-Maker Requests (${coMakerCount})` : 'Choose Co-Maker'}
                        </Link>

                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
