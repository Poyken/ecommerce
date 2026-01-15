"use client";

/**
 * =====================================================================
 * SHARED BLOCK TYPES - Types dùng chung cho tất cả blocks
 * =====================================================================
 */

import { type LucideIcon } from "lucide-react";

// Visibility Controls - Điều khiển hiển thị theo thiết bị/trạng thái
export interface BlockVisibility {
  showOnDesktop?: boolean;
  showOnTablet?: boolean;
  showOnMobile?: boolean;
  showWhenLoggedIn?: boolean;
  showForUserGroups?: string[];
}

// Animation Controls - Điều khiển hiệu ứng animation
export interface BlockAnimation {
  type:
    | "none"
    | "fade"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "zoom"
    | "bounce";
  duration?: number; // ms
  delay?: number; // ms
  trigger?: "load" | "scroll" | "hover";
}

// Spacing & Layout Styles
export interface BlockSpacing {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export interface BlockStyles {
  // Container
  containerWidth?: "full" | "container" | "narrow";
  padding?: BlockSpacing;
  margin?: BlockSpacing;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundOverlay?: number; // opacity 0-1

  // Border & Shadow
  borderRadius?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  boxShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";

  // Typography
  textColor?: string;
  textAlign?: "left" | "center" | "right";

  // Dimensions
  width?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;

  // Flex/Grid
  display?: "block" | "flex" | "grid";
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: string;

  // Other
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  position?: "relative" | "absolute" | "fixed" | "sticky";
  zIndex?: number;
  opacity?: number;

  // Custom
  customClasses?: string;
  animation?: string;
}

// Data Source for dynamic blocks
export interface BlockDataSource {
  type: "static" | "api" | "query";
  endpoint?: string;
  queryParams?: Record<string, unknown>;
  limit?: number;
  refreshInterval?: number; // ms
}

// Base props shared by all blocks
export interface BaseBlockProps {
  visibility?: BlockVisibility;
  animation?: BlockAnimation;
  styles?: BlockStyles;
  dataSource?: BlockDataSource;
}

// Block category for organizing in dialog
export type BlockCategory =
  | "layout"
  | "hero-media"
  | "content"
  | "commerce"
  | "engagement"
  | "advanced";

export interface BlockCategoryInfo {
  id: BlockCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// Helper type for icon names (Lucide)
export type IconName = string;

// Social link type
export interface SocialLink {
  platform:
    | "facebook"
    | "instagram"
    | "twitter"
    | "linkedin"
    | "youtube"
    | "tiktok"
    | "pinterest";
  url: string;
}

// CTA Button type
export interface CTAButton {
  text: string;
  link: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "sm" | "default" | "lg";
}

// Team member type
export interface TeamMember {
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
  socialLinks?: SocialLink[];
}

// Timeline item type
export interface TimelineItem {
  date: string;
  title: string;
  description: string;
  icon?: IconName;
  image?: string;
}

// Step/Process item type
export interface StepItem {
  number?: number;
  title: string;
  description: string;
  icon?: IconName;
  image?: string;
}

// Form field type
export interface FormField {
  id: string;
  type:
    | "text"
    | "email"
    | "phone"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

// Logo item type
export interface LogoItem {
  name: string;
  imageUrl: string;
  link?: string;
}

// Icon grid item type
export interface IconGridItem {
  icon: IconName;
  title: string;
  description?: string;
  link?: string;
}

// Comparison column/row types
export interface ComparisonColumn {
  id: string;
  title: string;
  subtitle?: string;
  price?: string;
  isHighlighted?: boolean;
}

export interface ComparisonRow {
  feature: string;
  values: Record<string, boolean | string>;
}
