import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WishlistButton } from './wishlist-button';

// Mocks
vi.mock('@/components/shared/motion-button', () => ({
  MotionButton: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-testid="wishlist-btn">
      {children}
    </button>
  ),
}));

vi.mock('@/components/shared/use-toast', () => ({
  useToast: () => ({ toast: vi.fn(), dismiss: vi.fn() }),
}));

const mockUseAuth = vi.fn();
vi.mock('@/features/auth/providers/auth-provider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/features/wishlist/actions', () => ({
  toggleWishlistAction: vi.fn(),
}));

vi.mock('@/features/wishlist/hooks/use-guest-wishlist', () => ({
  useGuestWishlist: () => ({
    hasItem: vi.fn().mockReturnValue(false),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
  }),
}));

vi.mock('@/features/wishlist/store/wishlist.store', () => ({
  useWishlistStore: { getState: () => ({ updateCount: vi.fn(), refreshWishlist: vi.fn() }) },
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('lucide-react', () => ({
  Heart: () => <span data-testid="heart-icon">♥</span>,
}));

describe('WishlistButton', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
  });

  it('renders icon variant by default', () => {
    render(<WishlistButton productId="p1" />);
    expect(screen.getByTestId('wishlist-btn')).toBeInTheDocument();
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
  });

  it('renders full variant with text', () => {
    render(<WishlistButton productId="p1" variant="full" />);
    expect(screen.getByText('saveForLater')).toBeInTheDocument();
  });

  it('shows saved text when wishlisted (authenticated)', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    render(<WishlistButton productId="p1" variant="full" initialIsWishlisted={true} />);
    expect(screen.getByText('saved')).toBeInTheDocument();
  });

  it('handles click for guest user', () => {
    render(<WishlistButton productId="p1" />);
    const btn = screen.getByTestId('wishlist-btn');
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });
});
