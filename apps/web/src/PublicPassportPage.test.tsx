import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import PublicPassportPage from './PublicPassportPage';

vi.mock('./lib/api', () => ({ apiRequest: vi.fn() }));
import { apiRequest } from './lib/api';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('public digital passport page', () => {
  it('renders only the sections returned by the public API', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      passport: { status: 'published', publishedAt: '2026-11-28T00:00:00.000Z', updatedAt: '2026-11-28T00:00:00.000Z' },
      productStatus: 'active',
      identity: { identifier: 'CT-12345-000001', name: 'Circular aluminium bottle', description: 'Reusable bottle', category: { name: 'Packaging' } },
      manufacturer: { name: 'Example Manufacturer', countryCode: 'IN' },
      lifecycle: [{ eventId: 'CTE-12345-0000001', type: 'manufactured', occurredAt: '2026-11-20T00:00:00.000Z', description: 'Manufactured at the registered facility.', sourceClassification: 'self_reported' }],
    });
    window.history.pushState({}, '', '/passport/public-demo-slug');
    render(<PublicPassportPage />);
    expect(await screen.findByRole('heading', { name: 'Circular aluminium bottle' })).toBeTruthy();
    expect(screen.getByText('Example Manufacturer')).toBeTruthy();
    expect(screen.getByText('Manufactured at the registered facility.')).toBeTruthy();
    expect(screen.queryByText('Internal organization ID')).toBeNull();
    expect(apiRequest).toHaveBeenCalledWith('/passports/public/public-demo-slug');
  });

  it('shows a safe unavailable state when the public slug is invalid or revoked', async () => {
    vi.mocked(apiRequest).mockRejectedValue(new Error('Public passport was not found.'));
    window.history.pushState({}, '', '/passport/revoked-slug');
    render(<PublicPassportPage />);
    expect(await screen.findByRole('heading', { name: 'Passport unavailable' })).toBeTruthy();
    expect(screen.getByText('Public passport was not found.')).toBeTruthy();
  });
});
