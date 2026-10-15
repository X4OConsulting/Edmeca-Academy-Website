import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { friendlyAuthError, friendlyOAuthError } from '@/lib/auth-errors';
import { useToast } from '@/hooks/use-toast';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

const RESEND_SECONDS = 30;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = 'code' | 'password';
type Step = 'email' | 'verify';

/**
 * Sign-in page. The default is an emailed 6-digit code: it works for every
 * account (password, Google or code) and creates one for a new email, so there
 * is no separate sign-up and no way to make a duplicate account.
 */
export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, signInWithEmail, requestSignInCode, signInWithCode, signInWithOAuth, isLoading } = useAuth();
  const [mode, setMode] = useState<Mode>('code');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Already signed in (another tab, a Google return, a back button): go to the portal.
  useEffect(() => {
    if (!isLoading && user) navigate('/portal');
  }, [isLoading, user, navigate]);

  // Google sign-in reports failures back as /login?error=…
  useEffect(() => {
    const message = friendlyOAuthError(new URLSearchParams(window.location.search).get('error'));
    if (message) setError(message);
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const reset = () => { setError(null); setSuccess(null); };
  const cleanEmail = () => email.trim().toLowerCase();

  const sendCode = async () => {
    reset();
    if (!EMAIL.test(cleanEmail())) return setError('Enter a valid email address.');
    setIsSubmitting(true);
    try {
      await requestSignInCode(cleanEmail());
      setStep('verify');
      setCode('');
      setResendIn(RESEND_SECONDS);
      setSuccess(`We sent a 6-digit code to ${cleanEmail()}. It can take a minute; check your spam folder too.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : friendlyAuthError(null));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async (value = code) => {
    reset();
    if (value.length !== 6) return setError('Enter the 6-digit code from the email.');
    setIsSubmitting(true);
    try {
      const { existing } = await signInWithCode(cleanEmail(), value);
      toast(existing
        ? { title: 'Welcome back', description: 'You are signed in to your existing account.' }
        : { title: 'Welcome to EDMECA', description: 'Your account is ready.' });
      navigate('/portal');
    } catch (err) {
      setCode('');
      setError(err instanceof Error ? err.message : friendlyAuthError(null));
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInWithPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    reset();
    const password = String(new FormData(e.currentTarget).get('password') ?? '');
    if (!EMAIL.test(cleanEmail())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setIsSubmitting(true);
    try {
      await signInWithEmail(cleanEmail(), password);
      navigate('/portal');
    } catch (err) {
      setError(err instanceof Error ? err.message : friendlyAuthError(null));
    } finally {
      setIsSubmitting(false);
    }
  };

  const forgotPassword = async () => {
    reset();
    if (!EMAIL.test(cleanEmail())) return setError('Enter your email address above, then click "Forgot password?" again.');
    const { error: resetError } = await authClient.requestPasswordReset({ email: cleanEmail(), redirectTo: '/reset-password' });
    if (resetError) setError(friendlyAuthError(resetError, 'Could not send the reset email. Please try again.'));
    else setSuccess(`If ${cleanEmail()} has a password, we've emailed a link to set a new one. No password yet? Sign in with an email code instead.`);
  };

  const google = async () => {
    reset();
    try {
      await signInWithOAuth('google');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in did not start. Please try again.');
    }
  };

  const switchMode = (next: Mode) => { reset(); setMode(next); setStep('email'); setCode(''); };

  if (isLoading) {
    return (
      <MarketingLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Welcome to EDMECA Academy</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign in or create your account to access the portal</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{mode === 'code' ? 'Sign in with an email code' : 'Sign in with your password'}</CardTitle>
              <CardDescription>
                {mode === 'code'
                  ? 'New here? The same steps create your account. No password needed.'
                  : 'For accounts that have a password.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" data-testid="alert-error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert data-testid="alert-success">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {mode === 'code' && step === 'email' && (
                <form noValidate onSubmit={(e) => { e.preventDefault(); void sendCode(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code-email">Email</Label>
                    <Input id="code-email" type="email" autoComplete="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" data-testid="input-code-email" />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-send-code">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Email me a sign-in code
                  </Button>
                </form>
              )}

              {mode === 'code' && step === 'verify' && (
                <form noValidate onSubmit={(e) => { e.preventDefault(); void verifyCode(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code-otp">6-digit code</Label>
                    <InputOTP id="code-otp" maxLength={6} value={code} autoFocus inputMode="numeric" autoComplete="one-time-code"
                      onChange={(value) => { setCode(value.replace(/\D/g, '')); if (value.length === 6) void verifyCode(value); }}
                      data-testid="input-code-otp">
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || code.length !== 6} data-testid="button-verify-code">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" className="text-muted-foreground underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
                      disabled={resendIn > 0 || isSubmitting} onClick={() => void sendCode()} data-testid="button-resend-code">
                      {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                    </button>
                    <button type="button" className="text-muted-foreground underline-offset-2 hover:underline"
                      onClick={() => { reset(); setStep('email'); setCode(''); }} data-testid="button-change-email">
                      Use a different email
                    </button>
                  </div>
                </form>
              )}

              {mode === 'password' && (
                <form noValidate onSubmit={signInWithPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" type="email" autoComplete="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" data-testid="input-signin-email" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                        onClick={() => void forgotPassword()} data-testid="button-forgot-password">
                        Forgot password?
                      </button>
                    </div>
                    <PasswordInput id="signin-password" name="password" autoComplete="current-password" required
                      placeholder="Enter your password" data-testid="input-signin-password" />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-signin-submit">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>
                </form>
              )}

              <Separator />
              <Button type="button" variant="outline" className="w-full" onClick={() => void google()}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
              <p className="text-center text-sm">
                <button type="button" className="text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => switchMode(mode === 'code' ? 'password' : 'code')} data-testid="button-switch-mode">
                  {mode === 'code' ? 'Use a password instead' : 'Sign in with an email code instead'}
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MarketingLayout>
  );
}
