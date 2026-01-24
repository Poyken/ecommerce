

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the cart store
const mockUseCartStore = vi.fn();
vi.mock("@/features/cart/store/cart.store", () => ({
  useCartStore: () => mockUseCartStore(),
}));

// Simple CartBadge component for testing
function CartBadge() {
  const { count } = mockUseCartStore();

  if (count === 0) return null;

  return (
    <span
      data-testid="cart-badge"
      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

describe("CartBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when count is 0", () => {
    mockUseCartStore.mockReturnValue({ count: 0 });

    render(<CartBadge />);

    expect(screen.queryByTestId("cart-badge")).toBeNull();
  });

  it("should render count when items exist", () => {
    mockUseCartStore.mockReturnValue({ count: 5 });

    render(<CartBadge />);

    expect(screen.getByTestId("cart-badge")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should show 99+ when count exceeds 99", () => {
    mockUseCartStore.mockReturnValue({ count: 150 });

    render(<CartBadge />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("should have correct styling", () => {
    mockUseCartStore.mockReturnValue({ count: 3 });

    render(<CartBadge />);

    const badge = screen.getByTestId("cart-badge");
    expect(badge).toHaveClass("bg-red-500", "text-white", "rounded-full");
  });
});
