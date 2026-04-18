import { useState, useEffect, useCallback, useRef } from 'react';

interface MemberSearchResult {
  id: number;
  name: string;
  email: string;
  employee_id: string;
  basic_salary: number;
  share_capital_balance: number;
}

interface UseMemberSearchReturn {
  memberSearch: string;
  setMemberSearch: (query: string) => void;
  searchResults: MemberSearchResult[];
  loadingMember: boolean;
  selectedMember: MemberSearchResult | null;
  setSelectedMember: (member: MemberSearchResult | null) => void;
  memberEligible: boolean | null;
  memberHasActiveLoans: boolean;
  memberHasPendingLoan: boolean;
  memberEligibilityReason: string | null;
  memberEligibilityLoading: boolean;
  handleMemberSelect: (member: MemberSearchResult) => Promise<void>;
}

export function useMemberSearch(): UseMemberSearchReturn {
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [loadingMember, setLoadingMember] = useState(false);
  const [selectedMember, setSelectedMemberState] = useState<MemberSearchResult | null>(null);
  const [memberEligible, setMemberEligible] = useState<boolean | null>(null);
  const [memberHasActiveLoans, setMemberHasActiveLoans] = useState(false);
  const [memberHasPendingLoan, setMemberHasPendingLoan] = useState(false);
  const [memberEligibilityReason, setMemberEligibilityReason] = useState<string | null>(null);
  const [memberEligibilityLoading, setMemberEligibilityLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      setLoadingMember(true);
      try {
        const response = await fetch(`/api/members/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results.data || []);
        }
      } catch (error) {
        console.error('Member search error:', error);
        setSearchResults([]);
      } finally {
        setLoadingMember(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    debouncedSearch(memberSearch);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [memberSearch, debouncedSearch]);

  const checkMemberEligibility = useCallback(async (memberId: number) => {
    setMemberEligibilityLoading(true);
    try {
      const response = await fetch(`/api/members/${memberId}/eligible`);
      if (response.ok) {
        const data = await response.json();
        setMemberEligible(data.eligible);
        setMemberHasActiveLoans(data.hasActiveLoans || false);
        setMemberHasPendingLoan(data.hasPendingLoan || false);
        setMemberEligibilityReason(data.reason || null);
      } else {
        setMemberEligible(null);
        setMemberHasPendingLoan(false);
        setMemberEligibilityReason(null);
      }
    } catch (error) {
      console.error('Eligibility check error:', error);
      setMemberEligible(null);
      setMemberHasPendingLoan(false);
      setMemberEligibilityReason(null);
    } finally {
      setMemberEligibilityLoading(false);
    }
  }, []);

  const handleMemberSelect = useCallback(async (member: MemberSearchResult) => {
    setSelectedMemberState(member);
    setMemberSearch('');
    setSearchResults([]);
    await checkMemberEligibility(member.id);
  }, [checkMemberEligibility]);

  const setSelectedMember = (member: MemberSearchResult | null) => {
    setSelectedMemberState(member);
    if (!member) {
      setMemberEligible(null);
      setMemberHasActiveLoans(false);
      setMemberHasPendingLoan(false);
      setMemberEligibilityReason(null);
    }
  };

  return {
    memberSearch,
    setMemberSearch,
    searchResults,
    loadingMember,
    selectedMember,
    setSelectedMember,
    memberEligible,
    memberHasActiveLoans,
    memberHasPendingLoan,
    memberEligibilityReason,
    memberEligibilityLoading,
    handleMemberSelect,
  };
}

