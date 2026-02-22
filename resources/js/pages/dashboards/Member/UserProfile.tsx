import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { LiveClock } from '@/components/live-clock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import member from '@/routes/member';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  
    {
        title: 'User Profile',
        href: member.userProfile.url(),
    },
    
];

interface Beneficiary {
    id?: number;
    full_name: string;
    relationship: string;
    date_of_birth?: string;
}

interface MemberProfile {
    id?: number;
    user_id: number;
    employee_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    date_of_birth: string;
    sex: string;
    civil_status: string;
    spouse_name?: string;
    mobile_number: string;
    present_address: string;
    permanent_address?: string;
    position: string;
    date_hired: string;
    basic_salary: number;
    share_capital_balance?: number;
    bank_account_number?: string;
    tin_number?: string;
}

interface Props {
    memberProfile?: MemberProfile | null;
    beneficiaries: Beneficiary[];
    isNewUser: boolean;
    isAdmin?: boolean;
}

export default function UserProfile({ memberProfile, beneficiaries, isNewUser, isAdmin = false }: Props) {
    const { auth } = usePage<SharedData>().props;
    
    // Initialize form data from existing profile or defaults
    const [formData, setFormData] = useState({
        employee_id: memberProfile?.employee_id || '',
        first_name: memberProfile?.first_name || '',
        middle_name: memberProfile?.middle_name || '',
        last_name: memberProfile?.last_name || '',
        date_of_birth: memberProfile?.date_of_birth || '',
        sex: memberProfile?.sex || '',
        civil_status: memberProfile?.civil_status || '',
        spouse_name: memberProfile?.spouse_name || '',
        mobile_number: memberProfile?.mobile_number || '',
        present_address: memberProfile?.present_address || '',
        permanent_address: memberProfile?.permanent_address || '',
        position: memberProfile?.position || '',
        date_hired: memberProfile?.date_hired || '',
        basic_salary: memberProfile?.basic_salary || '',
        share_capital_balance: memberProfile?.share_capital_balance || '',
        bank_account_number: memberProfile?.bank_account_number || '',
        tin_number: memberProfile?.tin_number || '',
        beneficiaries: beneficiaries.length > 0 ? beneficiaries : [{ full_name: '', relationship: '', date_of_birth: '' }],
    });

    const addBeneficiary = () => {
        setFormData({
            ...formData,
            beneficiaries: [...formData.beneficiaries, { full_name: '', relationship: '', date_of_birth: '' }],
        });
    };

    const removeBeneficiary = (index: number) => {
        const updatedBeneficiaries = formData.beneficiaries.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            beneficiaries: updatedBeneficiaries.length > 0 ? updatedBeneficiaries : [{ full_name: '', relationship: '', date_of_birth: '' }],
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

    // Fields that are required for new users
    const requiredFields = isNewUser ? [
        'employee_id', 'first_name', 'last_name', 'date_of_birth', 'sex', 
        'civil_status', 'mobile_number', 'present_address', 'position', 
        'date_hired', 'basic_salary'
    ] : [];

    const [isEditing, setIsEditing] = useState(isNewUser);

    // Determine if user can edit employment - admins can always edit, members only when isEditing
  const canEditEmployment = isAdmin;

    const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};



    const isRequired = (field: string) => requiredFields.includes(field);
    
    return (
    <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
        <Head title="User Profile" />

        <div className="space-y-5 px-6">
            <div className="flex items-center justify-between">
                <HeadingSmall
                    title="Personal Information"
                    description={
                        isEditing
                            ? 'You can now edit your profile details'
                            : 'View your personal information'
                    }
                />

    {!isNewUser && (
        <div className="flex gap-2">
            {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                </Button>
            ) : (
                <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                >
                    Cancel
                </Button>
            )}
        </div>
    )}
</div>


                <Form
                    method="post"
                    action={member.userProfile.store.url()}
                    transform={() => formData as any}
                    className="space-y-8"
                >
                    {({ processing, recentlySuccessful, errors }) => (
                        <>
                            {/* Identity Section */}
                            <div className="rounded-lg border bg-card p-6 shadow-sm">
                                <h3 className="mb-4 text-lg font-semibold">Identity</h3>
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
                                            required={isRequired('employee_id')}
                                            placeholder="e.g., EMP-001"
                                            disabled={!isEditing}

                                        />
                                        <InputError message={errors.employee_id} />
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
                                            required={isRequired('first_name')}
                                            placeholder="First name"
                                            disabled={!isEditing}

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
                                            disabled={!isEditing}
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
                                            required={isRequired('last_name')}
                                            placeholder="Last name"
                                            disabled={!isEditing}
                                        />
                                        <InputError message={errors.last_name} />
                                    </div>

                                    <div className="grid gap-2">
    <Label>Date of Birth</Label>

    {!isEditing ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
            {formatDate(formData.date_of_birth)}
        </div>
    ) : (
        <Input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={(e) =>
                setFormData({ ...formData, date_of_birth: e.target.value })
            }
        />
    )}

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
                                            required={isRequired('sex')}
                                           disabled={!isEditing}

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
                                            required={isRequired('civil_status')}
                                            disabled={!isEditing}

                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Select civil status</option>
                                            <option value="single">Single</option>
                                            <option value="married">Married</option>
                                            <option value="widowed">Widowed</option>
                                            <option value="separated">Separated</option>
                                        </select>
                                        <InputError message={errors.civil_status} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="spouse_name">Spouse Name</Label>
                                        <Input
                                            id="spouse_name"
                                            name="spouse_name"
                                            value={formData.spouse_name}
                                            onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                                            placeholder="Spouse name (if married)"
                                            disabled={!isEditing}

                                        />
                                        <InputError message={errors.spouse_name} />
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Address Section */}
                            <div className="rounded-lg border bg-card p-6 shadow-sm">
                                <h3 className="mb-4 text-lg font-semibold">Contact & Address</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="mobile_number">
                                            Mobile Number <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="mobile_number"
                                            name="mobile_number"
                                            type="tel"
                                            value={formData.mobile_number}
                                            onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                                            required={isRequired('mobile_number')}
                                            placeholder="e.g., 09123456789"
                                            disabled={!isEditing}
                                        />
                                        <InputError message={errors.mobile_number} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="tin_number">TIN Number</Label>
                                        <Input
                                            id="tin_number"
                                            name="tin_number"
                                            value={formData.tin_number}
                                            onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                                            placeholder="e.g., 123-456-789"
                                            disabled={!isEditing}
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
                                            required={isRequired('present_address')}
                                            disabled={!isEditing}
                                            placeholder="Present address"
                                            rows={3}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <InputError message={errors.present_address} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="permanent_address">Permanent Address</Label>
                                        <textarea
                                            id="permanent_address"
                                            name="permanent_address"
                                            value={formData.permanent_address}
                                            onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                                            placeholder="Permanent address (optional)"
                                            rows={3}
                                            disabled={!isEditing}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <InputError message={errors.permanent_address} />
                                    </div>
                                </div>
                            </div>

                            {/* Employment Section */}
                            <div className="rounded-lg border bg-card p-6 shadow-sm">
                                <h3 className="mb-4 text-lg font-semibold">Employment Information</h3>
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
                                            required={isRequired('position')}
                                            placeholder="e.g., Software Engineer"
                                            disabled={!canEditEmployment}
                                        />
                                        <InputError message={errors.position} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="date_hired">
                                            Date Hired <span className="text-red-500">*</span>
                                        </Label>
                                        {!canEditEmployment ? (
                                            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                {formatDate(formData.date_hired)}
                                            </div>
                                        ) : (
                                            <Input
                                                id="date_hired"
                                                type="date"
                                                name="date_hired"
                                                value={formData.date_hired}
                                                onChange={(e) => setFormData({ ...formData, date_hired: e.target.value })}
                                                required={isRequired('date_hired')}
                                                disabled={!canEditEmployment}
                                            />
                                        )}
                                        <InputError message={errors.date_hired} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="basic_salary">
                                            Basic Salary <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="basic_salary"
                                            name="basic_salary"
                                            type="number"
                                            step="0.01"
                                            value={formData.basic_salary}
                                            onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                                            required={isRequired('basic_salary')}
                                            placeholder="e.g., 50000.00"
                                            disabled={!canEditEmployment}
                                        />
                                        <InputError message={errors.basic_salary} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="share_capital_balance">Share Capital Balance</Label>
                                        <Input
                                            id="share_capital_balance"
                                            name="share_capital_balance"
                                            type="number"
                                            step="0.01"
                                            value={formData.share_capital_balance}
                                            onChange={(e) => setFormData({ ...formData, share_capital_balance: e.target.value })}
                                            placeholder="e.g., 10000.00"
                                            disabled={!canEditEmployment}
                                        />
                                        <InputError message={errors.share_capital_balance} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="bank_account_number">Bank Account Number (RCBC)</Label>
                                        <Input
                                            id="bank_account_number"
                                            name="bank_account_number"
                                            value={formData.bank_account_number}
                                            onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                                            placeholder="e.g., 1234567890"
                                            disabled={!canEditEmployment}
                                        />
                                        <InputError message={errors.bank_account_number} />
                                    </div>
                                </div>
                            </div>

                            {/* Beneficiaries Section */}
                            <div className="rounded-lg border bg-card p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Beneficiaries</h3>
                                   {isEditing && ( <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addBeneficiary}
                                    >
                                        Add Beneficiary
                                    </Button> )}
                                </div>
                                
                                <div className="space-y-4">
                                    {formData.beneficiaries.map((beneficiary, index) => (
                                        <div key={index} className="rounded-md border p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium">Beneficiary {index + 1}</span>
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
                                            <div className="grid gap-4 md:grid-cols-3">
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
                                                        disabled={!isEditing}
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
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor={`beneficiaries[${index}][date_of_birth]`}>
                                                        Date of Birth
                                                    </Label>
                                                    {!isEditing ? (
                                                        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                                                            {formatDate(beneficiary.date_of_birth)}
                                                        </div>
                                                    ) : (
                                                        <Input
                                                            id={`beneficiaries[${index}][date_of_birth]`}
                                                            name={`beneficiaries[${index}][date_of_birth]`}
                                                            type="date"
                                                            value={beneficiary.date_of_birth}
                                                            disabled={!isEditing}
                                                            onChange={(e) => updateBeneficiary(index, 'date_of_birth', e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center gap-4 pb-8">
                              {isEditing && (
    <div className="flex items-center gap-4">
        <Button disabled={processing} type="submit">
            Save Changes
        </Button>

        <Transition show={recentlySuccessful}>
            <p className="text-sm text-green-600">
                Saved successfully!
            </p>
        </Transition>
    </div>
)}

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-green-600">
                                        Saved successfully!
                                    </p>
                                </Transition>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
