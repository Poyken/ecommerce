'use client';

import { updateCartItemAction } from '@/actions/cart';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { useState, useTransition } from 'react';

export function CartItemControl({ item }: { item: any }) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(item.quantity);

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    startTransition(async () => {
       await updateCartItemAction(item.id, newQuantity);
    });
  };

  return (
    <div className="flex items-center gap-2 border rounded-md">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-none"
        onClick={() => updateQuantity(quantity - 1)}
        disabled={quantity <= 1 || isPending}
      >
        <Minus size={14} />
      </Button>
      <span className="w-8 text-center text-sm">{quantity}</span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-none"
        onClick={() => updateQuantity(quantity + 1)}
        disabled={isPending}
      >
        <Plus size={14} />
      </Button>
    </div>
  );
}
