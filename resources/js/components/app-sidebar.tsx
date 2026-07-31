import { Link, usePage } from '@inertiajs/react';
import {
    BadgeDollarSign,
    Banknote,
    CheckCircle2,
    ClipboardCheck,
    FileClock,
    FileEdit,
    FilePlus,
    FileSpreadsheet,
    FileText,
    History,
    LayoutGrid,
    Logs,
    ShieldCheck,
    UserCircle2,
    Users,
    UsersRound,
    WalletCards,
} from 'lucide-react';

import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';

import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
];

const hrNavItems: NavItem[] = [
    {
        title: 'Members',
        href: '/dashboards/HR/SeeUsers',
        icon: UsersRound,
    },
    {
        title: 'Active Loan',
        href: '/dashboards/HR/HRActiveLoan',
        icon: BadgeDollarSign,
    },
    {
        title: 'Completed Loan',
        href: '/dashboards/HR/HRCompletedLoan',
        icon: CheckCircle2,
    },
];

const memberNavItems: NavItem[] = [
    {
        title: 'Application',
        icon: FilePlus,
        items: [
            {
                title: 'Application Form',
                href: '/dashboards/Member/ApplyLoan',
                icon: FileText,
            },
            {
                title: 'Choose CoMaker',
                href: '/dashboards/Member/ChooseComaker',
                icon: UsersRound,
            },
            {
                title: 'Pending Application',
                href: '/dashboards/Member/PendingApplication',
                icon: FileClock,
                badgeKey: 'hasMemberStatusChanged',
            },
             {
        title: 'Pending CoMaker Review',
        href: '/dashboards/Member/CoMaker',
        icon: UsersRound,
        badgeKey: 'pendingComakerRequestsCount',
    },
            
        ],
    },
    {
        title: 'Loans',
        icon: WalletCards,
        items: [
            {
                title: 'Active Loan',
                href: '/dashboards/Member/ShowActiveLoans',
                icon: Banknote,
            },
            {
                title: 'Completed Loan',
                href: '/dashboards/Member/MemberCompletedLoan',
                icon: CheckCircle2,
            },
        ],
    },
    {
        title: 'User Profile',
        href: '/dashboards/Member/UserProfile',
        icon: UserCircle2,
    },
   
];

const gmNavItems: NavItem[] = [
    {
        title: 'Members',
        icon: Users,
        items: [
            {
                title: 'Member Application',
                href: '/dashboards/Gm/MemberValidate',
                icon: Users,
                badgeKey: 'unreadMemberValidationCount',
            },
            {
                title: 'Bulk Upload Members',
                href: '/dashboards/Gm/BulkUploadMembers',
                icon: FileSpreadsheet,
            },
            {
                title: 'Profile Updates',
                href: '/dashboards/Gm/PendingEdits',
                icon: FileEdit,
            },
        ],
    },
    {
        title: 'Application',
        icon: ClipboardCheck,
        items: [
            {
                title: 'Create Application',
                href: '/dashboards/Gm/CreateApplication',
                icon: FilePlus,
            },
            {
                title: 'Pending Application',
                href: '/dashboards/Gm/LoanApplication',
                icon: FileClock,
                badgeKey: 'pendingGmLoanValidationCount',
            },
            {
                title: 'Approved Loan',
                href: '/dashboards/Gm/ApprovedLoan',
                icon: ShieldCheck,
                badgeKey: 'gmApprovedLoanActionCount',
            },
        ],
    },
    {
        title: 'Loan',
        icon: WalletCards,
        items: [
            {
                title: 'Active Loan',
                href: '/dashboards/Gm/GMActiveLoan',
                icon: Banknote,
            },
            {
                title: 'Completed Loan',
                href: '/dashboards/Gm/GMCompletedLoan',
                icon: History,
            },
            {
                title: 'Upload Payroll',
                href: '/dashboards/Gm/UploadSalaryDeduct',
                icon: FileSpreadsheet,
            },
        ],
    },
];

const creditcomNavItems: NavItem[] = [
    {
        title: 'Loan Application',
        href: '/dashboards/CreditCom/LoanApplication',
        icon: FileText,
        badgeKey: 'pendingCreditCommitteeCount',
    },
    {
        title: 'Approved Loan',
        href: '/dashboards/CreditCom/ApprovedHistory',
        icon: ShieldCheck,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Activity Log',
        href: '/dashboards/Gm/ActivityLog',
        icon: Logs,
        role: 'gm',
    },
    {
        title: 'Activity Log',
        href: '/dashboards/HR/SecActivityLog',
        icon: Logs,
        role: 'hr',
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const userRole = auth.user.role;

    let roleNavItems: NavItem[] = [];

    switch (userRole) {
        case 'hr':
            roleNavItems = hrNavItems;
            break;
        case 'member':
            roleNavItems = memberNavItems;
            break;
        case 'gm':
            roleNavItems = gmNavItems;
            break;
        case 'creditcom':
            roleNavItems = creditcomNavItems;
            break;
        default:
            roleNavItems = [];
    }

    const allNavItems = [...mainNavItems, ...roleNavItems];

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-sidebar-border/50 shadow-sm"
        >
            <SidebarHeader className="border-b border-sidebar-border/30 p-3 pt-4">
                <SidebarMenu>
                    <SidebarMenuItem className="flex justify-center">
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="group flex h-14 w-full items-center justify-center rounded-xl transition-all duration-300 hover:bg-sidebar-accent/50 hover:shadow-md"
                        >
                            <Link
                                href={dashboard()}
                                prefetch
                                className="flex h-full w-full items-center justify-center"
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={allNavItems} />
            </SidebarContent>

            <SidebarFooter className="mt-auto border-t border-sidebar-border/30 pt-3">
                <NavFooter
                    items={footerNavItems}
                    className="px-1 pb-2"
                    userRole={userRole}
                />
                <div className="mx-3 my-3 h-px rounded-full bg-gradient-to-r from-sidebar-primary/50 via-transparent to-sidebar-primary/30" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
