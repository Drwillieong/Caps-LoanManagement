import { Head, Link, router } from '@inertiajs/react'
import { Plus, Search, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'

import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { type BreadcrumbItem } from '@/types'

interface User {
    id: number
    name: string
    email: string
    role: string
    created_at: string
    updated_at: string
}

interface Filters {
    search: string | null
    filter: string
    role: string
}

interface Props {
    users: {
        data: User[]
        current_page: number
        last_page: number
        per_page: number
        total: number
        links: any[]
    }
    filters: Filters
    roles: string[]
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Members', href: '/users' },
]

export default function Index({ users, filters, roles }: Props) {
    const [search, setSearch] = useState(filters.search || '')
    const [filter, setFilter] = useState(filters.filter || 'all')
    const [role, setRole] = useState(filters.role || 'all')

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                '/users',
                { search, filter, role },
                { preserveState: true, replace: true }
            )
        }, 300)

        return () => clearTimeout(timeout)
    }, [search, filter, role])

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })

    return (
       <AppLayout breadcrumbs={breadcrumbs}>
    <Head title="Members" />

    <div className="space-y-8 px-6 py-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                    Members
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage your team members ({users.total})
                </p>
            </div>

            <Button asChild>
                <Link href="/users/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Member
                </Link>
            </Button>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl border bg-background p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                {/* Search */}
                <div className="relative w-full lg:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by ID, name, or email..."
                        className="w-full rounded-lg border bg-background pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                {/* Filter */}
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm bg-background"
                >
                    <option value="all">All Members</option>
                    <option value="new">New (30 days)</option>
                    <option value="old">Old</option>
                </select>

                {/* Role */}
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm bg-background"
                >
                    <option value="all">All Roles</option>
                    {roles.map((r) => (
                        <option key={r} value={r}>
                            {r.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border bg-background">
            <table className="min-w-full text-sm">
                <thead className="border-b bg-muted/40 text-muted-foreground">
                    <tr>
                        <th className="px-6 py-3 text-left font-medium">ID</th>
                        <th className="px-6 py-3 text-left font-medium">Name</th>
                        <th className="px-6 py-3 text-left font-medium">Email</th>
                        <th className="px-6 py-3 text-left font-medium">Role</th>
                        <th className="px-6 py-3 text-left font-medium">Joined</th>
                        <th className="px-6 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {users.data.length ? (
                        users.data.map((user) => (
                            <tr
                                key={user.id}
                                className="border-b transition-colors hover:bg-muted/30"
                            >
                                <td className="px-6 py-4 font-medium">
                                    #{user.id}
                                </td>

                                <td className="px-6 py-4">
                                    {user.name}
                                </td>

                                <td className="px-6 py-4 text-muted-foreground">
                                    {user.email}
                                </td>

                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                                        {user.role}
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-muted-foreground">
                                    {formatDate(user.created_at)}
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm">
                                        Edit
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={6}
                                className="py-12 text-center text-muted-foreground"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-sm font-medium">
                                        No members found
                                    </p>
                                    <p className="text-xs">
                                        Try adjusting your search or filters.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
</AppLayout>

    )
}
