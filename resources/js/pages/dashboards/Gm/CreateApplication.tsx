import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import HeadingSmall from '@/components/heading-small';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useState, useMemo, useCallback } from 'react';
import { useRef } from 'react';
import { Search, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { SharedData, BreadcrumbItem } from '@/types';

import { useMemberSearch } from '@/hooks/useMemberSearch';
import { useLoanCalculator } from '@/hooks/useLoanCalculator';
import { CurrencyInput } from '@/components/CurrencyInput';
import { NumberInput } from '@/components/NumberInput';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Create Application',
        href: '/dashboards/Gm/CreateApplication',
    },
];

interface MemberSearchResult {
    id: number;
    name: string;
    email: string;
    employee_id: string;
    basic_salary: number;
    share_capital_balance: number;
}

interface LoanType {
    id: number;
    name: string;
    interest_rate_per_annum: number;
}

interface EligibleCoMaker {
    id: number;
    name: string;
    email: string;
}

interface ComputedValues {
  interest: string;
  total: string;
  monthly: string;
}

interface Validations {
  maxLoanAllowed: number;
  exceedsShareCapital: boolean;
  maxMonthlyPayment: number;
  newMonthlyExceedsLimit: boolean;
  loanUsagePercentage: number;
}

interface LoanCalcResult {
  computed: ComputedValues;
  validations: Validations;
}

interface AdminCreateLoanProps {
    loanTypes: LoanType[];
    eligibleCoMakers: EligibleCoMaker[];
}

