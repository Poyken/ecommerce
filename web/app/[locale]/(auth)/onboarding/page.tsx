"use client";

/**
 * =====================================================================
 * ONBOARDING WIZARD - Hướng dẫn thiết lập cửa hàng lần đầu
 * =====================================================================
 *
 * Steps:
 * 1. Thông tin cửa hàng (Logo, Contact)
 * 2. Chọn ngành hàng (Categories)
 * 3. Chọn Theme
 * 4. Hoàn tất
 *
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ImageIcon,
  Palette,
  Rocket,
  ShoppingBag,
  Sparkles,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Categories for Step 2
const businessCategories = [
  {
    id: "fashion",
    name: "Thời trang",
    icon: "👗",
    description: "Quần áo, giày dép, phụ kiện",
  },
  {
    id: "electronics",
    name: "Điện tử",
    icon: "📱",
    description: "Điện thoại, laptop, phụ kiện",
  },
  {
    id: "beauty",
    name: "Làm đẹp",
    icon: "💄",
    description: "Mỹ phẩm, skincare, nước hoa",
  },
  {
    id: "food",
    name: "Thực phẩm",
    icon: "🍜",
    description: "Đồ ăn, đồ uống, đặc sản",
  },
  {
    id: "home",
    name: "Nhà cửa",
    icon: "🏠",
    description: "Nội thất, trang trí, đồ gia dụng",
  },
  {
    id: "health",
    name: "Sức khỏe",
    icon: "💊",
    description: "Thực phẩm chức năng, thiết bị y tế",
  },
  {
    id: "sports",
    name: "Thể thao",
    icon: "⚽",
    description: "Dụng cụ thể thao, đồ gym",
  },
  {
    id: "books",
    name: "Sách & Văn phòng",
    icon: "📚",
    description: "Sách, văn phòng phẩm",
  },
  {
    id: "toys",
    name: "Đồ chơi",
    icon: "🧸",
    description: "Đồ chơi trẻ em, mô hình",
  },
  { id: "pets", name: "Thú cưng", icon: "🐕", description: "Đồ cho thú cưng" },
  {
    id: "automotive",
    name: "Ô tô & Xe máy",
    icon: "🚗",
    description: "Phụ tùng, phụ kiện xe",
  },
  { id: "other", name: "Khác", icon: "📦", description: "Ngành hàng khác" },
];

// Themes for Step 3
const themes = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Thiết kế tối giản, tập trung sản phẩm",
    preview: "/images/themes/minimal.jpg",
    colors: ["#000000", "#ffffff", "#f5f5f5"],
  },
  {
    id: "modern",
    name: "Modern",
    description: "Hiện đại, trẻ trung, năng động",
    preview: "/images/themes/modern.jpg",
    colors: ["#6366f1", "#ffffff", "#f1f5f9"],
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sang trọng, lịch lãm, cao cấp",
    preview: "/images/themes/elegant.jpg",
    colors: ["#1a1a2e", "#c9a227", "#f5f5f5"],
  },
  {
    id: "playful",
    name: "Playful",
    description: "Vui tươi, màu sắc, năng lượng",
    preview: "/images/themes/playful.jpg",
    colors: ["#ff6b6b", "#4ecdc4", "#ffe66d"],
  },
];

const steps = [
  {
    id: 1,
    title: "Thông tin cửa hàng",
    icon: <Building2 className="size-5" />,
  },
  { id: 2, title: "Ngành hàng", icon: <ShoppingBag className="size-5" /> },
  { id: 3, title: "Chọn giao diện", icon: <Palette className="size-5" /> },
  { id: 4, title: "Hoàn tất", icon: <Rocket className="size-5" /> },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    storeName: "",
    logo: null as File | null,
    logoPreview: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    categories: [] as string[],
    theme: "modern",
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        logo: file,
        logoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    // Simulate API call to save onboarding data
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Redirect to admin dashboard
    router.push("/admin");
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.storeName.trim().length >= 2;
      case 2:
        return formData.categories.length > 0;
      case 3:
        return formData.theme !== "";
      default:
        return true;
    }
  };

  return (
    <main className="min-h-screen bg-black relative overflow-hidden font-sans selection:bg-primary/30">
      {/* Background Aurora Glows */}
      <div className="absolute top-0 -left-[10%] w-[600px] h-[600px] bg-[var(--aurora-purple)]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] -right-[5%] w-[500px] h-[500px] bg-[var(--aurora-blue)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-[20%] w-[800px] h-[800px] bg-primary/2 rounded-full blur-[200px] pointer-events-none" />
      {/* Progress Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Sparkles className="size-6 text-primary" />
              <span className="font-black text-xs uppercase tracking-[0.4em] text-white">LUXE.SAAS</span>
            </div>

            {/* Steps Progress */}
            <div className="hidden sm:flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center size-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                      currentStep === step.id
                        ? "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] scale-110"
                        : currentStep > step.id
                        ? "bg-primary/10 text-primary"
                        : "bg-white/5 text-white/20"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="size-4" />
                    ) : (
                      step.id.toString().padStart(2, '0')
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-12 h-[1px] mx-2",
                        currentStep > step.id ? "bg-primary/50" : "bg-white/5"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Progress */}
            <div className="sm:hidden text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              {currentStep} / {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-32">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Step 1: Store Info */}
              {currentStep === 1 && (
                <m.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-12">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block">
                      GETTING STARTED
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-white leading-none">
                      Thiết lập cửa hàng
                    </h1>
                    <p className="text-muted-foreground/40 text-sm font-medium mt-4">
                      Hãy bắt đầu với những thông tin cơ bản nhất
                    </p>
                  </div>

                  {/* Logo Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <label className="cursor-pointer group">
                      <div
                        className={cn(
                          "size-32 rounded-2xl border-2 border-dashed flex items-center justify-center",
                          "transition-all group-hover:border-primary group-hover:bg-primary/5",
                          formData.logoPreview
                            ? "border-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {formData.logoPreview ? (
                          <Image
                            src={formData.logoPreview}
                            alt="Logo"
                            width={128}
                            height={128}
                            className="size-full object-cover rounded-2xl"
                          />
                        ) : (
                          <div className="text-center">
                            <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">
                              Upload Logo
                            </span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG tối đa 2MB. Kích thước tối thiểu 200x200px
                    </p>
                  </div>

                  {/* Store Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Tên cửa hàng <span className="text-destructive">*</span>
                    </label>
                      <input
                        type="text"
                        value={formData.storeName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            storeName: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-4 rounded-2xl border border-white/5 bg-white/5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                        placeholder="VD: Shop Thời Trang ABC"
                      />
                  </div>

                  {/* Contact Info */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Email liên hệ
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactEmail: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="email@shop.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactPhone: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="0912 345 678"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Địa chỉ</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                    />
                  </div>
                </m.div>
              )}

              {/* Step 2: Categories */}
              {currentStep === 2 && (
                <m.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                      Bạn kinh doanh ngành hàng gì?
                    </h1>
                    <p className="text-muted-foreground">
                      Chọn một hoặc nhiều ngành hàng phù hợp
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {businessCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={cn(
                          "p-6 rounded-2xl border transition-all duration-500 text-left relative overflow-hidden group/cat",
                          formData.categories.includes(category.id)
                            ? "border-primary bg-primary/10 ring-4 ring-primary/5"
                            : "border-white/5 bg-white/2 hover:border-white/20 hover:bg-white/5"
                        )}
                      >
                        <span className="text-3xl mb-2 block">
                          {category.icon}
                        </span>
                        <h3 className="font-semibold text-sm">
                          {category.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {category.description}
                        </p>
                      </button>
                    ))}
                  </div>

                  {formData.categories.length > 0 && (
                    <p className="text-sm text-center text-muted-foreground">
                      Đã chọn: {formData.categories.length} ngành hàng
                    </p>
                  )}
                </m.div>
              )}

              {/* Step 3: Theme */}
              {currentStep === 3 && (
                <m.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                      Chọn phong cách giao diện
                    </h1>
                    <p className="text-muted-foreground">
                      Bạn có thể thay đổi sau trong phần Cài đặt
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, theme: theme.id }))
                        }
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-all",
                          formData.theme === theme.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {/* Preview */}
                        <div className="aspect-video rounded-xl bg-muted mb-4 flex items-center justify-center">
                          <ImageIcon className="size-8 text-muted-foreground" />
                        </div>

                        {/* Info */}
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">{theme.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {theme.description}
                            </p>
                          </div>
                          {/* Color Swatches */}
                          <div className="flex gap-1">
                            {theme.colors.map((color, i) => (
                              <div
                                key={i}
                                className="size-5 rounded-full border border-border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </m.div>
              )}

              {/* Step 4: Complete */}
              {currentStep === 4 && (
                <m.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-8"
                >
                  <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Rocket className="size-10 text-primary" />
                  </div>

                  <h1 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu!</h1>
                  <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                    Cửa hàng <strong>{formData.storeName}</strong> đã được thiết
                    lập. Bắt đầu thêm sản phẩm và bán hàng ngay!
                  </p>

                  {/* Summary */}
                  <div className="bg-muted/50 rounded-2xl p-6 max-w-md mx-auto mb-8 text-left">
                    <h3 className="font-semibold mb-4">Tóm tắt thiết lập:</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Tên cửa hàng
                        </span>
                        <span className="font-medium">
                          {formData.storeName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Ngành hàng
                        </span>
                        <span className="font-medium">
                          {formData.categories.length} ngành
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Giao diện</span>
                        <span className="font-medium capitalize">
                          {themes.find((t) => t.id === formData.theme)?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="min-w-[240px] bg-linear-to-r from-primary to-indigo-600 font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 py-8 rounded-2xl border-white/10"
                  >
                    {isSubmitting ? (
                      "BẮT ĐẦU KHỞI TẠO..."
                    ) : (
                      <>
                        <Sparkles className="size-4 mr-2" />
                        VÀO DASHBOARD
                      </>
                    )}
                  </Button>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Fixed Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={cn(currentStep === 1 && "invisible")}
            >
              <ArrowLeft className="size-4 mr-2" />
              Quay lại
            </Button>

            <div className="flex gap-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "size-2 rounded-full transition-all",
                    currentStep === step.id
                      ? "bg-primary w-6"
                      : currentStep > step.id
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>

            {currentStep < 4 && (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Tiếp tục
                <ArrowRight className="size-4 ml-2" />
              </Button>
            )}
            {currentStep === 4 && <div className="w-24" />}
          </div>
        </div>
      </div>
    </main>
  );
}
