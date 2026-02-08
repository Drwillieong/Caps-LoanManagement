import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <AuthLayout
            title="Welcome Back"
            description="Sign in to your account to continue"
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label 
                                    htmlFor="email" 
                                    className="text-green-700 font-medium"
                                >
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="Enter your email"
                                    className="border-green-200 focus:border-green-500 focus:ring-green-500/20 placeholder:text-green-300/70"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label 
                                        htmlFor="password"
                                        className="text-green-700 font-medium"
                                    >
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm text-green-600 hover:text-green-700 hover:underline transition-colors"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    className="border-green-200 focus:border-green-500 focus:ring-green-500/20 placeholder:text-green-300/70"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-green-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                />
                                <Label 
                                    htmlFor="remember" 
                                    className="text-green-600 text-sm cursor-pointer"
                                >
                                    Remember me
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-600/25 border-0 transition-all duration-300 hover:shadow-xl hover:shadow-green-600/30 hover:scale-[1.02]"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner className="text-white" />}
                                <span className={processing ? 'opacity-80' : ''}>
                                    Sign In
                                </span>
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-sm text-green-600/80">
                                Don't have an account?{' '}
                                <TextLink 
                                    href={register()} 
                                    tabIndex={5}
                                    className="text-green-700 font-medium hover:text-green-800 hover:underline transition-all"
                                >
                                    Create Account
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600 bg-green-50/80 py-2 px-3 rounded-lg border border-green-200/50">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}

