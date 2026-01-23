/**
 * =====================================================================
 * EMAIL VALUE OBJECT
 * =====================================================================
 *
 * Represents a validated email address.
 * Self-validates format on creation.
 */

import { ValueObject } from './value-object.base';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  /**
   * Create a validated Email
   */
  static create(value: string): Email {
    const normalized = value.toLowerCase().trim();

    if (!this.EMAIL_REGEX.test(normalized)) {
      throw new Error(`Invalid email format: ${value}`);
    }

    return new Email({ value: normalized });
  }

  /**
   * Check if string is valid email without creating instance
   */
  static isValid(value: string): boolean {
    return this.EMAIL_REGEX.test(value.toLowerCase().trim());
  }

  get value(): string {
    return this.props.value;
  }

  /**
   * Get domain part of email
   */
  get domain(): string {
    return this.props.value.split('@')[1];
  }

  /**
   * Get local part of email (before @)
   */
  get localPart(): string {
    return this.props.value.split('@')[0];
  }

  toValue(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
