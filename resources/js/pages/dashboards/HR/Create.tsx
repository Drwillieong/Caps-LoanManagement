import { useState } from 'react';
import { Transition } from '@headlessui/react';
import AppLayout from '@/layouts/app-layout';
import { Form, Head } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { LiveClock } from '@/components/live-clock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { type BreadcrumbItem } from '@/types';
import { store } from '@/routes/users';

interface Props {
    roles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Members', href: '/dashboards/HR/SeeUsers' },
    { title: 'Create', href: '/dashboards/HR/create' },
];

// 🔐 Secure Password Generator
function generatePassword(length: number = 10) {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export default function Create({ roles }: Props) {
    const [password, setPassword] = useState('admin123'); // ✅ Default Password

    const handleGenerate = () => {
        const newPass = generatePassword(12);
        setPassword(newPass);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Create User" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="rounded-2xl border bg-background shadow-sm">

                        {/* Header */}
                        <div className="border-b px-8 py-6">
                            <HeadingSmall
                                title="Create New Member"
                                description="Fill in the information below to add a new member"
                            />
                        </div>

                        {/* Form */}
                        <div className="p-8">
                            <Form
                                {...store.form()}
                                resetOnSuccess={['password', 'password_confirmation']}
                            >
                                {({ processing, errors, recentlySuccessful }) => (
                                    <>
                                        {/* Success Message */}
                                        <Transition
                                            show={recentlySuccessful}
                                            enter="transition ease-out duration-300"
                                            enterFrom="opacity-0 translate-y-2"
                                            enterTo="opacity-100 translate-y-0"
                                            leave="transition ease-in duration-500"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <div className="mb-6 flex items-center gap-4 rounded-xl border border-green-300 bg-green-50 px-6 py-4 shadow-sm">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white font-bold">
                                                    ✓
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-green-800">
                                                        Successfully created
                                                    </p>
                                                    <p className="text-sm text-green-700">
                                                        The member has been created successfully.
                                                    </p>
                                                </div>
                                            </div>
                                        </Transition>

                                        {/* Form Grid */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                                            {/* First Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="first_name">First Name</Label>
                                                <Input
                                                    id="first_name"
                                                    name="first_name"
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    placeholder="Kayleen"
                                                />
                                                <InputError message={errors.first_name} />
                                            </div>

                                            {/* Middle Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="middle_name">Middle Name</Label>
                                                <Input
                                                    id="middle_name"
                                                    name="middle_name"
                                                    type="text"
                                                    placeholder="Minor"
                                                />
                                                <InputError message={errors.middle_name} />
                                            </div>

                                            {/* Last Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="last_name">Last Name</Label>
                                                <Input
                                                    id="last_name"
                                                    name="last_name"
                                                    type="text"
                                                    required
                                                    placeholder="Doe"
                                                />
                                                <InputError message={errors.last_name} />
                                            </div>

                                            {/* Email */}
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    required
                                                    placeholder="kay@example.com"
                                                />
                                                <InputError message={errors.email} />
                                            </div>

                                            {/* Role */}
                                            <div className="space-y-2">
                                                <Label htmlFor="role">Role</Label>
                                                <select
                                                    id="role"
                                                    name="role"
                                                    required
                                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                >
                                                    <option value="">Select a role</option>
                                                    {roles.map((role) => (
                                                        <option key={role} value={role}>
                                                            {role.toUpperCase()}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.role} />
                                            </div>

                                            {/* Password */}
                                            <div className="space-y-2">
                                                <Label htmlFor="password">
                                                    Password
                                                </Label>

                                                <div className="flex gap-2">
                                                    <Input
                                                        id="password"
                                                        name="password"
                                                        type="text"
                                                        required
                                                        value={password}
                                                        onChange={(e) =>
                                                            setPassword(e.target.value)
                                                        }
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={handleGenerate}
                                                    >
                                                        Generate
                                                    </Button>
                                                </div>

                                                <InputError message={errors.password} />
                                            </div>

                                            {/* Confirm Password */}
                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation">
                                                    Confirm Password
                                                </Label>
                                                <Input
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    type="text"
                                                    required
                                                    value={password}
                                                    onChange={(e) =>
                                                        setPassword(e.target.value)
                                                    }
                                                />
                                                <InputError message={errors.password_confirmation} />
                                            </div>

                                            {/* Employee ID */}
                                            <div className="space-y-2">
                                                <Label htmlFor="employee_id">
                                                    Employee ID <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="employee_id"
                                                    name="employee_id"
                                                    type="text"
                                                    required
                                                    placeholder="e.g., EMP-001"
                                                />
                                                <InputError message={errors.employee_id} />
                                            </div>
                                        </div>

                                        {/* Employment Section */}
                                        <div className="mt-8 border-t pt-6">
                                            <h3 className="mb-4 text-lg font-semibold">Employment Information</h3>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                {/* Position */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="position">
                                                        Position <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="position"
                                                        name="position"
                                                        type="text"
                                                        required
                                                        placeholder="e.g., Software Engineer"
                                                    />
                                                    <InputError message={errors.position} />
                                                </div>

                                                {/* Date Hired */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="date_hired">
                                                        Date Hired <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="date_hired"
                                                        name="date_hired"
                                                        type="date"
                                                        required
                                                    />
                                                    <InputError message={errors.date_hired} />
                                                </div>

                                                {/* Basic Salary */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="basic_salary">
                                                        Basic Salary <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="basic_salary"
                                                        name="basic_salary"
                                                        type="number"
                                                        step="0.01"
                                                        required
                                                        placeholder="e.g., 50000.00"
                                                    />
                                                    <InputError message={errors.basic_salary} />
                                                </div>

                                                {/* Share Capital Balance */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="share_capital_balance">
                                                        Share Capital Balance
                                                    </Label>
                                                    <Input
                                                        id="share_capital_balance"
                                                        name="share_capital_balance"
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="e.g., 10000.00"
                                                    />
                                                    <InputError message={errors.share_capital_balance} />
                                                </div>

                                                {/* Bank Account Number */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="bank_account_number">
                                                        Bank Account Number (RCBC)
                                                    </Label>
                                                    <Input
                                                        id="bank_account_number"
                                                        name="bank_account_number"
                                                        type="text"
                                                        placeholder="e.g., 1234567890"
                                                    />
                                                    <InputError message={errors.bank_account_number} />
                                                </div>

                                                {/* TIN Number */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="tin_number">
                                                        TIN Number
                                                    </Label>
                                                    <Input
                                                        id="tin_number"
                                                        name="tin_number"
                                                        type="text"
                                                        placeholder="e.g., 123-456-789"
                                                    />
                                                    <InputError message={errors.tin_number} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-8 flex justify-end border-t pt-6">
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="min-w-[160px]"
                                            >
                                                {processing && (
                                                    <Spinner className="mr-2" />
                                                )}
                                                Create Member
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}