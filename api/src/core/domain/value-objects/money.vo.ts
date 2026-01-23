/**
 * =====================================================================
 * MONEY VALUE OBJECT
 * =====================================================================
 *
 * Represents monetary values in the system.
 * Always stored as integers (cents/đồng) to avoid floating-point issues.
 *
 * Following coding-standards.md:
 * - Money Handling: Always use integers for VND, use Math.round() before saving
 */

import { ValueObject } from './value-object.base';

interface MoneyProps {
  amount: number; // Integer (cents/đồng)
  currency: string; // ISO 4217 code (VND, USD, etc.)
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  /**
   * Create Money from integer amount (already in smallest unit)
   */
  static create(amount: number, currency: string = 'VND'): Money {
    if (!Number.isInteger(amount)) {
      // Round to nearest integer for safety
      amount = Math.round(amount);
    }

    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }

    return new Money({ amount, currency });
  }

  /**
   * Create Money from decimal (e.g., 10.50 USD)
   * Automatically converts to integer (cents)
   */
  static fromDecimal(
    decimalAmount: number,
    currency: string = 'VND',
    decimals: number = currency === 'VND' ? 0 : 2,
  ): Money {
    const multiplier = Math.pow(10, decimals);
    const amount = Math.round(decimalAmount * multiplier);
    return new Money({ amount, currency });
  }

  /**
   * Create zero money
   */
  static zero(currency: string = 'VND'): Money {
    return new Money({ amount: 0, currency });
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  /**
   * Get decimal representation (for display)
   */
  toDecimal(decimals: number = this.currency === 'VND' ? 0 : 2): number {
    return this.props.amount / Math.pow(10, decimals);
  }

  /**
   * Add two money values (must be same currency)
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  /**
   * Subtract money (must be same currency)
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Money subtraction would result in negative amount');
    }
    return Money.create(result, this.currency);
  }

  /**
   * Multiply by a factor (e.g., quantity)
   */
  multiply(factor: number): Money {
    return Money.create(Math.round(this.amount * factor), this.currency);
  }

  /**
   * Check if this is greater than other
   */
  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  /**
   * Check if this is less than other
   */
  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  /**
   * Check if zero
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Format for display
   */
  format(locale: string = 'vi-VN'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: this.currency === 'VND' ? 0 : 2,
    }).format(this.toDecimal());
  }

  toValue(): MoneyProps {
    return { ...this.props };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot operate on different currencies: ${this.currency} vs ${other.currency}`,
      );
    }
  }
}
