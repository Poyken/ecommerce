"use client";

/**
 * =====================================================================
 * DEMO PAGE - Request demo or explore Live Demo Stores
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  ExternalLink,
  Play,
  Sparkles,
  Store,
  Users,
  Video,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useState } from "react";
import { useTranslations } from "next-intl";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function DemoPage() {
  const t = useTranslations("marketing.demo");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    businessType: "",
    preferredTime: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Demo stores with translations
  const demoStores = [
    {
      id: "local",
      name: t("local.name"),
      description: t("local.description"),
      url: "http://demo.localhost:3000",
      features: ["Seeded Data", "Full Access", "Debug Mode"],
    },
  ];

  // What's included in demo
  const demoIncludes = [
    { icon: <Store className="size-5" />, text: t("includes.admin") },
    { icon: <Users className="size-5" />, text: t("includes.oneOnOne") },
    { icon: <Video className="size-5" />, text: t("includes.qa") },
    { icon: <Sparkles className="size-5" />, text: t("includes.custom") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center py-20">
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="size-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">{t("success.title")}</h1>
          <p className="text-muted-foreground mb-8">
            {t("success.description")}
          </p>
          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/register">{t("success.startNow")}</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsSuccess(false)}
            >
              {t("success.sendAnother")}
            </Button>
          </div>
        </m.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="text-center max-w-3xl mx-auto"
          >
            <m.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Play className="size-4" />
              <span>{t("badge")}</span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            >
              {t("title", { brand: "Luxe SaaS" })}
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground mb-10"
            >
              {t("subtitle")}
            </m.p>
          </m.div>
        </div>
      </section>

      {/* Live Demo Stores */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t("storesTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("storesSubtitle")}
            </p>
          </m.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {demoStores.map((store, index) => {
              const isLocal = store.id === "local";
              return (
                <m.div
                  key={store.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "group relative bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all",
                    isLocal
                      ? "border-primary/50 ring-1 ring-primary/20 shadow-2xl shadow-primary/10"
                      : "border-border"
                  )}
                >
                  {isLocal && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-primary via-accent to-primary animate-shimmer" />
                  )}
                  
                  {/* Preview Image */}
                  <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                    <Store className="size-12 text-muted-foreground/30" />
                    
                    {isLocal && (
                       <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                         {t("local.recommended")}
                       </div>
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant={isLocal ? "default" : "secondary"} size="sm" asChild>
                        <a
                          href={store.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4 mr-2" />
                          {isLocal ? t("local.launch") : t("viewStore")}
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                       {store.name}
                       {isLocal && <Sparkles className="size-4 text-primary fill-primary/20" />}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {store.description}
                    </p>

                    {/* Features Tags */}
                    <div className="flex flex-wrap gap-2">
                      {store.features.map((feature) => (
                        <span
                          key={feature}
                          className={cn(
                            "px-2 py-1 text-xs rounded-full font-medium",
                             isLocal 
                               ? "bg-primary/10 text-primary border border-primary/20" 
                               : "bg-secondary text-secondary-foreground"
                          )}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Request Demo Form */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
            {/* Left: Info */}
            <m.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Calendar className="size-4" />
                {t("scheduleDemo")}
              </div>

              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                {t("scheduleDemoTitle")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("scheduleDemoSubtitle")}
              </p>

              {/* What's Included */}
              <div className="space-y-4 mb-8">
                <h3 className="font-semibold">{t("includes.title")}</h3>
                {demoIncludes.map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="p-6 rounded-2xl bg-muted/50 border border-border">
                <p className="text-muted-foreground italic mb-4">
                &ldquo;{t("testimonial")}&rdquo;
              </p>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/20" />
                  <div>
                    <p className="font-medium text-sm">Trần Văn A</p>
                    <p className="text-xs text-muted-foreground">
                      CEO, Fashion Store
                    </p>
                  </div>
                </div>
              </div>
            </m.div>

            {/* Right: Form */}
            <m.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("form.name")} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder={t("form.namePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("form.email")} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder={t("form.emailPlaceholder")}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("form.phone")}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder={t("form.phonePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("form.company")}
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder={t("form.companyPlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("form.businessType")}
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">{t("form.businessTypePlaceholder")}</option>
                    <option value="fashion">{t("form.businessTypes.fashion")}</option>
                    <option value="electronics">{t("form.businessTypes.electronics")}</option>
                    <option value="food">{t("form.businessTypes.food")}</option>
                    <option value="beauty">{t("form.businessTypes.beauty")}</option>
                    <option value="home">{t("form.businessTypes.home")}</option>
                    <option value="other">{t("form.businessTypes.other")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("form.preferredTime")}
                  </label>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">{t("form.preferredTimePlaceholder")}</option>
                    <option value="morning">{t("form.times.morning")}</option>
                    <option value="afternoon">{t("form.times.afternoon")}</option>
                    <option value="evening">{t("form.times.evening")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("form.message")}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    placeholder={t("form.messagePlaceholder")}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    t("form.submitting")
                  ) : (
                    <>
                      <Calendar className="size-4 mr-2" />
                      {t("form.submit")}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {t("form.orStart")}{" "}
                  <Link
                    href="/register"
                    className="text-primary hover:underline"
                  >
                    {t("form.startFree")}
                  </Link>{" "}
                  {t("form.noDemo")}
                </p>
              </form>
            </m.div>
          </div>
        </div>
      </section>
    </main>
  );
}
