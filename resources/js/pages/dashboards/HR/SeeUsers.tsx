import { Head, Link, router } from '@inertiajs/react'
import { Plus, Search, Download, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
    basic_salary: number
    share_capital_balance: number
    bank_account_number: string
    tin_number: string
    account_status?: 'active' | 'inactive'
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
    has_pending_update_request?: boolean
    has_rejected_update_request?: boolean
    update_request_rejection_reason?: string | null
}

interface Filters {
    search: string | null
    filter: string
    status: string
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
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Members', href: '/dashboards/HR/SeeUsers' },
]

export default function SeeUsers({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '')
    const [filter, setFilter] = useState(filters.filter || 'all')
    const [status, setStatus] = useState(filters.status || 'all')

    // 1. Filter out users who do not have a member profile or valid employee_id
    const membersOnly = users.data.filter((user) => user.member_profile !== null && user.member_profile?.employee_id)

    const getDisplayStatus = (user: User): 'active' | 'inactive' | 'rejected' | 'pending_gm_approval' => {
        if (user.status === 'pending' || user.status === 'pending_approval') return 'pending_gm_approval'
        if (user.status === 'rejected') return 'rejected'
        if ((user.member_profile?.account_status || 'active') === 'inactive') return 'inactive'
        return 'active'
    }

    const getStatusLabel = (displayStatus: ReturnType<typeof getDisplayStatus>) => {
        if (displayStatus === 'pending_gm_approval') return 'Active'
        if (displayStatus === 'rejected') return 'Rejected'
        if (displayStatus === 'inactive') return 'Inactive'
        return 'Active'
    }

    const getStatusBadgeClass = (displayStatus: ReturnType<typeof getDisplayStatus>) => {
        if (displayStatus === 'active') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        if (displayStatus === 'pending_gm_approval') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        if (displayStatus === 'inactive') return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }

    // 2. Filter by displayed member status
    const filteredMembers = membersOnly.filter((user) => {
        if (status === 'all') return true
        return getDisplayStatus(user) === status
    })

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.reload({ data: { search, filter, status } })
        }, 300)

        return () => clearTimeout(timeout)
    }, [search, filter, status])

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
                user.member_profile?.employee_id || 'N/A',
                getFullName(user),
                user.email,
                user.member_profile?.position || 'N/A',
                user.member_profile ? formatCurrency(user.member_profile.basic_salary) : 'N/A',
                user.member_profile ? formatCurrency(user.member_profile.share_capital_balance) : 'N/A',
                getStatusLabel(getDisplayStatus(user)),
            ])

            autoTable(doc, {
                startY: 40,
                head: [['Employee ID', 'Name', 'Email', 'Position', 'Salary', 'Share Capital', 'Status']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] },
                styles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 15 },
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
                doc.text(`${user.member_profile?.employee_id || user.id} - ${getFullName(user)}`, 14, currentY)
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
                            Manage your team members ({filteredMembers.length})
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
                                Create Member Account
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

                        {/* Status Filter */}
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[260px]">
                                <SelectValue placeholder="active" />
                            </SelectTrigger>
                            <SelectContent>
                                
                                <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="pending_gm_approval">Pending General Manager Approval</SelectItem>
                                
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border bg-background">
                    <table className="min-w-full text-sm">
                        <thead className="border-b bg-muted/40 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium">Member ID</th>
                                <th className="px-6 py-3 text-left font-medium">Name</th>
                                <th className="px-6 py-3 text-left font-medium">Email</th>
                                <th className="px-6 py-3 text-left font-medium">Status</th>
                                <th className="px-6 py-3 text-left font-medium">Joined</th>
                                <th className="px-6 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredMembers.length ? (
                                filteredMembers.map((user) => (
                                    <tr
                                        key={user.member_profile?.employee_id || user.id}
                                        className="border-b transition-colors hover:bg-muted/30"
                                    >
                                        <td className="px-6 py-4 font-medium">
                                            {user.member_profile?.employee_id}
                                        </td>

                                        <td className="px-6 py-4">
                                            <Link 
                                                href={`/dashboards/HR/MembersProfile/${user.member_profile?.employee_id}`}
                                                className="text-primary hover:underline cursor-pointer font-medium"
                                            >
                                                {getFullName(user)}
                                            </Link>
                                        </td>

                                        <td className="px-6 py-4 text-muted-foreground">
                                            {user.email}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(getDisplayStatus(user))}`}
                                                >
                                                    {getStatusLabel(getDisplayStatus(user))}
                                                </span>
                                                {user.has_pending_update_request && (
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2.5 py-0.5 text-xs font-medium">
                                                        Pending Edit
                                                    </span>
                                                )}
                                                {user.has_rejected_update_request && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span>
                                                                    <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2.5 py-0.5 text-xs font-medium cursor-help">
                                                                        Edit Rejected
                                                                    </span>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="max-w-xs">{user.update_request_rejection_reason || 'Profile edit request was rejected.'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-muted-foreground">
                                            {formatDate(user.created_at)}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            {user.status === 'rejected' ? (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link
                                                        href={`/dashboards/HR/RejectedMembers/${user.id}/edit`}
                                                        className="flex items-center gap-1.5"
                                                    >
                                                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                                        Edit &amp; Resubmit
                                                    </Link>
                                                </Button>
                                            ) : user.status === 'pending' || user.status === 'pending_approval' || user.has_pending_update_request ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span>
                                                                <Button variant="ghost" size="sm" disabled>
                                                                    Edit
                                                                </Button>
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Editing disabled while account/edit is pending GM approval</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/dashboards/HR/MembersProfile/${user.member_profile?.employee_id}`}>
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
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
