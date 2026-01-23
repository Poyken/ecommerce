/**
 * =====================================================================
 * SLUG VALUE OBJECT
 * =====================================================================
 *
 * Represents URL-friendly slugs for SEO-friendly URLs.
 * Self-validates format on creation.
 */

import { ValueObject } from './value-object.base';

interface SlugProps {
  value: string;
}

export class Slug extends ValueObject<SlugProps> {
  private static readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  private constructor(props: SlugProps) {
    super(props);
  }

  /**
   * Create a Slug from an already-formatted slug string
   */
  static create(value: string): Slug {
    const normalized = value.toLowerCase().trim();

    if (!this.SLUG_REGEX.test(normalized)) {
      throw new Error(`Invalid slug format: ${value}`);
    }

    return new Slug({ value: normalized });
  }

  /**
   * Generate a slug from any text (auto-converts)
   */
  static fromText(text: string): Slug {
    const slug = text
      .toLowerCase()
      .trim()
      // Vietnamese character normalization
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Replace đ/Đ
      .replace(/[đĐ]/g, 'd')
      // Replace spaces and special chars with hyphens
      .replace(/[^a-z0-9]+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Collapse multiple hyphens
      .replace(/-+/g, '-');

    if (!slug) {
      throw new Error('Cannot generate slug from empty or invalid text');
    }

    return new Slug({ value: slug });
  }

  get value(): string {
    return this.props.value;
  }

  toValue(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
