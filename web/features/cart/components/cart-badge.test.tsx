import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartBadge } from './cart-badge';
import { useCartStore } from '@/features/cart/store/cart.store';

// Mock store
vi.mock('@/features/cart/store/cart.store', () => ({
  useCartStore: vi.fn(),
}));

describe('CartBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders count when greater than 0', () => {
    (useCartStore as any).mockReturnValue({ count: 5 });
    render(<CartBadge />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('returns null when count is 0', () => {
    (useCartStore as any).mockReturnValue({ count: 0 });
    const { container } = render(<CartBadge />);
    expect(container).toBeEmptyDOMElement();
  });
});
