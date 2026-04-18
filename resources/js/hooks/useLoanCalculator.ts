import { useMemo } from 'react';

interface LoanType {
  id: number;
  name: string;
  interest_rate_per_annum: number;
}

interface MemberSearchResult {
  id: number;
  name: string;
  basic_salary: number;
  share_capital_balance: number;
}

interface UseLoanCalculatorProps {
  loanTypes: LoanType[];
  principalAmount: string;
  termsMonths: string;
  loanTypeId: string;
  selectedMember: MemberSearchResult | null;
}

interface Computed {
  interest: string;
  total: string;
  monthly: string;
}

export function useLoanCalculator({
  loanTypes,
  principalAmount,
  termsMonths,
  loanTypeId,
  selectedMember,
}: UseLoanCalculatorProps) {
  return useMemo(() => {
    if (!loanTypes.length || !principalAmount || !termsMonths || !loanTypeId || !selectedMember) {
      return null;
    }

    const principal = parseFloat(principalAmount.replace(/,/g, '')) || 0;
    const terms = parseFloat(termsMonths) || 0;
    const selectedLoanType = loanTypes.find((type) => type.id === Number(loanTypeId));
    const rate = selectedLoanType?.interest_rate_per_annum ?? 0;

    if (principal <= 0 || terms <= 0) return null;

    const interest = (principal * (rate / 100)) * (terms / 12);
    const total = principal + interest;
    const monthly = total / terms;

    const maxLoanAllowed = selectedMember.share_capital_balance * 2;
    const exceedsShareCapital = principal > maxLoanAllowed;
    const maxMonthlyPayment = selectedMember.basic_salary / 2;
    const newMonthlyExceedsLimit = monthly > maxMonthlyPayment;
    const loanUsagePercentage = Math.min((principal / maxLoanAllowed) * 100, 100);

    return {
      computed: {
        interest: interest.toFixed(2),
        total: total.toFixed(2),
        monthly: monthly.toFixed(2),
      },
      validations: {
        maxLoanAllowed,
        exceedsShareCapital,
        maxMonthlyPayment,
        newMonthlyExceedsLimit,
        loanUsagePercentage,
      },
    };
  }, [loanTypes, principalAmount, termsMonths, loanTypeId, selectedMember]);
}

