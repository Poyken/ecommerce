/**
 * =====================================================================
 * CART INITIALIZER TEST - Integration between Store and Initializer
 * =====================================================================
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { CartInitializer } from "../cart-initializer";
import { useCartStore } from "../../store/cart.store";

// Mock the cart actions
const mockGetCartCountAction = vi.fn();
vi.mock("@/features/cart/actions", () => ({
  getCartCountAction: () => mockGetCartCountAction(),
}));

describe("CartInitializer Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store state manually
    act(() => {
      useCartStore.setState({ count: 0, isFetching: false });
    });
    localStorage.clear();
  });

  it("should hydrate count from props", async () => {
    render(<CartInitializer initialCount={10} />);

    await waitFor(() => {
      expect(useCartStore.getState().count).toBe(10);
    });
  });

  it("should fetch count from API if user is logged in", async () => {
    mockGetCartCountAction.mockResolvedValue({
      success: true,
      data: { totalItems: 25 },
    });

    const mockUser = { id: "user-1", email: "test@example.com" } as any;

    render(<CartInitializer initialUser={mockUser} />);

    await waitFor(() => {
      expect(useCartStore.getState().count).toBe(25);
    });
    expect(mockGetCartCountAction).toHaveBeenCalledTimes(1);
  });

  it("should read from localStorage if user is a guest", async () => {
    const guestCart = JSON.stringify([
      { skuId: "1", quantity: 2 },
      { skuId: "2", quantity: 3 },
    ]);
    localStorage.setItem("guest_cart", guestCart);

    render(<CartInitializer initialUser={null} />);

    await waitFor(() => {
      expect(useCartStore.getState().count).toBe(5);
    });
    expect(mockGetCartCountAction).not.toHaveBeenCalled();
  });

  it("should update count when guest_cart_updated event is triggered", async () => {
    render(<CartInitializer initialUser={null} />);

    // Update localStorage and trigger event
    const guestCart = JSON.stringify([{ skuId: "1", quantity: 7 }]);
    localStorage.setItem("guest_cart", guestCart);

    await act(async () => {
      window.dispatchEvent(new Event("guest_cart_updated"));
    });

    await waitFor(() => {
      expect(useCartStore.getState().count).toBe(7);
    });
  });

  it("should reset count to 0 when cart_clear event is triggered", async () => {
    render(<CartInitializer initialCount={15} />);

    await waitFor(() => {
      expect(useCartStore.getState().count).toBe(15);
    });

    await act(async () => {
      window.dispatchEvent(new Event("cart_clear"));
    });

    await waitFor(() => {
      expect(useCartStore.getState().count).toBe(0);
    });
  });

  it("should sync when storage event from other tab occurs", async () => {
    render(<CartInitializer initialUser={null} />);

    const guestCart = JSON.stringify([{ skuId: "1", quantity: 12 }]);
    localStorage.setItem("guest_cart", guestCart);

    // Simulate storage event from another tab
    const storageEvent = new StorageEvent("storage", {
      key: "guest_cart",
      newValue: guestCart,
    });

    await act(async () => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(useCartStore.getState().count).toBe(12);
    });
  });
});
