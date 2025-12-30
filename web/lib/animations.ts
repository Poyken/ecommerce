import { m, Variants } from "framer-motion";

export { m };

/**
 * =====================================================================
 * ANIMATIONS LIBRARY - Thư viện hiệu ứng chuyển động
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FRAMER MOTION VARIANTS:
 * - Variants là các object định nghĩa trạng thái animation (hidden, visible, exit...).
 * - Giúp tách biệt logic animation ra khỏi UI component -> Code sạch hơn.
 *
 * 2. ORCHESTRATION (Điều phối):
 * - `staggerChildren`: Giúp các phần tử con xuất hiện lần lượt thay vì cùng lúc.
 *
 * 3. REUSABILITY:
 * - Định nghĩa một lần, dùng mọi nơi (FadeIn, SlideIn, ZoomIn...).
 * =====================================================================
 */

// ============================================
// TIMING CONSTANTS
// ============================================
export const TIMING = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

export const EASING = {
  easeOut: "easeOut" as const,
  easeInOut: "easeInOut" as const,
  spring: { type: "spring", stiffness: 300, damping: 30 },
} as const;

// ============================================
// FADE ANIMATIONS
// ============================================
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: TIMING.normal, ease: EASING.easeOut },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: TIMING.slow, ease: EASING.easeOut },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: TIMING.slow, ease: EASING.easeOut },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: TIMING.slow, ease: EASING.easeOut },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: TIMING.slow, ease: EASING.easeOut },
  },
};

// ============================================
// SCALE ANIMATIONS
// ============================================
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: TIMING.normal, ease: EASING.easeOut },
  },
};

export const zoomIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: TIMING.slow, ease: EASING.easeOut },
  },
};

// ============================================
// STAGGER CONTAINERS
// ============================================
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// ============================================
// ITEM VARIANTS (for stagger children)
// ============================================
export const itemVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: TIMING.slow },
  },
};

export const itemScaleVariant: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: TIMING.slow },
  },
};

// ============================================
// HOVER/TAP ANIMATIONS (for whileHover/whileTap)
// ============================================
export const hoverLift = {
  y: -4,
  transition: { duration: TIMING.fast },
};

export const hoverScale = {
  scale: 1.02,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
  },
};

export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const hoverGlow = {
  scale: 1.02,
  boxShadow: "0 0 20px rgba(212,175,55,0.3)",
  transition: { duration: TIMING.fast },
};

export const hoverBright = {
  scale: 1.02,
  filter: "brightness(1.1)",
  transition: { duration: TIMING.fast },
};

// ============================================
// PAGE TRANSITION
// ============================================
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TIMING.slow,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: TIMING.normal,
    },
  },
};

// ============================================
// SLIDE ANIMATIONS (for drawers/modals)
// ============================================
export const slideInFromRight: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: "100%",
    transition: {
      duration: TIMING.normal,
    },
  },
};

export const slideInFromBottom: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: "100%",
    transition: {
      duration: TIMING.normal,
    },
  },
};

// ============================================
// SKELETON SHIMMER (CSS class based)
// ============================================
export const shimmerClass =
  "animate-pulse bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 bg-[length:200%_100%] animate-shimmer";
