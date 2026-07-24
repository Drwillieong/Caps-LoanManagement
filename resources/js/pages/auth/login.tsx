import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { CircleHelp, Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
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
                  <Label htmlFor="email" className="font-medium text-green-700">
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
                    className="border-green-200 text-black dark:text-black placeholder:text-green-300/70 focus:border-green-500 focus:ring-green-500/20"
                  />
                  <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label
                      htmlFor="password"
                      className="font-medium text-green-700"
                    >
                      Password
                    </Label>
                    {canResetPassword && (
                      <TextLink
                        href={request()}
                        className="ml-auto text-sm text-green-600 transition-colors hover:text-green-700 hover:underline"
                        tabIndex={5}
                      >
                        Forgot password?
                      </TextLink>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      tabIndex={2}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="border-green-200 pr-10 text-black dark:text-black placeholder:text-green-300/70 focus:border-green-500 focus:ring-green-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <InputError message={errors.password} />
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="remember"
                    name="remember"
                    tabIndex={3}
                    className="border-green-300 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600"
                  />
                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-sm text-green-600"
                  >
                    Remember me
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="mt-4 w-full border-0 bg-gradient-to-r from-green-600 to-green-500 font-semibold text-white shadow-lg shadow-green-600/25 transition-all duration-300 hover:scale-[1.02] hover:from-green-700 hover:to-green-600 hover:shadow-xl hover:shadow-green-600/30"
                  tabIndex={4}
                  disabled={processing}
                  data-test="login-button"
                >
                  {processing && <Spinner className="mr-2 h-4 w-4 text-white" />}
                  <span className={processing ? 'opacity-80' : ''}>
                    {processing ? 'Signing in...' : 'Sign In'}
                  </span>
                </Button>
              </div>

              {status && (
                <div className="mb-4 rounded-lg border border-green-200/50 bg-green-50/80 px-3 py-2 text-center text-sm font-medium text-green-600">
                  {status}
                </div>
              )}

              {canRegister && (
                <div className="text-center text-sm text-green-600/80"></div>
              )}
            </>
          )}
        </Form>
      </AuthLayout>

      <Button
        type="button"
        onClick={() => router.visit('/faq')}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-green-600 px-5 py-6 text-white shadow-xl shadow-green-700/30 hover:bg-green-700"
      >
        <CircleHelp className="size-5" />
        FAQ
      </Button>
    </>
  );
}