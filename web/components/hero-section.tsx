"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GlassButton } from "./ui/glass-button";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-50 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] opacity-30" />
      </div>

      <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4 md:px-8">
        {/* Text Content - Asymmetrical Left */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">
              New Collection 2025
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="block text-foreground">Redefining</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-primary animate-shimmer bg-[length:200%_auto]">
              Luxury Style
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Experience the epitome of elegance with our curated selection of
            premium essentials. Designed for those who appreciate the finer
            details.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/">
              <GlassButton size="lg" className="group">
                Shop Collection
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </GlassButton>
            </Link>
            <Link href="/about">
              <GlassButton variant="ghost" size="lg">
                Our Story
              </GlassButton>
            </Link>
          </div>
        </motion.div>

        {/* Visual Content - Floating Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.2, type: "spring" }}
          className="relative h-[600px] hidden lg:block"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-[3rem] rotate-6 backdrop-blur-sm border border-white/5" />
          <div className="absolute inset-0 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40">
            <Image
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
              alt="Luxury Fashion Model"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
              priority
            />
            
            {/* Floating Glass Card */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider">Featured Look</p>
                  <p className="text-lg font-bold text-white">Silk Evening Dress</p>
                </div>
                <span className="text-xl font-bold text-primary">$1,299</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
