// Existing types...

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

export interface MemberCompletedLoanProps {
    completedLoans: CompletedLoan[];
    hasCompletedLoans: boolean;
    totalCompletedCount: number;
    totalPrincipalRepaid: number;
    totalInterestPaid: number;
    avgLoanAmount: number;
}

