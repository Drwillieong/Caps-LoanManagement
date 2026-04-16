import { useState, useEffect } from 'react'
import { Transition } from '@headlessui/react'
import AppLayout from '@/layouts/app-layout'
import { Form, Head } from '@inertiajs/react'

import HeadingSmall from '@/components/heading-small'
import InputError from '@/components/input-error'
import { LiveClock } from '@/components/live-clock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { type BreadcrumbItem } from '@/types'
import { store } from '@/routes/users'
import { canSendEmail } from '@/hooks/use-internet-check'
import { toast } from 'react-hot-toast'

interface Props {
    roles: string[]
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Members', href: '/dashboards/HR/SeeUsers' },
    { title: 'Create', href: '/dashboards/HR/create' },
]

// Password Generator
function generatePassword(length: number = 12) {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

function formatNumberWithCommas(value: string | number): string {
    if (!value) return ''
    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })
}

export default function Create({ roles }: Props) {
    const [password, setPassword] = useState('admin123')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [basicSalaryRaw, setBasicSalaryRaw] = useState('')
    const [shareCapitalRaw, setShareCapitalRaw] = useState('')

    // Check for email notification failure flag after redirect
    useEffect(() => {
        const emailFailed = sessionStorage.getItem('emailNotificationFailed');
        if (emailFailed) {
            toast.error('No internet connection. The email notification cannot be sent, but the member has been created successfully.');
            sessionStorage.removeItem('emailNotificationFailed');
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Create User" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <HeadingSmall
                        title="Create New Member"
                        description="Add a new member to your organization"
                    />
                    <p className="text-sm text-muted-foreground">
                        Fields marked * are required
                    </p>
                </div>

                <Form
                    {...store.form()}
                    transform={(data) => ({
                        ...data,
                        basic_salary: data.basic_salary ? String(data.basic_salary).replace(/,/g, '') : '',
                        share_capital_balance: data.share_capital_balance ? String(data.share_capital_balance).replace(/,/g, '') : '',
                    })}
                    resetOnSuccess={['password', 'password_confirmation']}
                    onSubmit={(e) => {
                        // Check for internet connectivity before submitting
                        canSendEmail().then((isConnected) => {
                            if (!isConnected) {
                                // Store a flag in sessionStorage to show toast after redirect
                                sessionStorage.setItem('emailNotificationFailed', 'true');
                            }
                        });
                        // Continue with form submission - data will still be saved
                    }}
                >
                    {({ processing, errors, recentlySuccessful }) => {
                        return (
                            <>
                                <div className="space-y-6">
                                    {/* Success */}
                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-out duration-300"
                                        enterFrom="opacity-0 translate-y-2"
                                        enterTo="opacity-100 translate-y-0"
                                    >
                                        <div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50 px-6 py-5 shadow-sm">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">
                                                ✓
                                            </div>
                                            <div>
                                                <p className="font-semibold text-emerald-800">
                                                    Successfully created
                                                </p>
                                                <p className="text-sm text-emerald-700">
                                                    The member has been created successfully.
                                                </p>
                                            </div>
                                        </div>
                                    </Transition>

                                    {/* Personal Information */}
                                    <div className="rounded-xl border border-emerald-100 bg-white/50 dark:bg-emerald-950/10 p-6 space-y-6">
                                        <div>
                                            <h3 className="text-base font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
                                                Personal Information
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Basic member details
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {[
                                                { id: 'first_name', label: 'First Name', placeholder: 'Enter first name', required: true },
                                                { id: 'middle_name', label: 'Middle Name', placeholder: 'Enter middle name' },
                                                { id: 'last_name', label: 'Last Name', placeholder: 'Enter last name', required: true },
                                                { id: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter email address', required: true },
                                            ].map((field) => (
                                                <div key={field.id} className="space-y-2">
                                                    <Label htmlFor={field.id}>
                                                        {field.label}
                                                        {field.required && (
                                                            <span className="text-red-500"> *</span>
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id={field.id}
                                                        name={field.id}
                                                        type={field.type ?? 'text'}
                                                        required={field.required}
                                                        placeholder={field.placeholder}
                                                        className="h-10 rounded-lg border-emerald-100 focus:ring-emerald-500/40"
                                                    />
                                                    <InputError message={(errors as any)[field.id]} />
                                                </div>
                                            ))}

                                            {/* Role */}
                                            <div className="space-y-2">
                                                <Label htmlFor="role">
                                                    Role <span className="text-red-500">*</span>
                                                </Label>
                                                <select
                                                    id="role"
                                                    name="role"
                                                    required
                                                    className="h-10 w-full rounded-lg border border-emerald-100 bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/40"
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

                                            {/* Employee ID */}
                                            <div className="space-y-2">
                                                <Label htmlFor="employee_id">
                                                    Employee ID <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="employee_id"
                                                    name="employee_id"
                                                    required
                                                    placeholder="Enter employee ID"
                                                    className="h-10 rounded-lg border-emerald-100 focus:ring-emerald-500/40"
                                                />
                                                <InputError message={errors.employee_id} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security */}
                                    <div className="rounded-xl border border-emerald-100 bg-white/50 dark:bg-emerald-950/10 p-6 space-y-6">
                                        <div>
                                            <h3 className="text-base font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
                                                Account Security
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {/* Password */}
                                            <div className="space-y-2">
                                                <Label>Password *</Label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Input
                                                            name="password"
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            className="pr-10 h-10 border-emerald-100 focus:ring-emerald-500/40"
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                                                        >
                                                            {showPassword ? 'Hide' : 'Show'}
                                                        </button>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setPassword(generatePassword())}
                                                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                                    >
                                                        Auto
                                              </Button>
                                                </div>
                                                <InputError message={errors.password} />
                                            </div>

                                            {/* Confirm */}
                                            <div className="space-y-2">
                                                <Label>Confirm Password *</Label>
                                                <div className="relative">
                                                    <Input
                                                        name="password_confirmation"
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="pr-10 h-10 border-emerald-100 focus:ring-emerald-500/40"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                                                    >
                                                        {showConfirmPassword ? 'Hide' : 'Show'}
                                                    </button>
                                                </div>
                                                <InputError message={errors.password_confirmation} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Employment */}
                                    <div className="rounded-xl border border-emerald-100 bg-white/50 dark:bg-emerald-950/10 p-6 space-y-6">
                                        <div>
                                            <h3 className="text-base font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
                                                Employment Information
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label>Position *</Label>
                                                <Input name="position" required placeholder="Enter position" className="h-10 border-emerald-100 focus:ring-emerald-500/40" />
                                                <InputError message={errors.position} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Date Hired *</Label>
                                                <Input
                                                    type="date"
                                                    name="date_hired"
                                                    required
                                                    className="h-10 border-emerald-100 focus:ring-emerald-500/40"
                                                />
                                                <InputError message={errors.date_hired} />
                                            </div>

                                            {/* Basic Salary */}
                                            <div className="space-y-2">
                                                <Label>Basic Salary *</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-emerald-600">
                                                        ₱
                                                    </span>
                                                    <Input
                                                        name="basic_salary"
                                                        required
                                                        className="pl-8 text-left font-medium tracking-wide h-10 border-emerald-100 focus:ring-emerald-500/40"
                                                        placeholder="0.00"
                                                        value={basicSalaryRaw}
                                                        onChange={(e) => {
                                                            const raw = e.target.value.replace(/,/g, '')
                                                            if (!/^\d*\.?\d*$/.test(raw)) return
                                                            setBasicSalaryRaw(formatNumberWithCommas(raw))
                                                        }}
                                                    />
                                                </div>
                                                <InputError message={errors.basic_salary} />
                                            </div>

                                            {/* Share Capital */}
                                            <div className="space-y-2">
                                                <Label>Share Capital Balance</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-emerald-600">
                                                        ₱
                                                    </span>
                                                    <Input
                                                        name="share_capital_balance"
                                                        className="pl-8 text-left font-medium tracking-wide h-10 border-emerald-100 focus:ring-emerald-500/40"
                                                        placeholder="0.00"
                                                        value={shareCapitalRaw}
                                                        onChange={(e) => {
                                                            const raw = e.target.value.replace(/,/g, '')
                                                            if (!/^\d*\.?\d*$/.test(raw)) return
                                                            setShareCapitalRaw(formatNumberWithCommas(raw))
                                                        }}
                                                    />
                                                </div>
                                                <InputError message={errors.share_capital_balance} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Bank Account Number</Label>
                                                <Input name="bank_account_number" placeholder="Enter bank account number" className="h-10 border-emerald-100 focus:ring-emerald-500/40" />
                                                <InputError message={errors.bank_account_number} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>TIN Number</Label>
                                                <Input name="tin_number" placeholder="Enter TIN number" className="h-10 border-emerald-100 focus:ring-emerald-500/40" />
                                                <InputError message={errors.tin_number} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between border-t border-emerald-100 pt-6">
                                        <p className="text-sm text-muted-foreground">
                                            Double-check all information before submitting.
                                        </p>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="min-w-[180px] h-10 font-medium bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {processing && <Spinner className="mr-2 h-4 w-4" />}
                                            Create Member
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )
                    }}
                </Form>
            </div>
        </AppLayout>
    )
}

