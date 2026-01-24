

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Note: Dropdown doesn't lock scroll or hide scrollbar, 
  // so no padding compensation needed here

  const handleLanguageChange = (newLocale: "en" | "vi") => {
    if (newLocale === locale) {
      setOpen(false);
      return;
    }

    // Close the menu immediately before starting the transition
    setOpen(false);

    startTransition(() => {
      router.replace(pathname as any, { locale: newLocale, scroll: false });
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-9 h-9 transition-all duration-200 cursor-pointer",
            isPending && "opacity-40 scale-90"
          )}
          disabled={isPending}
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only">{t("sr.switchLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[120px] p-1 flex flex-col gap-1"
      >
        <DropdownMenuItem
          onClick={() => handleLanguageChange("en")}
          disabled={isPending}
          className={cn(
            "w-full cursor-pointer flex items-center px-2 py-2 rounded-md transition-colors",
            locale === "en" && "bg-accent font-medium"
          )}
        >
          {t("languages.en")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange("vi")}
          disabled={isPending}
          className={cn(
            "w-full cursor-pointer flex items-center px-2 py-2 rounded-md transition-colors",
            locale === "vi" && "bg-accent font-medium"
          )}
        >
          {t("languages.vi")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
