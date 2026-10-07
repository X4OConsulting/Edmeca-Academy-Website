import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { authClient } from '@/lib/auth-client';

/**
 * Where the "Forgot password?" email lands. The server checks the emailed link
 * and sends the browser here with ?token=… (or ?error=INVALID_TOKEN when the
 * link expired or was used); this page sets the new password with that token.
 */
export default function ResetPassword() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const status: 'ready' | 'expired' = token && !params.get('error') ? 'ready' : 'expired';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') ?? '');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== form.get('confirmPassword')) return setError('Passwords do not match');
    setIsSubmitting(true);
    const { error: resetError } = await authClient.resetPassword({ newPassword: password, token: token! });
    setIsSubmitting(false);
    if (resetError) return setError(resetError.message || 'This reset link has expired. Please request a new one.');
    // Resetting signs every session out; sign in with the new password.
    navigate('/login');
  };

  return (
    <MarketingLayout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>Choose a new password for your EDMECA Academy account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'expired' && (
              <Alert variant="destructive">
                <AlertDescription>
                  This reset link has expired or was already used. <Link href="/login" className="underline">Request a new one</Link> from the sign-in page.
                </AlertDescription>
              </Alert>
            )}
            {status === 'ready' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input id="new-password" name="password" type="password" required autoComplete="new-password" data-testid="input-new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm new password</Label>
                  <Input id="confirm-new-password" name="confirmPassword" type="password" required autoComplete="new-password" />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-set-password">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save new password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MarketingLayout>
  );
}
