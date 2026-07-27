import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { 
    ArrowLeft,
    User, 
    MapPin, 
    Briefcase, 
    Heart, 
    Users,
} from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { LiveClock } from '@/components/live-clock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Members', href: '/dashboards/HR/SeeUsers' },
    { title: 'Create Member', href: '' },
];

interface Beneficiary {
    full_name: string;
    relationship: string;
}

interface Props {
    roles: string[];
}

export default function Create({ roles }: Props) {
    const [formData, setFormData] = useState({
        // Identity
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        role: 'member',
        
        // Employee IDs
        employee_id: '',
        payroll_id: '',

        // Personal
        place_of_birth: '',
        date_of_birth: '',
        civil_status: '',
        sex: '',
        educational_attainment: '',

        // Contact & Address
        mobile_number: '',
        permanent_mobile_number: '',
        present_address: '',
        present_zip_code: '',
        permanent_address: '',
        permanent_zip_code: '',

        // Employment
        position: '',
        date_hired: '',
        basic_salary: '',
        income_type: 'monthly',
        net_income: '',
        share_capital_balance: '',

        // Other income
        other_source_of_income: '',
        facebook_account_name: '',
        
        // Spouse
        spouse_occupation: '',
        spouse_gross_income: '',
        spouse_income_type: 'monthly',
        spouse_net_income: '',

        // Assets
        real_properties_owned: '',

        // Financial
        bank_account_number: '',
        tin_number: '',

        // Beneficiaries
        legal_beneficiary_1_name: '',
        beneficiaries: [{ full_name: '', relationship: '' }] as Beneficiary[],
    });

    const addBeneficiary = () => {
        setFormData({
            ...formData,
            beneficiaries: [...formData.beneficiaries, { full_name: '', relationship: '' }],
        });
    };

    const removeBeneficiary = (index: number) => {
        const updatedBeneficiaries = formData.beneficiaries.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            beneficiaries: updatedBeneficiaries.length > 0 ? updatedBeneficiaries : [{ full_name: '', relationship: '' }],
        });
    };

    const updateBeneficiary = (index: number, field: keyof Beneficiary, value: string) => {
        const updatedBeneficiaries = [...formData.beneficiaries];
        updatedBeneficiaries[index] = { ...updatedBeneficiaries[index], [field]: value };
        setFormData({
            ...formData,
            beneficiaries: updatedBeneficiaries,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Create Member" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/dashboards/HR/SeeUsers">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <HeadingSmall
                                title="Create New Member Account"
                                description="Fill in the details to create a new member. The member will receive their login credentials upon GM approval."
                            />
                        </div>
                    </div>
                </div>

                <Form
                    method="post"
                    action="/dashboards/HR/SeeUsers"
                    transform={() => {
                        // Include the first beneficiary as legal_beneficiary_1_name for the backend
                        const firstBeneficiary = formData.beneficiaries.find(b => b.full_name);
                        return {
                            ...formData,
                            basic_salary: formData.basic_salary ? Number(formData.basic_salary) : 0,
                            net_income: formData.net_income ? Number(formData.net_income) : 0,
                            share_capital_balance: formData.share_capital_balance ? Number(formData.share_capital_balance) : 0,
                            spouse_gross_income: formData.spouse_gross_income ? Number(formData.spouse_gross_income) : null,
                            spouse_net_income: formData.spouse_net_income ? Number(formData.spouse_net_income) : null,
                            legal_beneficiary_1_name: firstBeneficiary?.full_name || '',
                        } as any;
                    }}
                    className="space-y-6"
                    onSuccess={() => {
                        toast.success('Member created successfully! The application has been submitted for GM validation.');
                    }}
                    onError={() => {
                        toast.error('Failed to create member. Please check the form for errors.');
                    }}
                >
                    {({ processing, recentlySuccessful, errors }) => (
                        <>
                            {/* Identity Section */}
                            <Card className="border-emerald-100">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-emerald-600" />
                                        <CardTitle className="text-emerald-900 dark:text-emerald-100 text-lg">
                                            Identity & Account
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="employee_id">
                                                Employee ID <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="employee_id"
                                                name="employee_id"
                                                value={formData.employee_id}
                                                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                                placeholder="e.g., EMP-001"
                                            />
                                            <InputError message={errors.employee_id} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="payroll_id">Payroll ID</Label>
                                            <Input
                                                id="payroll_id"
                                                name="payroll_id"
                                                value={formData.payroll_id}
                                                onChange={(e) => setFormData({ ...formData, payroll_id: e.target.value })}
                                                placeholder="Optional payroll identifier"
                                            />
                                            <InputError message={errors.payroll_id} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">
                                                Email Address <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="e.g., member@company.com"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="first_name">
                                                First Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                placeholder="First name"
                                            />
                                            <InputError message={errors.first_name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="middle_name">Middle Name</Label>
                                            <Input
                                                id="middle_name"
                                                name="middle_name"
                                                value={formData.middle_name}
                                                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                                                placeholder="Middle name"
                                            />
                                            <InputError message={errors.middle_name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="last_name">
                                                Last Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="last_name"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                placeholder="Last name"
                                            />
                                            <InputError message={errors.last_name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Date of Birth <span className="text-red-500">*</span></Label>
                                            <Input
                                                type="date"
                                                name="date_of_birth"
                                                value={formData.date_of_birth}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, date_of_birth: e.target.value })
                                                }
                                            />
                                            <InputError message={errors.date_of_birth} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="sex">
                                                Sex <span className="text-red-500">*</span>
                                            </Label>
                                            <select
                                                id="sex"
                                                name="sex"
                                                value={formData.sex}
                                                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">Select sex</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                            <InputError message={errors.sex} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="civil_status">
                                                Civil Status <span className="text-red-500">*</span>
                                            </Label>
                                            <select
                                                id="civil_status"
                                                name="civil_status"
                                                value={formData.civil_status}
                                                onChange={(e) => setFormData({ ...formData, civil_status: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">Select civil status</option>
                                                <option value="single">Single</option>
                                                <option value="married">Married</option>
                                                <option value="widowed">Widower/Widow</option>
                                            </select>
                                            <InputError message={errors.civil_status} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="place_of_birth">
                                                Place of Birth <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="place_of_birth"
                                                name="place_of_birth"
                                                value={formData.place_of_birth}
                                                onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                                                placeholder="Enter place of birth"
                                            />
                                            <InputError message={errors.place_of_birth} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="educational_attainment">
                                                Educational Attainment <span className="text-red-500">*</span>
                                            </Label>
                                            <select
                                                id="educational_attainment"
                                                name="educational_attainment"
                                                value={formData.educational_attainment}
                                                onChange={(e) => setFormData({ ...formData, educational_attainment: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">Select educational attainment</option>
                                                <option value="Elementary">Elementary</option>
                                                <option value="High School">High School</option>
                                                <option value="Vocational">Vocational</option>
                                                <option value="College">College</option>
                                                <option value="Postgraduate">Postgraduate</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <InputError message={errors.educational_attainment} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="facebook_account_name">Facebook Account (Name)</Label>
                                            <Input
                                                id="facebook_account_name"
                                                name="facebook_account_name"
                                                value={formData.facebook_account_name}
                                                onChange={(e) => setFormData({ ...formData, facebook_account_name: e.target.value })}
                                                placeholder="Enter Facebook account name"
                                            />
                                            <InputError message={errors.facebook_account_name} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contact & Address Section */}
                            <Card className="border-emerald-100">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-emerald-600" />
                                        <CardTitle className="text-emerald-900 dark:text-emerald-100 text-lg">
                                            Contact & Address
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="mobile_number">
                                                Present Cellphone Number <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="mobile_number"
                                                name="mobile_number"
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]{11}"
                                                maxLength={11}
                                                minLength={11}
                                                value={formData.mobile_number}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                                    setFormData({ ...formData, mobile_number: value });
                                                }}
                                                placeholder="e.g., 09123456789"
                                            />
                                            <InputError message={errors.mobile_number} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="permanent_mobile_number">
                                                Permanent Mobile Number <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="permanent_mobile_number"
                                                name="permanent_mobile_number"
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]{11}"
                                                maxLength={11}
                                                value={formData.permanent_mobile_number}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                                    setFormData({ ...formData, permanent_mobile_number: value });
                                                }}
                                                placeholder="e.g., 09123456789"
                                            />
                                            <InputError message={errors.permanent_mobile_number} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="tin_number">TIN Number</Label>
                                            <Input
                                                id="tin_number"
                                                name="tin_number"
                                                value={formData.tin_number}
                                                onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                                                placeholder="e.g., 123-456-789"
                                            />
                                            <InputError message={errors.tin_number} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="present_address">
                                                Present Address <span className="text-red-500">*</span>
                                            </Label>
                                            <textarea
                                                id="present_address"
                                                name="present_address"
                                                value={formData.present_address}
                                                onChange={(e) => setFormData({ ...formData, present_address: e.target.value })}
                                                placeholder="Present address"
                                                rows={3}
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <InputError message={errors.present_address} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="present_zip_code">
                                                Present Address Zip Code <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="present_zip_code"
                                                name="present_zip_code"
                                                value={formData.present_zip_code}
                                                onChange={(e) => setFormData({ ...formData, present_zip_code: e.target.value })}
                                                placeholder="Enter zip code"
                                            />
                                            <InputError message={errors.present_zip_code} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="permanent_address">
                                                Permanent (Provincial) Address <span className="text-red-500">*</span>
                                            </Label>
                                            <textarea
                                                id="permanent_address"
                                                name="permanent_address"
                                                value={formData.permanent_address}
                                                onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                                                placeholder="Permanent address"
                                                rows={3}
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <InputError message={errors.permanent_address} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="permanent_zip_code">
                                                Permanent Address Zip Code <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="permanent_zip_code"
                                                name="permanent_zip_code"
                                                value={formData.permanent_zip_code}
                                                onChange={(e) => setFormData({ ...formData, permanent_zip_code: e.target.value })}
                                                placeholder="Enter zip code"
                                            />
                                            <InputError message={errors.permanent_zip_code} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Employment Section */}
                            <Card className="border-emerald-100">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-emerald-600" />
                                        <CardTitle className="text-emerald-900 dark:text-emerald-100 text-lg">
                                            Employment Information
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="position">
                                                Position <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="position"
                                                name="position"
                                                value={formData.position}
                                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                                placeholder="e.g., Software Engineer"
                                            />
                                            <InputError message={errors.position} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="date_hired">
                                                Date Hired <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="date_hired"
                                                type="date"
                                                name="date_hired"
                                                value={formData.date_hired}
                                                onChange={(e) => setFormData({ ...formData, date_hired: e.target.value })}
                                            />
                                            <InputError message={errors.date_hired} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="basic_salary">
                                                Income (Gross) <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="basic_salary"
                                                name="basic_salary"
                                                type="number"
                                                step="0.01"
                                                min="10000"
                                                value={formData.basic_salary}
                                                onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                                                placeholder="e.g., 50000.00"
                                            />
                                            <InputError message={errors.basic_salary} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="share_capital_balance">
                                                Share Capital Balance <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="share_capital_balance"
                                                name="share_capital_balance"
                                                type="number"
                                                step="0.01"
                                                min="10000"
                                                value={formData.share_capital_balance}
                                                onChange={(e) => setFormData({ ...formData, share_capital_balance: e.target.value })}
                                                placeholder="e.g., 10000.00"
                                            />
                                            <InputError message={errors.share_capital_balance} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="income_type">
                                                Income Type <span className="text-red-500">*</span>
                                            </Label>
                                            <select
                                                id="income_type"
                                                name="income_type"
                                                value={formData.income_type}
                                                onChange={(e) => setFormData({ ...formData, income_type: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="daily">Daily</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                            <InputError message={errors.income_type} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="net_income">
                                                Net Income <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="net_income"
                                                name="net_income"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.net_income}
                                                onChange={(e) => setFormData({ ...formData, net_income: e.target.value })}
                                                placeholder="0.00"
                                            />
                                            <InputError message={errors.net_income} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="bank_account_number">Bank Account Number (RCBC)</Label>
                                            <Input
                                                id="bank_account_number"
                                                name="bank_account_number"
                                                value={formData.bank_account_number}
                                                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                                                placeholder="e.g., 1234567890"
                                            />
                                            <InputError message={errors.bank_account_number} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="other_source_of_income">Other Source of Income (Specify)</Label>
                                            <Input
                                                id="other_source_of_income"
                                                name="other_source_of_income"
                                                value={formData.other_source_of_income}
                                                onChange={(e) => setFormData({ ...formData, other_source_of_income: e.target.value })}
                                                placeholder="Specify other income source"
                                            />
                                            <InputError message={errors.other_source_of_income} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground p-2 mt-2">
                                        Note: Share capital balance must be at least ₱10,000.00.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Spouse, Beneficiary, and Assets Section */}
                            <Card className="border-emerald-100">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-5 w-5 text-emerald-600" />
                                        <CardTitle className="text-emerald-900 dark:text-emerald-100 text-lg">
                                            Spouse, Beneficiary, and Assets
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="spouse_occupation">Occupation of Spouse</Label>
                                            <Input
                                                id="spouse_occupation"
                                                name="spouse_occupation"
                                                value={formData.spouse_occupation}
                                                onChange={(e) => setFormData({ ...formData, spouse_occupation: e.target.value })}
                                                placeholder="Enter spouse occupation"
                                            />
                                            <InputError message={errors.spouse_occupation} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="spouse_gross_income">Spouse Income (Gross)</Label>
                                            <Input
                                                id="spouse_gross_income"
                                                name="spouse_gross_income"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.spouse_gross_income}
                                                onChange={(e) => setFormData({ ...formData, spouse_gross_income: e.target.value })}
                                                placeholder="0.00"
                                            />
                                            <InputError message={errors.spouse_gross_income} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="spouse_income_type">Spouse Income Type</Label>
                                            <select
                                                id="spouse_income_type"
                                                name="spouse_income_type"
                                                value={formData.spouse_income_type}
                                                onChange={(e) => setFormData({ ...formData, spouse_income_type: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="daily">Daily</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                            <InputError message={errors.spouse_income_type} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="spouse_net_income">Spouse Income (Net)</Label>
                                            <Input
                                                id="spouse_net_income"
                                                name="spouse_net_income"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.spouse_net_income}
                                                onChange={(e) => setFormData({ ...formData, spouse_net_income: e.target.value })}
                                                placeholder="0.00"
                                            />
                                            <InputError message={errors.spouse_net_income} />
                                        </div>

                                        <div className="grid gap-2 md:col-span-2 lg:col-span-3">
                                            <Label htmlFor="real_properties_owned">Real Properties Owned (Specify)</Label>
                                            <textarea
                                                id="real_properties_owned"
                                                name="real_properties_owned"
                                                value={formData.real_properties_owned}
                                                onChange={(e) => setFormData({ ...formData, real_properties_owned: e.target.value })}
                                                placeholder="Specify real properties owned"
                                                rows={3}
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <InputError message={errors.real_properties_owned} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Beneficiaries Section */}
                            <Card className="border-emerald-100">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-emerald-600" />
                                        <CardTitle className="text-emerald-900 dark:text-emerald-100 text-lg">
                                            Beneficiaries
                                        </CardTitle>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addBeneficiary}
                                    >
                                        Add Beneficiary
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {formData.beneficiaries.map((beneficiary, index) => (
                                            <div key={index} className="rounded-lg border border-emerald-100 p-4 bg-emerald-50/50">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-sm font-medium text-emerald-800">Beneficiary {index + 1}</span>
                                                    {formData.beneficiaries.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeBeneficiary(index)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`beneficiaries[${index}][full_name]`}>
                                                            Full Name
                                                        </Label>
                                                        <Input
                                                            id={`beneficiaries[${index}][full_name]`}
                                                            name={`beneficiaries[${index}][full_name]`}
                                                            value={beneficiary.full_name}
                                                            onChange={(e) => updateBeneficiary(index, 'full_name', e.target.value)}
                                                            placeholder="Full name"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor={`beneficiaries[${index}][relationship]`}>
                                                            Relationship
                                                        </Label>
                                                        <Input
                                                            id={`beneficiaries[${index}][relationship]`}
                                                            name={`beneficiaries[${index}][relationship]`}
                                                            value={beneficiary.relationship}
                                                            onChange={(e) => updateBeneficiary(index, 'relationship', e.target.value)}
                                                            placeholder="e.g., Wife, Daughter"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit Button */}
                            <div className="flex items-center gap-4 pb-8">
                                <div className="flex items-center gap-4">
                                    <Button disabled={processing} type="submit">
                                        {processing ? 'Creating...' : 'Create Member Account'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
