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
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    role?: string;
    badgeKey?: keyof NotificationBadges;
    items?: NavItem[];
}

export interface NotificationBadges {
    unreadMemberValidationCount?: number;
    pendingMemberSignupsCount?: number;
    pendingProfileEditsCount?: number;
    pendingComakerRequestsCount?: number;
    pendingGmLoanValidationCount?: number;
    pendingCreditCommitteeCount?: number;
    gmApprovedLoanActionCount?: number;
    hasMemberStatusChanged?: number | boolean;
    unreadNotificationsCount?: number;
}

export interface SharedData {
    name: string;
    auth: Auth;
    notificationBadges: NotificationBadges;
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
    memberProfile?: MemberProfile | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface LoanType {
    id: number;
    name: string;
    interest_rate_per_annum: number;
    max_term_months: number;
    requires_comaker: boolean;
}

export interface MemberProfile {
    user_id: number;
    members_id: string;
    payroll_id?: string | null;
    first_name: string;
    middle_name?: string;
    last_name: string;
    place_of_birth?: string | null;
    date_of_birth: string;
    sex: string;
    civil_status: string;
    educational_attainment?: string | null;
    spouse_name?: string;
    mobile_number: string;
    permanent_mobile_number?: string | null;
    present_address: string;
    present_zip_code?: string | null;
    permanent_address?: string;
    permanent_zip_code?: string | null;
    position: string;
    basic_salary: number;
    income_type?: string | null;
    net_income?: number | null;
    share_capital_balance?: number;
    other_source_of_income?: string | null;
    facebook_account_name?: string | null;
    spouse_occupation?: string | null;
    spouse_gross_income?: number | null;
    spouse_income_type?: string | null;
    spouse_net_income?: number | null;
    legal_beneficiary_1_name?: string | null;
    real_properties_owned?: string | null;
    bank_account_number?: string;
    tin_number?: string;
    profile_picture?: string;
    account_status?: 'active' | 'inactive';
}

export interface EligibleCoMaker {
    id: number;
    name: string;
    email: string;
}

export interface PreviousLoan {
    id: number;
    loan_type_name?: string;
    principal_amount: number;
    total_amount_due: number;
    balance: number | string;
    next_due_date: string | null;
    monthly_amortization: number | string;
    status: string;
    release_date: string | null;
    percent_paid?: number;
}

export interface ApplyLoanProps {
    loanTypes: LoanType[];
    memberProfile?: MemberProfile | null;
    eligibleCoMakers: EligibleCoMaker[];
    previousLoans: PreviousLoan[];
    error?: string;
    hasPendingLoan?: boolean;
    hasAwaitingComaker?: boolean;
    hasActiveLoan?: boolean;
    rejectedAt?: string | null;
    editingLoan?: {
        id: number;
        loan_type_id: number;
        principal_amount: number;
        terms_months: number;
        co_maker_user_id: number | '';
        disbursement_method: string;
    } | null;
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
    rejected_by: string | null;
    rejected_at: string | null;
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
    disbursement_method?: string;
    status: string;
    created_at: string;
    expires_at?: string | null;
    requester: {
        id: number;
        name: string;
        email: string;
        members_id: string;
        position: string;
        mobile_number: string;
        facebook_account_name?: string | null;
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
    disbursement_method?: string;
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
    principal_amount?: number | null;
    interest_amount?: number | null;
    beginning_balance?: number | null;
    ending_balance?: number | null;
    amount_paid: number;
    status: string;
}

export interface MemberActiveLoanPayment {
    id: number;
    amount: number;
    payment_date: string | null;
    reference_number: string | null;
    paid_by: string;
    payment_method?: string | null;
    type?: string;
}

export interface MemberAdvancePaymentInfo {
    outstanding_balance: number;
    regular_deduction_amount: number;
    next_due_date: string | null;
    remaining_installments: number;
    maximum_advance_amount: number;
    is_eligible: boolean;
    eligibility_checks: Array<{ label: string; passed: boolean }>;
    latest_request: {
        id: number;
        status: string;
        requested_amount: number;
        installments_covered: number;
        payment_method: string;
        rejection_reason: string | null;
        created_at: string | null;
        approved_at: string | null;
        verified_at: string | null;
        applied_at: string | null;
    } | null;
}

export interface MemberActiveLoanTransaction {
    id: number;
    date: string | null;
    type: string;
    amount: number;
    remarks: string | null;
    balance_after: number;
    processed_by: string;
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
    settlement?: {
        outstanding_balance: number;
        settlement_amount: number;
        calculation_basis: string;
        is_eligible: boolean;
        eligibility_checks: Array<{ label: string; passed: boolean }>;
        latest_request: {
            id: number;
            status: string;
            settlement_amount: number;
            rejection_reason: string | null;
            created_at: string | null;
            approved_at: string | null;
            verified_at: string | null;
        } | null;
    };
    advance_payment?: MemberAdvancePaymentInfo;
    amortizations: MemberActiveLoanAmortization[];
    payments: MemberActiveLoanPayment[];
    transactions?: MemberActiveLoanTransaction[];
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

export interface ActivityLogActor {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface ActivityLog {
    id: number;
    user_id: number;
    loan_id: number | null;
    action_type: string;
    description: string;
    reject_reason: string | null;
    created_at: string;
    updated_at: string;
    actor: ActivityLogActor | null;
    user: ActivityLogActor | null;
    loan: {
        id: number;
        principal_amount: number;
    } | null;
}

export interface ActivityLogApiResponse {
    data: ActivityLog[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    stats: {
        total: number;
        today: number;
        filtered: number;
    };
    filters: {
        action_types: string[];
    };
}

export interface MemberCompletedLoanProps {
    completedLoans: CompletedLoan[];
    hasCompletedLoans: boolean;
    totalCompletedCount: number;
    totalPrincipalRepaid: number;
    totalInterestPaid: number;
    avgLoanAmount: number;
}

// ======================================================================
// Profile Update Request (Maker-Checker) Types
// ======================================================================

export interface ProfileUpdateRequest {
    id: number;
    member_id: string;
    member_name: string;
    member_email: string;
    requested_by_name: string;
    requested_by_email: string;
    request_type: 'profile_update' | 'status_change';
    proposed_status?: 'active' | 'inactive' | null;
    reason?: string | null;
    original_data: Record<string, any>;
    pending_data: Record<string, any>;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string | null;
    created_at: string;
}

export interface PendingEditsApiResponse {
    data: ProfileUpdateRequest[];
}

export interface PendingEditsProps {
    pendingEdits: ProfileUpdateRequest[];
}
