import { Form, Head } from '@inertiajs/react';
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
import { Eye, EyeOff } from 'lucide-react';

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
              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-green-700 font-medium">
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

              {/* Password */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-green-700 font-medium">
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

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    tabIndex={2}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="border-green-200 focus:border-green-500 focus:ring-green-500/20 placeholder:text-green-300/70 pr-10"
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

              {/* Remember me */}
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

              {/* Submit */}
              <Button
                type="submit"
                className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-600/25 border-0 transition-all duration-300 hover:shadow-xl hover:shadow-green-600/30 hover:scale-[1.02]"
                tabIndex={4}
                disabled={processing}
                data-test="login-button"
              >
                {processing && <Spinner className="mr-2 h-4 w-4 text-white" />}
                <span className={processing ? 'opacity-80' : ''}>
                  {processing ? 'Signing in…' : 'Sign In'}
                </span>
              </Button>
            </div>

            {/* Status message */}
            {status && (
              <div className="mb-4 text-center text-sm font-medium text-green-600 bg-green-50/80 py-2 px-3 rounded-lg border border-green-200/50">
                {status}
              </div>
            )}

            {/* Register link */}
            {canRegister && (
              <div className="text-center text-sm text-green-600/80">
                Don&apos;t have an account?{' '}
              
              </div>
            )}
          </>
        )}
      </Form>
    </AuthLayout>
  );
}
