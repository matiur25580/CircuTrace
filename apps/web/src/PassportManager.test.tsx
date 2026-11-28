import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import PassportManager from './PassportManager';

vi.mock('./lib/api', () => ({ apiRequest: vi.fn() }));
import { apiRequest } from './lib/api';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

function mockWorkspace(productStatus = 'active') {
  vi.mocked(apiRequest).mockImplementation(async (path: string) => {
    if (path.startsWith('/products?')) return { products: [{ identifier: 'CT-ORG-000001', name: 'Reusable bottle', status: productStatus }] };
    return { passport: null };
  });
}

describe('passport manager permissions', () => {
  it('allows a member with products:write permission to publish', async () => {
    mockWorkspace();
    render(<PassportManager role="member" />);
    expect(await screen.findByRole('button', { name: 'Publish passport' })).toBeEnabled();
  });

  it('does not allow an auditor to publish', async () => {
    mockWorkspace();
    render(<PassportManager role="auditor" />);
    expect(await screen.findByRole('button', { name: 'Publish passport' })).toBeDisabled();
  });

  it('prevents draft products from being published', async () => {
    mockWorkspace('draft');
    render(<PassportManager role="owner" />);
    expect(await screen.findByRole('button', { name: 'Publish passport' })).toBeDisabled();
    expect(screen.getByText(/Activate this product in the Product Registry/)).toBeTruthy();
  });
});
