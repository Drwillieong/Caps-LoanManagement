import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Plus, UsersRound, FileCheck, Archive, Clock, FileText, FilePlus } from 'lucide-react';

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
        icon: Clock,
    },
    {
        title: 'Completed Loan',
        href: '/dashboards/HR/HRCompletedLoan',
        icon: Archive,
    },
      
 
];

const memberNavItems: NavItem[] = [
    {
        title: 'Application Form',
        href: '/dashboards/Member/ApplyLoan',
        icon: FileText,
    },
    {
        title: 'Active Loan',
        href: '/dashboards/Member/MemberActiveLoan',
        icon: Clock,
    },
    {
        title: 'Completed Loan',
        href: '/dashboards/Member/MemberCompletedLoan',
        icon: Archive,
    },
    {
        title: 'User Profile',
        href: '/dashboards/Member/UserProfile',
        icon: UsersRound,
    },

];

const gmNavItems: NavItem[] = [
    {
        title: 'Validate Loan Application',
        href: '/dashboards/Gm/ValidateLoan',
        icon: FileCheck,
    },
    {
        title: 'Active Loan',
        href: '/dashboards/Gm/GMActiveLoan',
        icon: Clock,
    },
    {
        title: 'Completed Loan',
        href: '/dashboards/Gm/GMCompletedLoan',
        icon: Archive,
    },
    
];

const secretaryNavItems: NavItem[] = [
    {
        title: 'Verify Member Profile',
        href: '/dashboards/Secretary/VerifyMemberProfile',
        icon: FileCheck,
    },
    
];

const chairmanNavItems: NavItem[] = [
    
];

const footerNavItems: NavItem[] = [
   
   
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
        case 'secretary':
            roleNavItems = secretaryNavItems;
            break;
        case 'chairman':
            roleNavItems = chairmanNavItems;
            break;
        default:
            roleNavItems = [];
    }

    const allNavItems = [
        ...mainNavItems,
        ...roleNavItems,
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={allNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
