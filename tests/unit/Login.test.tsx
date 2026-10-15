/** Sign-in page: emailed-code sign-in (default), password sign-in, Google, and the messages users see. */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const { navigate, toast, requestSignInCode, signInWithCode, signInWithEmail, signInWithOAuth, requestPasswordReset } = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
  requestSignInCode: vi.fn(),
  signInWithCode: vi.fn(),
  signInWithEmail: vi.fn(),
  signInWithOAuth: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => React.createElement('a', { href }, children),
  useLocation: () => ['/login', navigate],
}));
vi.mock('@/components/marketing/MarketingLayout', () => ({ MarketingLayout: ({ children }: any) => React.createElement('div', null, children) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ requestSignInCode, signInWithCode, signInWithEmail, signInWithOAuth, isLoading: false }),
}));
vi.mock('@/lib/auth-client', () => ({ authClient: { requestPasswordReset } }));

import Login from '@/pages/Login';

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/login');
  requestSignInCode.mockResolvedValue({ success: true });
  signInWithCode.mockResolvedValue({ existing: true });
  requestPasswordReset.mockResolvedValue({ error: null });
});

async function requestCode(email = 'Founder@Example.com') {
  render(<Login />);
  await userEvent.type(screen.getByTestId('input-code-email'), email);
  await userEvent.click(screen.getByTestId('button-send-code'));
}

describe('Login – email code (default)', () => {
  it('offers Google, not GitHub, and has no separate sign-up form', () => {
    render(<Login />);
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    expect(screen.queryByText(/github/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create account/i)).not.toBeInTheDocument();
  });

  it('sends a code to the lower-cased email and moves to the code step', async () => {
    await requestCode();
    expect(requestSignInCode).toHaveBeenCalledWith('founder@example.com');
    expect(await screen.findByText(/we sent a 6-digit code to founder@example.com/i)).toBeInTheDocument();
    expect(screen.getByTestId('button-verify-code')).toBeInTheDocument();
    expect(screen.getByTestId('button-resend-code')).toBeDisabled();
  });

  it('refuses an invalid email without sending anything', async () => {
    await requestCode('not-an-email');
    expect(requestSignInCode).not.toHaveBeenCalled();
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/valid email/i);
  });

  it('signs in with the code and says "welcome back" for an existing account', async () => {
    await requestCode();
    await userEvent.type(await screen.findByTestId('input-code-otp'), '123456');
    await waitFor(() => expect(signInWithCode).toHaveBeenCalledWith('founder@example.com', '123456'));
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Welcome back' }));
    expect(navigate).toHaveBeenCalledWith('/portal');
  });

  it('welcomes a new account', async () => {
    signInWithCode.mockResolvedValue({ existing: false });
    await requestCode();
    await userEvent.type(await screen.findByTestId('input-code-otp'), '654321');
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Welcome to EDMECA' })));
  });

  it('shows the plain-language message for a wrong code', async () => {
    signInWithCode.mockRejectedValue(new Error('That code is not right. Check the latest email from EDMECA and try again.'));
    await requestCode();
    await userEvent.type(await screen.findByTestId('input-code-otp'), '000000');
    expect(await screen.findByTestId('alert-error')).toHaveTextContent(/that code is not right/i);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('lets the user go back and use a different email', async () => {
    await requestCode();
    await userEvent.click(await screen.findByTestId('button-change-email'));
    expect(screen.getByTestId('input-code-email')).toBeInTheDocument();
  });
});

describe('Login – password', () => {
  async function passwordMode() {
    render(<Login />);
    await userEvent.click(screen.getByTestId('button-switch-mode'));
  }

  it('shows and hides the password', async () => {
    await passwordMode();
    const input = screen.getByTestId('input-signin-password');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(input).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('asks for the email before sending a reset link', async () => {
    await passwordMode();
    await userEvent.click(screen.getByTestId('button-forgot-password'));
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/enter your email address above/i);
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('sends a reset link that returns to /reset-password on this site', async () => {
    await passwordMode();
    await userEvent.type(screen.getByTestId('input-signin-email'), 'founder@example.com');
    await userEvent.click(screen.getByTestId('button-forgot-password'));
    expect(requestPasswordReset).toHaveBeenCalledWith({ email: 'founder@example.com', redirectTo: '/reset-password' });
    expect(await screen.findByTestId('alert-success')).toHaveTextContent(/emailed a link/i);
  });

  it('shows the plain-language message when the password is wrong', async () => {
    signInWithEmail.mockRejectedValue(new Error('Email or password is incorrect. If you usually sign in with Google or a code, use that instead.'));
    await passwordMode();
    await userEvent.type(screen.getByTestId('input-signin-email'), 'founder@example.com');
    await userEvent.type(screen.getByTestId('input-signin-password'), 'wrong-pass');
    await userEvent.click(screen.getByTestId('button-signin-submit'));
    expect(await screen.findByTestId('alert-error')).toHaveTextContent(/google or a code/i);
  });
});

describe('Login – Google', () => {
  it('explains a failed Google sign-in reported on the URL', () => {
    window.history.replaceState(null, '', '/login?error=access_denied');
    render(<Login />);
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/google sign-in was cancelled/i);
  });
});
