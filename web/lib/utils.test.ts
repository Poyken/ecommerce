import { describe, it, expect } from "vitest";
import { cn, formatCurrency, toSlug, normalizePaginationParams } from "./utils";

describe("lib/utils", () => {
  describe("cn", () => {
    it("combines class names", () => {
      expect(cn("a", "b")).toBe("a b");
    });

    it("handles conditional class names", () => {
      expect(cn("a", false && "b", "c")).toBe("a c");
    });

    it("merges tailwind classes", () => {
      expect(cn("px-2 py-2", "p-4")).toBe("p-4");
    });
  });

  describe("formatCurrency", () => {
    it("formats VND correctly", () => {
      // Note: Intl formatting might differ slightly by environment,
      // but usually it includes non-breaking spaces or specific currency symbols.
      const result = formatCurrency(100000);
      expect(result).toMatch(/100\.000/);
      expect(result).toMatch(/₫/);
    });
  });

  describe("toSlug", () => {
    it("converts text to slug correctly", () => {
      expect(toSlug("Hello World")).toBe("hello-world");
      expect(toSlug("Sản phẩm mới")).toBe("san-pham-moi");
      expect(toSlug("iPhone 15 Pro Max!")).toBe("iphone-15-pro-max");
    });
  });

  describe("normalizePaginationParams", () => {
    it("normalizes object params", () => {
      const result = normalizePaginationParams({ page: 2, limit: 20 });
      expect(result).toEqual({ page: 2, limit: 20, search: undefined });
    });

    it("normalizes positional params", () => {
      const result = normalizePaginationParams(3, 30, "test");
      expect(result).toEqual({ page: 3, limit: 30, search: "test" });
    });

    it("uses default values", () => {
      const result = normalizePaginationParams();
      expect(result).toEqual({ page: 1, limit: 10, search: undefined });
    });
  });
});
