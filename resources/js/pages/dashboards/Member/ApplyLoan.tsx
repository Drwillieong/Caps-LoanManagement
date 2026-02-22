import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';

interface LoanType {
    id: number;
    name: string;
    interest_rate_per_annum: number;
    max_term_months: number;
    requires_comaker: boolean;
}

interface Props {
    loanTypes: LoanType[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Application Form',
        href: dashboard().url,
    },
];

export default function ApplyLoan({ loanTypes }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Application Form" />

            <div className="space-y-5 px-6">
                <div className="flex items-center justify-between">
                    <HeadingSmall
                        title="Loan Application"
                        description="Apply for a new loan by filling out the form below"
                    />
                </div>

                <form className="space-y-8">
                    {/* APPLICATION FOR LOAN */}
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Loan Details</h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="loan_type_id">
                                    Type of Loan <span className="text-red-500">*</span>
                                </Label>
                                <select
                                    id="loan_type_id"
                                    name="loan_type_id"
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select loan type</option>
                                    {loanTypes.map((loanType) => (
                                        <option key={loanType.id} value={loanType.id}>
                                            {loanType.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="loan_amount">Loan Amount (₱)</Label>
                                <Input
                                    id="loan_amount"
                                    type="number"
                                    placeholder="e.g., 50000"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="loan_period">Loan Period (Months)</Label>
                                <Input
                                    id="loan_period"
                                    type="number"
                                    placeholder="e.g., 12"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="installments">Installments (Semi-monthly)</Label>
                                <Input
                                    id="installments"
                                    type="number"
                                    placeholder="e.g., 24"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount_per_installment">Amount per Installment (₱)</Label>
                                <Input
                                    id="amount_per_installment"
                                    type="number"
                                    placeholder="e.g., 2500"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="first_payment_date">First Payment Date</Label>
                                <Input
                                    id="first_payment_date"
                                    type="date"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="last_payment_date">Last Payment Date</Label>
                                <Input
                                    id="last_payment_date"
                                    type="date"
                                />
                            </div>
                        </div>
                    </div>

                    {/* APPLICANT'S STATEMENT */}
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Applicant's Statement</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="applicant_full_name">Full Name</Label>
                                <Input
                                    id="applicant_full_name"
                                    type="text"
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="applicant_employer">Employer</Label>
                                <Input
                                    id="applicant_employer"
                                    type="text"
                                    placeholder="Employer name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="applicant_position">Position</Label>
                                <Input
                                    id="applicant_position"
                                    type="text"
                                    placeholder="Position"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="applicant_address">Address</Label>
                                <Input
                                    id="applicant_address"
                                    type="text"
                                    placeholder="Address"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="applicant_salary">Monthly Salary (₱)</Label>
                                <Input
                                    id="applicant_salary"
                                    type="number"
                                    placeholder="e.g., 30000"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="applicant_phone">Phone Number</Label>
                                <Input
                                    id="applicant_phone"
                                    type="text"
                                    placeholder="e.g., 09123456789"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="applicant_spouse_name">Spouse's Name</Label>
                                <Input
                                    id="applicant_spouse_name"
                                    type="text"
                                    placeholder="Spouse's name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="applicant_spouse_employed">Spouse Employed?</Label>
                                <select
                                    id="applicant_spouse_employed"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="applicant_other_income">Other Income (₱)</Label>
                                <Input
                                    id="applicant_other_income"
                                    type="number"
                                    placeholder="e.g., 5000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* CO-MAKER'S STATEMENT */}
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Co-Maker's Statement</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="comaker_full_name">Full Name</Label>
                                <Input
                                    id="comaker_full_name"
                                    type="text"
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comaker_employer">Employer</Label>
                                <Input
                                    id="comaker_employer"
                                    type="text"
                                    placeholder="Employer name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comaker_position">Position</Label>
                                <Input
                                    id="comaker_position"
                                    type="text"
                                    placeholder="Position"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comaker_address">Address</Label>
                                <Input
                                    id="comaker_address"
                                    type="text"
                                    placeholder="Address"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comaker_salary">Monthly Salary (₱)</Label>
                                <Input
                                    id="comaker_salary"
                                    type="number"
                                    placeholder="e.g., 30000"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comaker_phone">Phone Number</Label>
                                <Input
                                    id="comaker_phone"
                                    type="text"
                                    placeholder="e.g., 09123456789"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comaker_spouse_name">Spouse's Name</Label>
                                <Input
                                    id="comaker_spouse_name"
                                    type="text"
                                    placeholder="Spouse's name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comaker_spouse_employed">Spouse Employed?</Label>
                                <select
                                    id="comaker_spouse_employed"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comaker_other_income">Other Income (₱)</Label>
                                <Input
                                    id="comaker_other_income"
                                    type="number"
                                    placeholder="e.g., 5000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* AUTHORITY */}
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Authority</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            I hereby authorize the Finance/Payroll Department to deduct the corresponding loan payment from my salary every payday.
                        </p>
                        <div className="grid gap-2 max-w-md">
                            <Label htmlFor="applicant_signature">Applicant Signature (Full Name)</Label>
                            <Input
                                id="applicant_signature"
                                type="text"
                                placeholder="Your full name as signature"
                            />
                        </div>
                    </div>

                    {/* SUBMIT */}
                    <div className="flex items-center gap-4 pb-8">
                        <Button type="submit">
                            Submit Application
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
