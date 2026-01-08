import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductCard } from './product-card';
import { useQuickViewStore } from '../store/quick-view.store';
import { useFeatureFlags } from '@/features/admin/hooks/use-feature-flags';
import { useTranslations } from 'next-intl';

// Mocks
vi.mock('@/components/shared/motion-button', () => ({
  MotionButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));
vi.mock('@/features/wishlist/components/wishlist-button', () => ({
  WishlistButton: () => <button>Wishlist</button>,
}));
vi.mock('../store/quick-view.store');
vi.mock('@/features/admin/hooks/use-feature-flags');
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('swr', () => ({
  preload: vi.fn(),
}));
vi.mock('@/features/products/hooks/use-stock', () => ({
  useStock: (stock: number) => stock,
}));
vi.mock('./product-card-base', () => ({
  ProductCardBase: ({ name, actions }: any) => (
    <div>
      <span>{name}</span>
      {actions.quickView}
      {actions.wishlist}
    </div>
  ),
}));

describe('ProductCard', () => {
  const mockOpenQuickView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useQuickViewStore as any).mockReturnValue({ openQuickView: mockOpenQuickView });
    (useFeatureFlags as any).mockReturnValue({ isEnabled: vi.fn().mockReturnValue(true) });
  });

  const defaultProps = {
    id: '1',
    name: 'Test Product',
    price: 100,
    imageUrl: '/img.jpg',
  };

  it('renders product name', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('opens quick view on click', () => {
    render(<ProductCard {...defaultProps} />);
    const quickViewBtn = screen.getByText('quickView');
    fireEvent.click(quickViewBtn);
    expect(mockOpenQuickView).toHaveBeenCalledWith('1', undefined, expect.any(Object));
  });

  it('checks feature flags for badges', () => {
     // We mocked ProductCardBase to simpler render, so testing logic passed to it might require 
     // spying on ProductCardBase props or relying on what is rendered. 
     // Since we mocked ProductCardBase, let's verify if hooks are called.
     render(<ProductCard {...defaultProps} isNew={true} />);
     expect(useFeatureFlags).toHaveBeenCalled();
  });
});
