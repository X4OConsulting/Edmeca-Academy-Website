import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { supabase } from '@/lib/supabase';

/**
 * Where the "Forgot password?" email lands. Supabase signs the user in from
 * the link (a recovery session), and this page sets the new password.
 */
export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'checking' | 'ready' | 'expired'>('checking');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setStatus('ready');
    });
    // The link's token is exchanged as the page loads; give it a moment before calling it expired.
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setStatus((current) => (current === 'ready' || session ? 'ready' : 'expired'));
    }, 1500);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') ?? '');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== form.get('confirmPassword')) return setError('Passwords do not match');
    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);
    if (updateError) return setError(updateError.message);
    navigate('/portal');
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
            {status === 'checking' && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}
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
