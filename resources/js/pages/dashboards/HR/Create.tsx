import { useState } from 'react'
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

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Create User" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="rounded-2xl border bg-background shadow-sm hover:shadow-md transition-shadow duration-300">

                        {/* Header */}
                        <div className="flex items-center justify-between border-b px-8 py-6">
                            <HeadingSmall
                                title="Create New Member"
                                description="Add a new member to your organization"
                            />
                            <p className="text-sm text-muted-foreground">
                                Fields marked * are required
                            </p>
                        </div>

                        <div className="p-8">
                            <Form
                                {...store.form()}
                                resetOnSuccess={['password', 'password_confirmation']}
                            >
                                {({ processing, errors, recentlySuccessful }) => (
                                    <div className="space-y-10">

                                        {/* Success */}
                                        <Transition
                                            show={recentlySuccessful}
                                            enter="transition ease-out duration-300"
                                            enterFrom="opacity-0 translate-y-2"
                                            enterTo="opacity-100 translate-y-0"
                                        >
                                            <div className="flex items-start gap-4 rounded-xl border bg-green-50 px-6 py-5 shadow-sm">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white text-sm font-bold">
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

                                        {/* Personal Information */}
                                        <div className="rounded-xl border bg-muted/30 p-6 space-y-6">
                                            <div>
                                                <h3 className="text-base font-semibold tracking-tight">
                                                    Personal Information
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Basic member details
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                                                            className="h-10 rounded-lg"
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
                                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/40"
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
                                                        className="h-10 rounded-lg"
                                                    />
                                                    <InputError message={errors.employee_id} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Security */}
                                        <div className="rounded-xl border bg-muted/30 p-6 space-y-6">
                                            <div>
                                                <h3 className="text-base font-semibold tracking-tight">
                                                    Account Security
                                                </h3>
                                            </div>

                                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                                                                className="pr-10 h-10"
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
                                                            onClick={() =>
                                                                setPassword(generatePassword())
                                                            }
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
                                                            className="pr-10 h-10"
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
                                                    <InputError
                                                        message={errors.password_confirmation}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Employment */}
                                        <div className="rounded-xl border bg-muted/30 p-6 space-y-6">
                                            <div>
                                                <h3 className="text-base font-semibold tracking-tight">
                                                    Employment Information
                                                </h3>
                                            </div>

                                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                                <div className="space-y-2">
                                                    <Label>Position *</Label>
                                                    <Input name="position" required placeholder="Enter position" className="h-10" />
                                                    <InputError message={errors.position} />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Date Hired *</Label>
                                                    <Input
                                                        type="date"
                                                        name="date_hired"
                                                        required
                                                        className="h-10"
                                                    />
                                                    <InputError message={errors.date_hired} />
                                                </div>

                                                {/* Basic Salary */}
                                                <div className="space-y-2">
                                                    <Label>Basic Salary *</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                            ₱ 
                                                        </span>
                                                        <Input
                                                            name="basic_salary"
                                                            required
                                                            className="pl-8 text-left font-medium tracking-wide h-10"
                                                            placeholder="0.00"
                                                            value={basicSalaryRaw}
                                                            onChange={(e) => {
                                                                const raw = e.target.value.replace(/,/g, '')
                                                                if (!/^\d*\.?\d*$/.test(raw)) return
                                                                setBasicSalaryRaw(
                                                                    formatNumberWithCommas(raw)
                                                                )
                                                            }}
                                                        />
                                                    </div>
                                                    <InputError message={errors.basic_salary} />
                                                </div>

                                                {/* Share Capital */}
                                                <div className="space-y-2">
                                                    <Label>Share Capital Balance</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                            ₱ 
                                                        </span>
                                                        <Input
                                                            name="share_capital_balance"
                                                            className="pl-8 text-left font-medium tracking-wide h-10"
                                                            placeholder="0.00"
                                                            value={shareCapitalRaw}
                                                            onChange={(e) => {
                                                                const raw = e.target.value.replace(/,/g, '')
                                                                if (!/^\d*\.?\d*$/.test(raw)) return
                                                                setShareCapitalRaw(
                                                                    formatNumberWithCommas(raw)
                                                                )
                                                            }}
                                                        />
                                                    </div>
                                                    <InputError
                                                        message={errors.share_capital_balance}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Bank Account Number</Label>
                                                    <Input name="bank_account_number" placeholder="Enter bank account number" className="h-10" />
                                                    <InputError
                                                        message={errors.bank_account_number}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>TIN Number</Label>
                                                    <Input name="tin_number" placeholder="Enter TIN number" className="h-10" />
                                                    <InputError message={errors.tin_number} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between border-t pt-6">
                                            <p className="text-sm text-muted-foreground">
                                                Double-check all information before submitting.
                                            </p>

                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="min-w-[180px] h-10 font-medium"
                                            >
                                                {processing && (
                                                    <Spinner className="mr-2 h-4 w-4" />
                                                )}
                                                Create Member
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}