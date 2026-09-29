/** Sign-in page: forgot password, resending the confirmation email, and no GitHub button (not enabled in Supabase). */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => React.createElement('a', { href }, children),
  useLocation: () => ['/login', vi.fn()],
}));
vi.mock('@/components/marketing/MarketingLayout', () => ({ MarketingLayout: ({ children }: any) => React.createElement('div', null, children) }));

const { signInWithEmail, resetPasswordForEmail, resend } = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
  resend: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ signInWithEmail, signUpWithEmail: vi.fn(), signInWithOAuth: vi.fn(), isLoading: false }),
}));

vi.mock('@/lib/supabase', () => ({ supabase: { auth: { resetPasswordForEmail, resend } } }));

import Login from '@/pages/Login';

beforeEach(() => {
  vi.clearAllMocks();
  resetPasswordForEmail.mockResolvedValue({ error: null });
  resend.mockResolvedValue({ error: null });
});

describe('Login', () => {
  it('offers Google only, not GitHub', () => {
    render(<Login />);
    expect(screen.queryByText(/github/i)).not.toBeInTheDocument();
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
  });

  it('asks for the email before sending a reset link', async () => {
    render(<Login />);
    await userEvent.click(screen.getByTestId('button-forgot-password'));
    expect(screen.getByText(/enter your email address above/i)).toBeInTheDocument();
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('sends a reset link that returns to /reset-password on this site', async () => {
    render(<Login />);
    await userEvent.type(screen.getByTestId('input-signin-email'), 'founder@example.com');
    await userEvent.click(screen.getByTestId('button-forgot-password'));
    expect(resetPasswordForEmail).toHaveBeenCalledWith('founder@example.com', { redirectTo: `${window.location.origin}/reset-password` });
    expect(await screen.findByText(/we've emailed a link/i)).toBeInTheDocument();
  });

  it('offers to resend the confirmation email when the address is not confirmed', async () => {
    signInWithEmail.mockRejectedValueOnce(Object.assign(new Error('Email not confirmed'), { code: 'email_not_confirmed' }));
    render(<Login />);
    await userEvent.type(screen.getByTestId('input-signin-email'), 'founder@example.com');
    await userEvent.type(screen.getByTestId('input-signin-password'), 'secret123');
    await userEvent.click(screen.getByTestId('button-signin-submit'));
    await userEvent.click(await screen.findByTestId('button-resend-confirmation'));
    expect(resend).toHaveBeenCalledWith(expect.objectContaining({ type: 'signup', email: 'founder@example.com' }));
    expect(await screen.findByText(/sent a new confirmation link/i)).toBeInTheDocument();
  });
});
