/**
 * =====================================================================
 * PRISMA CART REPOSITORY - Infrastructure Layer (Adapter)
 * =====================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { ICartRepository } from '../../domain/repositories/cart.repository.interface';
import { Cart, CartProps, CartItem } from '../../domain/entities/cart.entity';
import { Money } from '@core/domain/value-objects/money.vo';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PrismaCartRepository implements ICartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Cart | null> {
    const data = await (this.prisma.cart as any).findUnique({
      where: { id },
      include: this.getCartIncludes(),
    });
    return data ? this.toDomain(data) : null;
  }

  async findByCustomer(customerId: string): Promise<Cart | null> {
    const data = await (this.prisma.cart as any).findFirst({
      where: { customerId },
      include: this.getCartIncludes(),
    });
    return data ? this.toDomain(data) : null;
  }

  async findBySession(sessionId: string): Promise<Cart | null> {
    const data = await (this.prisma.cart as any).findFirst({
      where: { sessionId },
      include: this.getCartIncludes(),
    });
    return data ? this.toDomain(data) : null;
  }

  async findOrCreateForCustomer(
    tenantId: string,
    customerId: string,
  ): Promise<Cart> {
    let cart = await this.findByCustomer(customerId);

    if (!cart) {
      const newCart = Cart.create({
        id: uuidv4(),
        tenantId,
        customerId,
      });
      cart = await this.save(newCart);
    }

    return cart;
  }

  async findOrCreateForSession(
    tenantId: string,
    sessionId: string,
  ): Promise<Cart> {
    let cart = await this.findBySession(sessionId);

    if (!cart) {
      const newCart = Cart.create({
        id: uuidv4(),
        tenantId,
        sessionId,
      });
      cart = await this.save(newCart);
    }

    return cart;
  }

  async save(cart: Cart): Promise<Cart> {
    const data = cart.toPersistence();

    const existing = await (this.prisma.cart as any).findUnique({
      where: { id: cart.id },
    });

    if (existing) {
      // Update cart
      await (this.prisma.cart as any).update({
        where: { id: cart.id },
        data: {
          customerId: data.customerId,
          sessionId: data.sessionId,
          couponCode: data.couponCode,
          lastActivityAt: data.lastActivityAt,
          updatedAt: new Date(),
        },
      });

      // Sync items - delete all and recreate
      await (this.prisma.cartItem as any).deleteMany({
        where: { cartId: cart.id },
      });

      if (cart.items.length > 0) {
        await (this.prisma.cartItem as any).createMany({
          data: cart.items.map((item) => ({
            id: item.id,
            cartId: cart.id,
            skuId: item.skuId,
            productId: item.productId,
            productName: item.productName,
            skuCode: item.skuCode,
            variantLabel: item.variantLabel,
            imageUrl: item.imageUrl,
            unitPrice: item.unitPrice.amount,
            quantity: item.quantity,
          })),
        });
      }
    } else {
      // Create cart with items
      await (this.prisma.cart as any).create({
        data: {
          id: data.id,
          tenantId: data.tenantId,
          customerId: data.customerId,
          sessionId: data.sessionId,
          couponCode: data.couponCode,
          lastActivityAt: data.lastActivityAt,
          items: {
            create: cart.items.map((item) => ({
              id: item.id,
              skuId: item.skuId,
              productId: item.productId,
              productName: item.productName,
              skuCode: item.skuCode,
              variantLabel: item.variantLabel,
              imageUrl: item.imageUrl,
              unitPrice: item.unitPrice.amount,
              quantity: item.quantity,
            })),
          },
        } as any,
      });
    }

    // Return fresh cart
    return (await this.findById(cart.id))!;
  }

  async delete(id: string): Promise<void> {
    await (this.prisma.cartItem as any).deleteMany({
      where: { cartId: id },
    });
    await (this.prisma.cart as any).delete({
      where: { id },
    });
  }

  async deleteAbandonedBefore(date: Date): Promise<number> {
    const result = await (this.prisma.cart as any).deleteMany({
      where: {
        lastActivityAt: { lt: date },
        customerId: null, // Only guest carts
      },
    });
    return result.count;
  }

  async transferToCustomer(
    sessionId: string,
    customerId: string,
  ): Promise<Cart | null> {
    const sessionCart = await this.findBySession(sessionId);
    if (!sessionCart) return null;

    // Check if customer already has a cart
    const customerCart = await this.findByCustomer(customerId);

    if (customerCart) {
      // Merge session cart into customer cart
      customerCart.mergeFrom(sessionCart);
      await this.save(customerCart);
      await this.delete(sessionCart.id);
      return customerCart;
    } else {
      // Assign session cart to customer
      sessionCart.assignToCustomer(customerId);
      return await this.save(sessionCart);
    }
  }

  // =====================================================================
  // HELPERS
  // =====================================================================

  private getCartIncludes() {
    return {
      items: true,
    };
  }

  private toDomain(data: any): Cart {
    const items: CartItem[] = (data.items || []).map((item: any) => ({
      id: item.id,
      skuId: item.skuId,
      productId: item.productId,
      productName: item.productName,
      skuCode: item.skuCode,
      variantLabel: item.variantLabel || '',
      imageUrl: item.imageUrl,
      unitPrice: Money.create(Number(item.unitPrice)),
      quantity: item.quantity,
    }));

    const props: CartProps = {
      id: data.id,
      tenantId: data.tenantId,
      customerId: data.customerId,
      sessionId: data.sessionId,
      items,
      couponCode: data.couponCode,
      lastActivityAt: data.lastActivityAt || data.updatedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return Cart.fromPersistence(props);
  }
}
