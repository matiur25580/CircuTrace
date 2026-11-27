import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('CircuTrace workspace shell', () => {
  it('renders the product intelligence workspace', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /good morning, matiur/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /product registry/i })).toBeInTheDocument();
    expect(screen.getByText('Passport completeness')).toBeInTheDocument();
  });
});
