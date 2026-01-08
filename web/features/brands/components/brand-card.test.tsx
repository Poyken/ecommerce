import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrandCard } from './brand-card';

// Mock NavCard
vi.mock('@/components/shared/nav-card', () => ({
  NavCard: ({ name, count, href, variant }: any) => (
    <div data-testid="nav-card">
      <a href={href}>{name}</a>
      <span>{count}</span>
      <span data-testid="variant">{variant}</span>
    </div>
  ),
}));

describe('BrandCard', () => {
  it('renders correctly', () => {
    render(<BrandCard id="b1" name="Nike" count={50} imageUrl="/nike.jpg" />);
    
    expect(screen.getByText('Nike')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    
    const link = screen.getByRole('link', { name: 'Nike' });
    expect(link).toHaveAttribute('href', '/brands/b1');

    const variant = screen.getByTestId('variant');
    expect(variant).toHaveTextContent('brand');
  });
});
