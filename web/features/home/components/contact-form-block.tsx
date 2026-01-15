"use client";

/**
 * =====================================================================
 * CONTACT FORM BLOCK - Form liên hệ với các trường tùy chỉnh
 * =====================================================================
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle, Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import type { BaseBlockProps, FormField } from "../types/block-types";

interface ContactFormBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  fields?: FormField[];
  submitText?: string;
  successMessage?: string;
  layout?: "stacked" | "inline" | "split";
  showContactInfo?: boolean;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

const defaultFields: FormField[] = [
  {
    id: "name",
    type: "text",
    label: "Họ và tên",
    placeholder: "Nhập họ và tên của bạn",
    required: true,
  },
  {
    id: "email",
    type: "email",
    label: "Email",
    placeholder: "email@example.com",
    required: true,
  },
  {
    id: "phone",
    type: "phone",
    label: "Số điện thoại",
    placeholder: "0123 456 789",
    required: false,
  },
  {
    id: "subject",
    type: "select",
    label: "Chủ đề",
    required: true,
    options: [
      { label: "Hỗ trợ kỹ thuật", value: "support" },
      { label: "Tư vấn sản phẩm", value: "sales" },
      { label: "Hợp tác kinh doanh", value: "partnership" },
      { label: "Khác", value: "other" },
    ],
  },
  {
    id: "message",
    type: "textarea",
    label: "Nội dung",
    placeholder: "Nhập nội dung tin nhắn của bạn...",
    required: true,
  },
];

const defaultContactInfo = {
  email: "support@luxesaas.com",
  phone: "+84 28 1234 5678",
  address: "123 Nguyễn Văn Linh, Q.7, TP.HCM",
};

export function ContactFormBlock({
  title = "Liên hệ với chúng tôi",
  subtitle = "Gửi tin nhắn cho chúng tôi, đội ngũ hỗ trợ sẽ phản hồi trong vòng 24 giờ",
  fields = defaultFields,
  submitText = "Gửi tin nhắn",
  successMessage = "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.",
  layout = "split",
  showContactInfo = true,
  contactInfo = defaultContactInfo,
}: ContactFormBlockProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const renderField = (field: FormField) => {
    const baseClasses =
      "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className={cn(baseClasses, "resize-none")}
            onChange={handleChange}
          />
        );
      case "select":
        return (
          <select
            id={field.id}
            required={field.required}
            className={baseClasses}
            onChange={handleChange}
            defaultValue=""
          >
            <option value="" disabled>
              Chọn một mục...
            </option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={field.type}
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            className={baseClasses}
            onChange={handleChange}
          />
        );
    }
  };

  // Success State
  if (isSuccess) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto text-center"
          >
            <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="size-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Gửi thành công!</h2>
            <p className="text-muted-foreground">{successMessage}</p>
            <Button className="mt-6" onClick={() => setIsSuccess(false)}>
              Gửi tin nhắn khác
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  // Split Layout
  if (layout === "split" && showContactInfo) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left: Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {title && (
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-lg text-muted-foreground mb-8">{subtitle}</p>
              )}

              {/* Contact Info Cards */}
              <div className="space-y-4">
                {contactInfo.email && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mail className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>
                )}

                {contactInfo.phone && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Điện thoại
                      </p>
                      <a
                        href={`tel:${contactInfo.phone}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  </div>
                )}

                {contactInfo.address && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Địa chỉ</p>
                      <p className="font-medium">{contactInfo.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right: Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map((field) => (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      className="block text-sm font-medium mb-2"
                    >
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </label>
                    {renderField(field)}
                  </div>
                ))}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={isSubmitting}
                >
                  <Send className="size-4 mr-2" />
                  {submitText}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // Stacked/Inline Layout
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          )}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <form
            onSubmit={handleSubmit}
            className={cn(
              layout === "inline" ? "grid md:grid-cols-2 gap-4" : "space-y-4"
            )}
          >
            {fields.map((field) => (
              <div
                key={field.id}
                className={cn(
                  layout === "inline" &&
                    field.type === "textarea" &&
                    "md:col-span-2"
                )}
              >
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium mb-2"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </label>
                {renderField(field)}
              </div>
            ))}

            <div className={cn(layout === "inline" && "md:col-span-2")}>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={isSubmitting}
              >
                <Send className="size-4 mr-2" />
                {submitText}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
