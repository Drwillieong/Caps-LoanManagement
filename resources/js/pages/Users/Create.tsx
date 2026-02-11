import { Transition } from '@headlessui/react';
import AppLayout from '@/layouts/app-layout';
import { Form, Head } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { type BreadcrumbItem } from '@/types';
import { store } from '@/routes/users';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Members', href: '/users' },
    { title: 'Create', href: '/users/create' },
];

export default function Create() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />

            <div className="py-5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    {/* Card */}
                    <div className="rounded-xl border bg-white shadow-sm">
                        <div className="border-b px-8 py-6">
                            <HeadingSmall
                                title="Create New Member"
                                description="Fill in the information below to add a new member"
                            />
                        </div>

                        <div className="p-8">
                            <Form
                                {...store.form()}
                                resetOnSuccess={['password', 'password_confirmation']}
                                disableWhileProcessing
                            >
                                {({ processing, errors, recentlySuccessful }) => (
                                    <>
                                        {/* Success Alert */}
                                        <Transition
                                            show={recentlySuccessful}
                                            enter="transition ease-out duration-300"
                                            enterFrom="opacity-0 -translate-y-2"
                                            enterTo="opacity-100 translate-y-0"
                                            leave="transition ease-in duration-200"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-sm">
                                                <div className="font-medium">
                                                    ✅ Member successfully created!
                                                </div>
                                                <p className="text-sm text-green-700">
                                                    The new member has been added to your team.
                                                </p>
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
                                                    autoComplete="name"
                                                    placeholder="John Doe"
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
                                                    autoComplete="email"
                                                    placeholder="john@example.com"
                                                />
                                                <InputError message={errors.email} />
                                            </div>

                                            {/* Password */}
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Password</Label>
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    required
                                                    autoComplete="new-password"
                                                    placeholder="Enter password"
                                                />
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
                                                    type="password"
                                                    required
                                                    autoComplete="new-password"
                                                    placeholder="Confirm password"
                                                />
                                                <InputError message={errors.password_confirmation} />
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="mt-8 flex justify-end">
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="min-w-[150px]"
                                            >
                                                {processing && <Spinner className="mr-2" />}
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
