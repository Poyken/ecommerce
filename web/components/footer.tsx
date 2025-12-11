"use client";

import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative bg-black text-white pt-24 pb-12 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Newsletter */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="text-2xl font-bold tracking-tighter">
              LUXE<span className="text-primary">.</span>
            </Link>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              Elevating your lifestyle with premium curated collections. Quality meets aesthetics in every detail.
            </p>
            <div className="flex gap-4 pt-4">
               {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                   <a 
                    key={i} 
                    href="#" 
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white hover:bg-white/10 transition-all duration-300"
                   >
                       <Icon size={18} />
                   </a>
               ))}
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="font-bold text-lg mb-6">Shop</h4>
            <ul className="space-y-4">
              {['New Arrivals', 'Best Sellers', 'Accessories', 'Sale', 'Collections'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-muted-foreground hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-lg mb-6">Support</h4>
            <ul className="space-y-4">
              {['Help Center', 'Shipping & Returns', 'Size Guide', 'Track Order', 'FAQ'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-muted-foreground hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-4">
              {['About Us', 'Careers', 'Sustainability', 'Press', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-muted-foreground hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
           <p>&copy; 2024 LUXE Inc. All rights reserved.</p>
           <div className="flex gap-8">
               <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
               <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
               <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
           </div>
        </div>
      </div>
    </footer>
  );
}
