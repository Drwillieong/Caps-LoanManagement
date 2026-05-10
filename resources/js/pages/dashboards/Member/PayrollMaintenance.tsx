import { Head } from '@inertiajs/react';
import { Building2, LoaderCircle } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface PayrollMaintenanceProps {
    processing?: {
        active: boolean;
        message: string | null;
        started_at: string | null;
    };
}

export default function PayrollMaintenance({ processing }: PayrollMaintenanceProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Update In Progress" />

            <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center bg-muted/20 px-4 py-10">
                <section className="w-full max-w-xl rounded-lg border bg-background p-8 text-center shadow-sm">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Building2 className="size-7" />
                    </div>

                    <div className="mt-6 space-y-2">
                        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
                            Cooperative Loan Management
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Payroll update in progress
                        </h1>
                        <p className="text-muted-foreground">
                            Payroll deductions are currently being updated. Please wait.
                        </p>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                        <LoaderCircle className="size-4 animate-spin text-emerald-600" />
                        <span>
                            {processing?.started_at
                                ? `Processing started ${new Date(processing.started_at).toLocaleString()}`
                                : 'Processing payroll deductions'}
                        </span>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
