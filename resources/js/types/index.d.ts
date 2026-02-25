import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    role: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface LoanType {
    id: number;
    name: string;
    interest_rate_per_annum: number;
    max_term_months: number;
    requires_comaker: boolean;
}

export interface MemberProfile {
    date_hired: string;
    basic_salary: number;
    share_capital_balance: number;
}

export interface EligibleCoMaker {
    id: number;
    name: string;
    email: string;
}

export interface PreviousLoan {
    id: number;
    loan_type_name: string;
    principal_amount: number;
    total_amount_due: number;
    balance: number;
    next_due_date: string | null;
    monthly_amortization: number;
    status: string;
    release_date: string | null;
}

export interface ApplyLoanProps {
    loanTypes: LoanType[];
    memberProfile: MemberProfile;
    eligibleCoMakers: EligibleCoMaker[];
    previousLoans: PreviousLoan[];
    error?: string;
    hasAwaitingComaker?: boolean;
    editingLoan?: {
        id: number;
        loan_type_id: number;
        principal_amount: number;
        terms_months: number;
        co_maker_user_id: number | '';
    };
}

export interface PendingApplicationLoan {
    id: number;
    loan_type_name: string;
    principal_amount: number;
    terms_months: number;
    interest_amount: number;
    total_amount_due: number;
    monthly_amortization: number;
    status: string;
    remarks: string | null;
    created_at: string;
    co_makers: Array<{
        id: number;
        name: string;
        email: string;
        status: string;
    }>;
}

export interface PendingApplicationProps {
    loan: PendingApplicationLoan | null;
    hasPendingLoan: boolean;
    loanHistory: PendingApplicationLoan[];
}

export interface CoMakerRequest {
    id: number;
    loan_id: number;
    loan_type_name: string;
    principal_amount: number;
    terms_months: number;
    interest_amount: number;
    total_amount_due: number;
    monthly_amortization: number;
    status: string;
    created_at: string;
    requester: {
        id: number;
        name: string;
        email: string;
    };
}

export interface CoMakerProps {
    coMakerRequests: CoMakerRequest[];
}
