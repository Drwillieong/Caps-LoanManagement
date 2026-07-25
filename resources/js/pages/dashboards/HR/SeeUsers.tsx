import { Head, Link, router } from '@inertiajs/react'
import { Plus, Search, Filter, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { LiveClock } from '@/components/live-clock'
import { type BreadcrumbItem } from '@/types'

interface MemberProfile {
    employee_id: string
    payroll_id: string | null
    date_of_birth: string
    sex: string
    civil_status: string
    spouse_name: string | null
    mobile_number: string
    present_address: string
    permanent_address: string
    position: string
    date_hired: string
    basic_salary: number
    share_capital_balance: number
    bank_account_number: string
    tin_number: string
}

interface User {
    id: number
    first_name: string
    middle_name: string | null
    last_name: string
    email: string
    role: string
    is_active: boolean
    status: string
    rejection_reason: string | null
    created_at: string
    updated_at: string
    member_profile: MemberProfile | null
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
    { title: 'Members', href: '/dashboards/HR/SeeUsers' },
]

export default function SeeUsers({ users, filters, roles }: Props) {
    const [search, setSearch] = useState(filters.search || '')
    const [filter, setFilter] = useState(filters.filter || 'all')
    const [role, setRole] = useState(filters.role || 'all')

    // 1. Filter out users who do not have a member profile
    const membersOnly = users.data.filter((user) => user.member_profile !== null)

    // 2. Extract only the roles that belong to users with active member profiles
    const activeMemberRoles = Array.from(
        new Set(
            users.data
                .filter((user) => user.member_profile !== null)
                .map((user) => user.role)
        )
    )

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.reload({ data: { search, filter, role } })
        }, 300)

        return () => clearTimeout(timeout)
    }, [search, filter, role])

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })

    const getFullName = (user: User) => {
        return `${user.first_name}${user.middle_name ? ' ' + user.middle_name : ''} ${user.last_name}`.trim()
    }

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount)

    const exportPDF = async () => {
        try {
            const response = await fetch('/dashboards/HR/SeeUsers?export=true', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })
            
            if (!response.ok) {
                throw new Error('Failed to fetch data')
            }
            
            const data = await response.json()
            
            // Filter PDF content to only include users with profiles
            const allUsers = (data.users || []).filter((user: User) => user.member_profile !== null)

            if (!allUsers || allUsers.length === 0) {
                alert('No members found to export')
                return
            }

            const doc = new jsPDF()
        
            doc.setFontSize(18)
            doc.setFont('helvetica', 'bold')
            doc.text('Members Report', 14, 20)
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 28)
            doc.text(`Total Members: ${allUsers.length}`, 14, 34)

            const tableData = allUsers.map((user: User) => [
                user.id,
                getFullName(user),
                user.email,
                user.member_profile?.employee_id || 'N/A',
                user.member_profile?.position || 'N/A',
                user.member_profile ? formatCurrency(user.member_profile.basic_salary) : 'N/A',
                user.member_profile ? formatCurrency(user.member_profile.share_capital_balance) : 'N/A',
                user.role,
                user.is_active ? 'Active' : 'Inactive',
            ])

            autoTable(doc, {
                startY: 40,
                head: [['ID', 'Name', 'Email', 'Employee ID', 'Position', 'Salary', 'Share Capital', 'Role', 'Status']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] },
                styles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 20 },
                    7: { cellWidth: 15 },
                    8: { cellWidth: 15 },
                },
            })

            let currentY = (doc as any).lastAutoTable.finalY + 15
            
            allUsers.forEach((user: User) => {
                if (currentY > 250) {
                    doc.addPage()
                    currentY = 20
                }

                doc.setFontSize(12)
                doc.setFont('helvetica', 'bold')
                doc.text(`#${user.id} - ${getFullName(user)}`, 14, currentY)
                currentY += 7

                doc.setFontSize(10)
                doc.setFont('helvetica', 'normal')

                if (user.member_profile) {
                    const details = [
                        ['Employee ID:', user.member_profile.employee_id],
                        ['Payroll ID:', user.member_profile.payroll_id || 'N/A'],
                        ['Date of Birth:', formatDate(user.member_profile.date_of_birth)],
                        ['Sex:', user.member_profile.sex],
                        ['Civil Status:', user.member_profile.civil_status],
                        ['Spouse Name:', user.member_profile.spouse_name || 'N/A'],
                        ['Mobile Number:', user.member_profile.mobile_number],
                        ['Present Address:', user.member_profile.present_address],
                        ['Permanent Address:', user.member_profile.permanent_address],
                        ['Position:', user.member_profile.position],
                        ['Date Hired:', formatDate(user.member_profile.date_hired)],
                        ['Basic Salary:', formatCurrency(user.member_profile.basic_salary)],
                        ['Share Capital Balance:', formatCurrency(user.member_profile.share_capital_balance)],
                        ['Bank Account Number:', user.member_profile.bank_account_number || 'N/A'],
                        ['TIN Number:', user.member_profile.tin_number || 'N/A'],
                    ]

                    details.forEach(([label, value]) => {
                        doc.text(`${label} ${value}`, 14, currentY)
                        currentY += 5
                    })
                }

                currentY += 10
            })

            doc.save('Members_Report.pdf')
        } catch (error) {
            console.error('Error exporting PDF:', error)
            alert('Failed to export PDF. Please try again.')
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Members" />

            <div className="space-y-8 px-6 py-8">

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Members
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your team members ({membersOnly.length})
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportPDF()}>
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                        <Button asChild>
                            <Link href="/dashboards/HR/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Member
                            </Link>
                        </Button>
                    </div>
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

                        {/* Role Dropdown - dynamically filtered to only show roles belonging to active members */}
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm bg-background"
                        >
                            <option value="all">All Roles</option>
                            {activeMemberRoles.map((r) => (
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
                                <th className="px-6 py-3 text-left font-medium">Status</th>
                                <th className="px-6 py-3 text-left font-medium">Joined</th>
                                <th className="px-6 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {membersOnly.length ? (
                                membersOnly.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b transition-colors hover:bg-muted/30"
                                    >
                                        <td className="px-6 py-4 font-medium">
                                            #{user.id}
                                        </td>

                                        <td className="px-6 py-4">
                                            <Link 
                                                href={`/dashboards/HR/MembersProfile/${user.id}`}
                                                className="text-primary hover:underline cursor-pointer font-medium"
                                            >
                                                {getFullName(user)}
                                            </Link>
                                        </td>

                                        <td className="px-6 py-4 text-muted-foreground">
                                            {user.email}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                                                {user.role}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                    user.status === 'active'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : user.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}
                                            >
                                                {user.status === 'pending' ? 'Pending' : user.status === 'active' ? 'Active' : 'Rejected'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-muted-foreground">
                                            {formatDate(user.created_at)}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboards/HR/MembersProfile/${user.id}`}>
                                                    Edit
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
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