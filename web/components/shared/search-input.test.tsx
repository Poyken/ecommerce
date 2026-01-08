import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchInput } from './search-input';

// Mock dependencies
vi.mock('@/i18n/routing', () => ({
  usePathname: () => '/products',
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: Function) => fn,
}));

vi.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon">🔍</span>,
  X: () => <span data-testid="x-icon">✕</span>,
}));

describe('SearchInput', () => {
  it('renders with search icon', () => {
    render(<SearchInput />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchInput placeholder="Search products..." />);
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });

  it('renders input element', () => {
    render(<SearchInput placeholder="Search" />);
    const input = screen.getByPlaceholderText('Search');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });
});
