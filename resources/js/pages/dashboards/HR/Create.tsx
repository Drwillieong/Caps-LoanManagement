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
    const [password, setPassword] = useState('Member@123'); // ✅ Default Password

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

                                            {/* Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    placeholder="Kayleen Minor"
                                                />
                                                <InputError message={errors.name} />
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