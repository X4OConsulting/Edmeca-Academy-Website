import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar, initialsOf } from '@/components/UserAvatar';

describe('initialsOf', () => {
  it('uses first and last name initials', () => {
    expect(initialsOf('Keenan van der Merwe')).toBe('KM');
    expect(initialsOf('  thandi  ')).toBe('TH');
  });

  it('falls back to the email name, then "?"', () => {
    expect(initialsOf('khusselmann@x4o.co.za')).toBe('KH');
    expect(initialsOf('')).toBe('?');
    expect(initialsOf(null)).toBe('?');
  });
});

describe('UserAvatar', () => {
  it('shows initials when there is no photo', () => {
    render(<UserAvatar name="Ada Lovelace" testId="av" />);
    expect(screen.getByTestId('av')).toHaveTextContent('AL');
  });
});
