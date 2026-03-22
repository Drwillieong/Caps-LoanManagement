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
    role?: string;
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
    hasActiveLoan?: boolean;
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

export interface ChooseComakerProps {
    members: Array<{
        id: number;
        name: string;
        email: string;
        member_id: string;
        status: 'available' | 'unavailable';
        date_joined: string;
    }>;
}

// GM Validation Types
export interface GmMember {
    id: number;
    name: string;
    email: string;
    member_id: string;
    date_hired: string | null;
    basic_salary: number;
    share_capital_balance: number;
}

export interface GmCoMaker {
    id: number;
    name: string;
    email: string;
    status: string;
}

export interface GmPastLoan {
    id: number;
    loan_type_name: string;
    principal_amount: number;
    total_amount_due: number;
    balance: number;
    status: string;
    release_date: string | null;
    terms_months: number;
}

export interface GmPendingLoan {
    id: number;
    loan_type_name: string;
    principal_amount: number;
    terms_months: number;
    interest_amount: number;
    total_amount_due: number;
    monthly_amortization: number;
    status: string;
    created_at: string;
    member: GmMember;
    co_makers: GmCoMaker[];
    past_loans: GmPastLoan[];
    active_loans_count: number;
}

export interface GmValidateLoanProps {
    pendingLoans: GmPendingLoan[];
}

// GM Loan Application Table Types (simplified for table view)
export interface GmLoanApplicationItem {
    id: number;
    loan_type_name: string;
    principal_amount: number;
    terms_months: number;
    interest_amount: number;
    total_amount_due: number;
    monthly_amortization: number;
    status: string;
    created_at: string;
    member: GmMember;
    co_makers: GmCoMaker[];
}

export interface GmLoanApplicationProps {
    pendingLoans: GmLoanApplicationItem[];
}

export interface LoanTableRow {
    id: number;
    member_id: string;
    member_name: string;
    loan_type: string;
    principal: number;
    terms: number;
    total_due: number;
    date: string;
    status: 'active' | 'completed' | 'pending' | 'overdue';
}

// GM Active Loan Types (for table)
export interface ActiveLoan extends LoanTableRow {
    remaining_balance: number;
    next_due_date: string | null;
    total_paid: number;
}

// Member Active Loan Types
export interface MemberActiveLoanAmortization {
    id: number;
    installment_number: number;
    due_date: string | null;
    amount_due: number;
    amount_paid: number;
    status: string;
}

export interface MemberActiveLoanPayment {
    id: number;
    amount: number;
    payment_date: string | null;
    reference_number: string | null;
    paid_by: string;
}

export interface MemberActiveLoan {
    id: number;
    loan_type_name: string;
    principal_amount: number;
    terms_months: number;
    interest_amount: number;
    total_amount_due: number;
    monthly_amortization: number;
    voucher_number: string | null;
    check_number: string | null;
    release_date: string | null;
    status: string;
    total_paid: number;
    remaining_balance: number;
    progress_percentage: number;
    paid_amortizations: number;
    total_amortizations: number;
    next_due_date: string | null;
    next_due_amount: number;
    payment_status: string;
    amortizations: MemberActiveLoanAmortization[];
    payments: MemberActiveLoanPayment[];
}

export interface MemberActiveLoanProps {
    activeLoans: MemberActiveLoan[];
    hasActiveLoan: boolean;
    totalLoanBalance: number;
    totalAmountPaid: number;
}

export interface CompletedLoan {
    id: number;
    loan_type_name: string;
    principal_amount: number;
    total_amount_due: number;
    total_paid: number;
    interest_amount: number;
    terms_months: number;
    release_date: string | null;
    completion_date: string | null;
    status: string;
    voucher_number?: string | null;
    check_number?: string | null;
    amortizations_count: number;
    payments_count: number;
    co_makers?: Array<{
        id: number;
        member_name: string;
    }>;
}

export interface ActivityLog {
    id: number;
    user_id: number;
    loan_id: number | null;
    action_type: string;
    description: string;
    reject_reason: string | null;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
    };
    loan: {
        id: number;
        principal_amount: number;
    } | null;
}

export interface MemberCompletedLoanProps {
    completedLoans: CompletedLoan[];
    hasCompletedLoans: boolean;
    totalCompletedCount: number;
    totalPrincipalRepaid: number;
    totalInterestPaid: number;
    avgLoanAmount: number;
}

