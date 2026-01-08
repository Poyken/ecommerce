import { describe, it, expect } from "vitest";
import { cn, toSlug, formatCurrency, formatDate } from "./utils";

describe("Utils", () => {
  describe("cn (className utility)", () => {
    it("should merge classes correctly", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      expect(cn("class1", true && "class2", false && "class3")).toBe(
        "class1 class2"
      );
    });

    it("should merge tailwind classes properly", () => {
      expect(cn("p-4", "p-2")).toBe("p-2"); // p-2 should override p-4
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });
  });

  describe("toSlug", () => {
    it("should convert simple string to slug", () => {
      expect(toSlug("Hello World")).toBe("hello-world");
    });

    it("should handle vietnamese characters", () => {
      expect(toSlug("Sản Phẩm Mới")).toBe("san-pham-moi");
      expect(toSlug("Áo Thun Đẹp")).toBe("ao-thun-dep");
    });

    it("should remove special characters", () => {
      expect(toSlug("Web & App @ 2024!")).toBe("web-app-2024");
    });

    it("should handle multiple spaces and trim", () => {
      expect(toSlug("  Multiple   Spaces  ")).toBe("multiple-spaces");
    });
  });

  describe("formatCurrency", () => {
    it("should format number to VND", () => {
      // Note: non-breaking space might differ in test environments
      const result = formatCurrency(100000);
      expect(result).toMatch(/100\.000/);
      expect(result).toContain("₫");
    });

    it("should handle 0", () => {
      expect(formatCurrency(0)).toMatch(/0/);
    });
  });

  describe("formatDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-01-01");
      expect(formatDate(date)).toBe("01/01/2024");
    });

    it("should handle string input", () => {
      expect(formatDate("2024-12-31")).toBe("31/12/2024");
    });
  });
});
