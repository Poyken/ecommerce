import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './input';
import React from 'react';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('handles onChange events', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox'); // Input type text by default corresponds to textbox role
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect((input as HTMLInputElement).value).toBe('test');
  });

  it('applies basic classes', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('rounded-lg');
    expect(input.className).toContain('border-input');
  });

  it('merges custom classes', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-class');
    // Default class should still be there (unless completely overriden by twMerge if conflicting, but 'custom-class' likely doesn't conflict)
    expect(input.className).toContain('rounded-lg');
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });
  
  it('supports other types like password', () => {
      // Password input does not have implicit role 'textbox', so look up by placeholder
      render(<Input type="password" placeholder="Password" />);
      const input = screen.getByPlaceholderText('Password');
      expect(input).toHaveAttribute('type', 'password');
  });
});
