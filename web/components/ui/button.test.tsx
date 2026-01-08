import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './button'; // Ensure correct path
import React from 'react';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-destructive');
  });

  it('applies size classes', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('h-9');
  });

  it('shows loading spinner when loading is true', () => {
    render(<Button loading>Submit</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // Check for spinner (Lucide Loader2 usually renders an svg)
    // We can check if child likely contains loading elements or simply snapshot, 
    // but better to check if it contains the loader class if possible or just existence.
    // The implementation passes loading prop which renders <Loader2 />.
    // Let's check if the button contains an SVG which is likely the loader.
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.toString()).toContain('animate-spin');
  });

  it('renders asChild correctly', () => {
    // Requires Slot from radix, which merges props.
    // Testing if it renders the child element instead of button
    render(
      <Button asChild>
        <a href="/link">Link Button</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    // Should still have button classes
    expect(link.className).toContain('inline-flex');
  });
});
