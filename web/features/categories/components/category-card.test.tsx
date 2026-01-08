import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryCard } from './category-card';

// Mock NavCard
vi.mock('@/components/shared/nav-card', () => ({
  NavCard: ({ name, count, href }: any) => (
    <div data-testid="nav-card">
      <a href={href}>{name}</a>
      <span>{count}</span>
    </div>
  ),
}));

describe('CategoryCard', () => {
  it('renders correctly', () => {
    render(<CategoryCard id="c1" name="Phones" count={10} imageUrl="/img.jpg" />);
    
    expect(screen.getByText('Phones')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    // Check href formed correctly from id
    const link = screen.getByRole('link', { name: 'Phones' });
    expect(link).toHaveAttribute('href', '/categories/c1');
  });

  it('handles optional props', () => {
    render(<CategoryCard id="c2" name="Laptops" />);
    expect(screen.getByText('Laptops')).toBeInTheDocument();
    // count is undefined, mocked NavCard renders empty span or similar, just text check passes
  });
});
