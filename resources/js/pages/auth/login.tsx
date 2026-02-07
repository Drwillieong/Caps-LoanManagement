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
import { register } from '@/routes';
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
      title="Welcome back"
      description="Log in to access your loan dashboard"
    >
      <Head title="Log in" />

      <Form
        {...store.form()}
        resetOnSuccess={['password']}
        className="space-y-6"
      >
        {({ processing, errors }) => (
          <>
            <div className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@company.com"
                  tabIndex={1}
                />
                <InputError message={errors.email} />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {canResetPassword && (
                    <TextLink
                      href={request()}
                      className="text-sm"
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
                    autoComplete="current-password"
                    placeholder="••••••••"
                    tabIndex={2}
                    className="pr-10"
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
                <Checkbox id="remember" name="remember" tabIndex={3} />
                <Label htmlFor="remember" className="text-sm">
                  Remember me on this device
                </Label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full text-base"
                tabIndex={4}
                disabled={processing}
                data-test="login-button"
              >
                {processing ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>

            {/* Register link */}
            {canRegister && (
              <div className="text-center text-sm text-muted-foreground">
                Don’t have an account?{' '}
                <TextLink href={register()} tabIndex={6}>
                  Create one
                </TextLink>
              </div>
            )}
          </>
        )}
      </Form>

      {status && (
        <div className="mt-4 text-center text-sm font-medium text-green-600">
          {status}
        </div>
      )}
    </AuthLayout>
  );
}
