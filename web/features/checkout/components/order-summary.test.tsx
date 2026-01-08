import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderSummary } from './order-summary';
import { CartItem } from '@/types/models';

// Mocks
vi.mock('@/components/shared/glass-card', () => ({
  GlassCard: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.join(' '),
  formatCurrency: (val: number) => `VND ${val}`,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />
}));

describe('OrderSummary', () => {
  const items: CartItem[] = [
    {
      id: 'i1',
      cartId: 'c1',
      skuId: 's1',
      quantity: 2,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      sku: {
        id: 's1',
        skuCode: 'SKU1',
        price: 100000,
        salePrice: 90000,
        stock: 10,
        status: 'ACTIVE',
        productId: 'p1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        product: {
          id: 'p1',
          name: 'Prod 1',
          slug: 'prod-1',
          categoryId: 'cat1',
          brandId: 'brand1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          images: [],
        },
        optionValues: []
      }
    }
  ];

  it('renders items and calculations correctly', () => {
    render(
      <OrderSummary
        items={items}
        subtotal={180000}
        shippingFee={30000}
        discount={10000}
        total={200000}
        actionSlot={<button>Checkout</button>}
      />
    );

    expect(screen.getByText('Prod 1')).toBeInTheDocument();
    expect(screen.getAllByText('VND 180000')[0]).toBeInTheDocument(); // Subtotal match item total
    expect(screen.getByText('VND 30000')).toBeInTheDocument(); // Shipping
    expect(screen.getByText('-VND 10000')).toBeInTheDocument(); // Discount
    expect(screen.getByText('VND 200000')).toBeInTheDocument(); // Total
    expect(screen.getByText('Checkout')).toBeInTheDocument(); // Action Slot
  });

  it('shows free shipping', () => {
    render(
      <OrderSummary
        items={items}
        subtotal={180000}
        shippingFee={0}
        discount={0}
        total={180000}
      />
    );
    expect(screen.getByText('freeShipping')).toBeInTheDocument();
  });

  it('shows loading state for fee', () => {
    const { container } = render(
      <OrderSummary
        items={items}
        subtotal={180000}
        shippingFee={0}
        discount={0}
        total={180000}
        isLoadingFee={true}
      />
    );
    // Check for pulse animation class or absence of shipping fee text
    expect(container.getElementsByClassName('animate-pulse').length).toBeGreaterThan(0);
  });
});
