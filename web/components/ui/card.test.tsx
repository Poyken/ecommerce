import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card Components', () => {
  it('renders Card with correct data-slot', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content');
    expect(card).toHaveAttribute('data-slot', 'card');
  });

  it('renders CardHeader', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toHaveAttribute('data-slot', 'card-header');
  });

  it('renders CardTitle', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title')).toHaveAttribute('data-slot', 'card-title');
  });

  it('renders CardDescription', () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText('Description')).toHaveAttribute('data-slot', 'card-description');
  });

  it('renders CardContent', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toHaveAttribute('data-slot', 'card-content');
  });

  it('renders CardFooter', () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toHaveAttribute('data-slot', 'card-footer');
  });

  it('renders full Card composition', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Main Content</CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });
});
