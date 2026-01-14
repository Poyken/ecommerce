/**
 * =====================================================================
 * PRODUCT CARD TEST - Example Component Test
 * =====================================================================
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Simple ProductCard for testing
interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  imageUrl?: string;
  onAddToCart?: () => void;
}

function ProductCard({
  id,
  name,
  slug,
  price,
  salePrice,
  imageUrl,
  onAddToCart,
}: ProductCardProps) {
  const displayPrice = salePrice ?? price;
  const hasDiscount = salePrice && salePrice < price;
  const discountPercent = hasDiscount
    ? Math.round((1 - salePrice / price) * 100)
    : 0;

  return (
    <div data-testid="product-card" className="product-card">
      <a href={`/products/${slug}`}>
        <img
          src={imageUrl || "/placeholder.png"}
          alt={name}
          data-testid="product-image"
        />
        <h3 data-testid="product-name">{name}</h3>
      </a>

      <div className="price-section">
        <span data-testid="product-price">
          {new Intl.NumberFormat("vi-VN").format(displayPrice)}đ
        </span>

        {hasDiscount && (
          <>
            <span data-testid="original-price" className="line-through">
              {new Intl.NumberFormat("vi-VN").format(price)}đ
            </span>
            <span data-testid="discount-badge">-{discountPercent}%</span>
          </>
        )}
      </div>

      <button data-testid="add-to-cart-btn" onClick={onAddToCart}>
        Thêm vào giỏ
      </button>
    </div>
  );
}

describe("ProductCard", () => {
  const mockProduct = {
    id: "prod-1",
    name: "Áo thun nam",
    slug: "ao-thun-nam",
    price: 500000,
    salePrice: 399000,
    imageUrl: "/images/shirt.jpg",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render product name", () => {
    render(<ProductCard {...mockProduct} />);

    expect(screen.getByTestId("product-name")).toHaveTextContent("Áo thun nam");
  });

  it("should link to product detail page", () => {
    render(<ProductCard {...mockProduct} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/products/ao-thun-nam");
  });

  it("should display sale price when available", () => {
    render(<ProductCard {...mockProduct} />);

    expect(screen.getByTestId("product-price")).toHaveTextContent("399.000đ");
    expect(screen.getByTestId("original-price")).toHaveTextContent("500.000đ");
  });

  it("should show discount percentage", () => {
    render(<ProductCard {...mockProduct} />);

    expect(screen.getByTestId("discount-badge")).toHaveTextContent("-20%");
  });

  it("should not show discount when no sale price", () => {
    render(<ProductCard {...mockProduct} salePrice={undefined} />);

    expect(screen.queryByTestId("discount-badge")).toBeNull();
  });

  it("should call onAddToCart when button clicked", () => {
    const mockAddToCart = vi.fn();
    render(<ProductCard {...mockProduct} onAddToCart={mockAddToCart} />);

    fireEvent.click(screen.getByTestId("add-to-cart-btn"));

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
  });

  it("should use placeholder image when no imageUrl", () => {
    render(<ProductCard {...mockProduct} imageUrl={undefined} />);

    const img = screen.getByTestId("product-image");
    expect(img).toHaveAttribute("src", "/placeholder.png");
  });
});
