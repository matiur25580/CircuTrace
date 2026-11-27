import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import App from '../App';

describe('authentication experience', () => {
  it('shows the sign-in screen when no refresh session exists', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: { message: 'No session' } }), { status: 401 });
    render(<AuthProvider><App /></AuthProvider>);
    expect(await screen.findByRole('heading', { name: /sign in to circutrace/i })).toBeInTheDocument();
  });
});
