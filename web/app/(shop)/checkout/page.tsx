"use client";

import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  
  return (
    <div className="min-h-screen bg-background pt-24 pb-12 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Secure Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step 1: Shipping */}
            <GlassCard className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                    Shipping Address
                 </h2>
                 <Check className="text-green-500 opacity-0" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" className="bg-white/5 border-white/10" placeholder="John" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" className="bg-white/5 border-white/10" placeholder="Doe" />
                 </div>
                 <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" className="bg-white/5 border-white/10" placeholder="123 Luxury Lane" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" className="bg-white/5 border-white/10" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="zip">Zip Code</Label>
                    <Input id="zip" className="bg-white/5 border-white/10" />
                 </div>
              </div>
            </GlassCard>

             {/* Step 2: Payment */}
            <GlassCard className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-muted-foreground text-sm">2</span>
                    Payment Method
                 </h2>
              </div>
              
              <div className="space-y-4">
                 <div className="p-4 rounded-xl border border-primary/50 bg-primary/5 flex items-center gap-4 cursor-pointer">
                    <CreditCard className="text-primary" />
                    <div className="flex-1">
                        <p className="font-medium">Credit Card</p>
                        <p className="text-xs text-muted-foreground">Secure encryption</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>
                 </div>
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center gap-4 cursor-pointer opacity-70">
                    <Truck className="text-muted-foreground" />
                    <div className="flex-1">
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-xs text-muted-foreground">Pay upon receipt</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                 </div>
              </div>
            </GlassCard>
            
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
             <GlassCard className="p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                    {/* Mock Item */}
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-white/5 rounded-md" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Premium Silk Dress</p>
                            <p className="text-xs text-muted-foreground">Size: M</p>
                        </div>
                        <p className="text-sm font-bold">$1,299</p>
                    </div>
                </div>
                
                <Separator className="bg-white/10 mb-4" />
                
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>$1,299</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-green-500">Free</span>
                    </div>
                </div>
                
                <Separator className="bg-white/10 my-4" />
                
                 <div className="flex justify-between font-bold text-lg mb-6">
                    <span>Total</span>
                    <span>$1,299</span>
                </div>
                
                <GlassButton variant="primary" className="w-full h-12 text-base shadow-xl shadow-primary/20">
                    Complete Order
                </GlassButton>
                
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                    <ShieldCheck className="w-3 h-3" />
                    Secure SSL Encrypted Transaction
                </div>
             </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
