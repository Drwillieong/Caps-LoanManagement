import { Head, Link } from '@inertiajs/react'
import { Plus } from 'lucide-react'

import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { type BreadcrumbItem } from '@/types'


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Members',
        href: '/users',
    },
]

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Members" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900  px-2">
                            Members
                        </h1>
                        <p className="text-sm text-gray-500 px-2">
                            Manage all registered members
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/users/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create member
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                        type="text"
                        placeholder="Search members..."
                        className="w-full sm:max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                  
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-50">
                          
                        </thead>

                        <tbody>
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-12 text-center text-sm text-gray-500"
                                >
                                    No members found.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    )
}
