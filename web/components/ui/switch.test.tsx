import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders switch component', () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('is unchecked by default', () => {
    render(<Switch aria-label="Toggle" />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('data-state', 'unchecked');
  });

  it('can be checked by default', () => {
    render(<Switch aria-label="Toggle" defaultChecked />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('data-state', 'checked');
  });

  it('toggles state on click', () => {
    render(<Switch aria-label="Toggle" />);
    const switchEl = screen.getByRole('switch');
    
    expect(switchEl).toHaveAttribute('data-state', 'unchecked');
    fireEvent.click(switchEl);
    expect(switchEl).toHaveAttribute('data-state', 'checked');
  });

  it('can be disabled', () => {
    render(<Switch aria-label="Toggle" disabled />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeDisabled();
  });

  it('calls onCheckedChange when toggled', () => {
    const handleChange = vi.fn();
    render(<Switch aria-label="Toggle" onCheckedChange={handleChange} />);
    
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });
});
