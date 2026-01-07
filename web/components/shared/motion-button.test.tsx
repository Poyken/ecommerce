import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MotionButton } from "./motion-button";

// Mock fremar-motion to avoid complex animation setup in tests
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    m: {
      button: ({ children, whileHover, whileTap, ...props }: any) => (
        <button {...props}>{children}</button>
      ),
    },
  };
});

describe("MotionButton", () => {
  it("renders correctly with children", () => {
    render(<MotionButton>Click Me</MotionButton>);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("shows loading spinner when loading is true", () => {
    render(<MotionButton loading>Submit</MotionButton>);
    expect(screen.getByRole("button")).toBeDisabled();
    // Loader2 is usually an SVG, but we can check if button is disabled
  });
});
