import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Plus, UsersRound, Archive, Clock, FileText, FilePlus } from 'lucide-react';

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
        title: 'Choose CoMaker',
        href: '/dashboards/Member/ChooseComaker',
        icon: UsersRound,
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
    ...mainNavItems.filter(item => item.title !== 'Dashboard'), // Avoid duplicate dashboard
    {
        title: 'Loan Application',
        href: '/dashboards/Gm/LoanApplication',
        icon: FileText,
    },
    {
        title: 'Approved Loan',
        href: '/dashboards/Gm/ApprovedLoan',
        icon: BookOpen,
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

const creditcomNavItems: NavItem[] = [
    {
        title: 'Loan Application',
        href: '/dashboards/CreditCom/LoanApplication',
        icon: FileText,
    },
    {
       
        title: 'Activity Log',
        href: '/dashboards/Gm/ActivityLog',
        icon: Clock,
    },

    
];

const footerNavItems: NavItem[] = [
    {
        title: 'Activity Log',
        href: '/dashboards/Gm/ActivityLog',
        icon: Clock,
        role: 'gm'
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

    const allNavItems = [
        ...mainNavItems,
        ...roleNavItems,
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border/50 shadow-sm">
          <SidebarHeader className="p-3 pt-4 border-b border-sidebar-border/30">
            <SidebarMenu>
              <SidebarMenuItem className="flex justify-center">
                <SidebarMenuButton
                  size="lg"
                  asChild
                  className="h-14 w-full flex items-center justify-center transition-all duration-300 hover:shadow-md hover:bg-sidebar-accent/50 rounded-xl group"
                >
                  <Link href={dashboard()} prefetch className="flex items-center justify-center w-full h-full">
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
                <NavFooter items={footerNavItems} className="px-1 pb-2" userRole={userRole} />
                <div className="h-px mx-3 my-3 bg-gradient-to-r from-sidebar-primary/50 via-transparent to-sidebar-primary/30 rounded-full" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