export default function CreateApplication({ loanTypes, eligibleCoMakers }: AdminCreateLoanProps) {
    const { auth } = usePage<SharedData>().props;

    const {
        memberSearch,
        setMemberSearch,
        searchResults,
        loadingMember,
        selectedMember,
        setSelectedMember,
        memberEligible,
        memberHasActiveLoans,
        memberEligibilityLoading,
        handleMemberSelect,
    } = useMemberSearch();

    const [coMakerSearch, setCoMakerSearch] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        member_id: '',
        loan_type_id: '',
        principal_amount: '',
        terms_months: '',
        co_maker_user_id: '',
    });

    const loanCalc: LoanCalcResult | null = useLoanCalculator({
        loanTypes,
        principalAmount: data.principal_amount,
        termsMonths: data.terms_months,
        loanTypeId: data.loan_type_id,
        selectedMember,
    });

    const computedValues = loanCalc?.computed;
    const validations = loanCalc?.validations || {
      maxLoanAllowed: 0,
      exceedsShareCapital: false,
      maxMonthlyPayment: 0,
      newMonthlyExceedsLimit: false,
      loanUsagePercentage: 0,
    };

    const filteredCoMakers = useMemo(() => {
        if (!coMakerSearch.trim()) return eligibleCoMakers;
        const search = coMakerSearch.toLowerCase();
        return eligibleCoMakers.filter(
            (coMaker) =>
                coMaker.name.toLowerCase().includes(search) ||
                coMaker.email.toLowerCase().includes(search) ||
                coMaker.id.toString().includes(search)
        );
    }, [eligibleCoMakers, coMakerSearch]);

    const formatCurrency = (amount: number | string | null | undefined): string => {
        if (amount == null || amount === '') return '₱0.00';
        const num = typeof amount === 'string' ? parseFloat(amount.toString().replace(/,/g, '')) : Number(amount);
        return isNaN(num) ? '₱0.00' : `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const parseNumber = (value: string): number => {
      return parseFloat(value.replace(/,/g, '')) || 0;
    };

    const formatNumberInput = (value: string): string => {
      const num = parseNumber(value);
      return num.toLocaleString('en-US');
    };

    const isEligible = !validations.exceedsShareCapital && !validations.newMonthlyExceedsLimit && memberEligible !== false;

    const onMemberSelect = useCallback((member: MemberSearchResult) => {
        setData('member_id', member.id.toString());
        handleMemberSelect(member);
    }, [setData, handleMemberSelect]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) {
            alert('Please select a member first');
            return;
        }
        post('/api/admin/loan-applications');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Create Loan Application" />

            <div className="space-y-6 px-6 py-6">
                <HeadingSmall
                    title="Create Loan Application"
                    description="Create loan on behalf of member"
                />

                {!selectedMember ? (
                    // ===== MEMBER SEARCH SECTION =====
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Select Member
                            </CardTitle>
                            <CardDescription>
                                Search by email, employee ID, or name
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Start typing to search members..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    className="pl-10"
                                />
                                {loadingMember && (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                                )}
                            </div>
                            {searchResults.length > 0 && (
                                <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg">
                                    {searchResults.map((member) => (
                                        <button
                                            key={member.id}
                                            onClick={() => onMemberSelect(member)}
                                            className="w-full p-3 text-left hover:bg-accent border-b last:border-b-0 flex items-center gap-3"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{member.name}</p>
                                                <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                                                <p className="text-xs text-muted-foreground">{member.employee_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm">{formatCurrency(member.basic_salary)}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {memberSearch && !loadingMember && searchResults.length === 0 && (
                                <p className="mt-2 text-sm text-muted-foreground">No members found</p>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    // ===== FULL FORM (Exact ApplyLoan structure) =====
                    <>
                        {/* Applicant Info Card */}
                        <Card>
                            <CardHeader className="flex items-center justify-between">
                                <CardTitle>Member Information</CardTitle>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedMember(null)}
                                    >
                                        Change Member
                                    </Button>
                                {memberHasActiveLoans && (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Has Active Loans
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Name</p>
                                        <p className="font-semibold">{selectedMember.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Email</p>
                                        <p>{selectedMember.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Employee ID</p>
                                        <p>{selectedMember.employee_id}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Basic Salary</p>
                                        <p className="font-semibold">{formatCurrency(selectedMember.basic_salary)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Share Capital</p>
                                    <p className="font-semibold">{formatCurrency(selectedMember.share_capital_balance)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Max Loan</p>
                                        <p className="font-semibold">{formatCurrency(validations.maxLoanAllowed)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Eligibility Card */}
                        <Card className={`border-${isEligible ? 'emerald' : 'red'}-200 ${isEligible ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {isEligible ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                                    Eligibility Check
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {validations.exceedsShareCapital && (
                                    <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-200 rounded-lg">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <span>Share capital limit exceeded: Max {formatCurrency(validations.maxLoanAllowed)}</span>
                                    </div>
                                )}
                                {validations.newMonthlyExceedsLimit && computedValues && (
                                    <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-200 rounded-lg">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
{formatCurrency(computedValues?.monthly ? parseFloat(computedValues.monthly) : 0)} exceeds {formatCurrency(validations.maxMonthlyPayment)}
                                    </div>
                                )}
                                
{isEligible && computedValues && (
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-emerald-100 border border-emerald-200 rounded-lg">
                                        <div className="text-center">
                                            <p className="text-xs text-emerald-700">Interest</p>
{formatCurrency(computedValues?.interest || '0')}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-emerald-700">Monthly</p>
{formatCurrency(computedValues?.monthly || '0')}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-emerald-700">Total</p>
{formatCurrency(computedValues?.total || '0')}
                                        </div>
                                    </div>
                                )}
                                {data.principal_amount && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
<span>Loan Usage</span>
                                            <span>{formatCurrency(validations.maxLoanAllowed)}</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full">
                                            <div
                                                className={`${
                                                    validations.exceedsShareCapital ? 'bg-red-500' : 'bg-emerald-500'
                                                } h-2 rounded-full transition-all`}
                                                style={{ width: `${validations.loanUsagePercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Loan Details Form */}
                        <form onSubmit={submit} className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Loan Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Loan Type</Label>
                                        <Select value={data.loan_type_id} onValueChange={v => setData('loan_type_id', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select loan type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {loanTypes.map(type => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        {type.name} ({type.interest_rate_per_annum}% p.a.)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.loan_type_id} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Amount (₱)</Label>
                                        <Input
                                            type="text"
                                            placeholder="0"
                                            value={formatNumberInput(data.principal_amount)}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/,/g, '');
                                                if (/^\d*\.?\d{0,2}$/.test(val)) setData('principal_amount', val);
                                            }}
                                        />
                                        <InputError message={errors.principal_amount} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Term (Months)</Label>
                                        <Select value={data.terms_months} onValueChange={v => setData('terms_months', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select term" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[...Array(24)].map((_, i) => (
                                                    <SelectItem key={i+1} value={(i+1).toString()}>
                                                        {i+1} Month{ i+1 === 1 ? '' : 's'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.terms_months} />
                                    </div>
                                </CardContent>
                            </Card>
{/* Co-maker */}
<Card className="shadow-sm border-muted/50">
  <CardHeader className="pb-3">
    <CardTitle className="flex items-center justify-between text-base font-semibold">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        Co-maker
      </div>
      <span className="text-xs text-muted-foreground">(Optional)</span>
    </CardTitle>
  </CardHeader>

  <CardContent className="space-y-4">
    {/* Search */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search by name or email..."
        value={coMakerSearch}
        onChange={e => setCoMakerSearch(e.target.value)}
        className="pl-9"
      />
    </div>

    {/* Select */}
    <Select
      value={data.co_maker_user_id}
      onValueChange={v => setData('co_maker_user_id', v)}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            filteredCoMakers.length
              ? `Select co-maker (${filteredCoMakers.length})`
              : "No results found"
          }
        />
      </SelectTrigger>

      <SelectContent className="max-h-60">
        {filteredCoMakers.length > 0 ? (
          filteredCoMakers.map(maker => (
            <SelectItem
              key={maker.id}
              value={maker.id.toString()}
              className="flex flex-col items-start"
            >
              <span className="font-medium">{maker.name}</span>
              <span className="text-xs text-muted-foreground">
                {maker.email}
              </span>
            </SelectItem>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No co-makers match your search.
          </div>
        )}
      </SelectContent>
    </Select>

    {/* Error */}
    {errors.co_maker_user_id && (
      <p className="text-sm text-destructive">
        {errors.co_maker_user_id}
      </p>
    )}
  </CardContent>
</Card>

                            <div className="flex justify-end gap-4 pt-4">
                                <Link
                                    href="/dashboards/Gm/LoanApplication"
                                    className="px-6 py-2 border rounded-xl hover:bg-muted"
                                >
                                    Cancel
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing || !selectedMember || memberEligibilityLoading || !isEligible}
                                    size="lg"
                                    className="min-w-[200px] px-8"
                                >
                                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {processing ? 'Creating...' : 'Create Application'}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </AppLayout>
    );
}

