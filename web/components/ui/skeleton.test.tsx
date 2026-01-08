import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders skeleton element', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Skeleton data-testid="skeleton" className="w-32 h-8" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('w-32');
    expect(skeleton).toHaveClass('h-8');
  });

  it('has shimmer animation class', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.className).toContain('animate-shimmer');
  });

  it('renders as div element', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton').tagName).toBe('DIV');
  });
});
