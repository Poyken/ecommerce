import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

describe('Tabs', () => {
  it('renders tabs structure', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('first tab is active by default', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    const tab1 = screen.getByText('Tab 1');
    expect(tab1).toHaveAttribute('data-state', 'active');
  });

  it('applies data-slot attributes', () => {
    render(
      <Tabs defaultValue="tab1" data-testid="tabs">
        <TabsList data-testid="list">
          <TabsTrigger value="tab1" data-testid="trigger">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" data-testid="content">Content</TabsContent>
      </Tabs>
    );
    
    expect(screen.getByTestId('tabs')).toHaveAttribute('data-slot', 'tabs');
    expect(screen.getByTestId('list')).toHaveAttribute('data-slot', 'tabs-list');
    expect(screen.getByTestId('trigger')).toHaveAttribute('data-slot', 'tabs-trigger');
    expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'tabs-content');
  });
});
