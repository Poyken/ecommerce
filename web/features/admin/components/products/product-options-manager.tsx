 
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

interface UiOption {
  name: string;
  values: string[];
}

interface ProductOptionsManagerProps {
  options: UiOption[];
  setOptions: (options: UiOption[]) => void;
  isPending: boolean;
}

export function ProductOptionsManager({
  options,
  setOptions,
  isPending,
}: ProductOptionsManagerProps) {
  const t = useTranslations("admin");

  const handleAddOption = () => {
    setOptions([...options, { name: "", values: [] }]);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionNameChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].name = value;
    setOptions(newOptions);
  };

  const handleAddValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return;
    const newOptions = [...options];
    newOptions[optionIndex].values.push(value);
    setOptions(newOptions);
  };

  const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values.splice(valueIndex, 1);
    setOptions(newOptions);
  };

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">
          {t("products.optionsLabel")}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          disabled={isPending}
        >
          {t("products.addOption")}
        </Button>
      </div>

      {options.map((option, optIndex) => (
        <div
          key={optIndex}
          className="p-4 border rounded-md space-y-3 bg-gray-50"
        >
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label>{t("products.optionNameLabel")}</Label>
              <Input
                value={option.name}
                onChange={(e) =>
                  handleOptionNameChange(optIndex, e.target.value)
                }
                placeholder={t("products.optionPlaceholder")}
                disabled={isPending}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3"
              onClick={() => handleRemoveOption(optIndex)}
              disabled={isPending}
            >
              {t("remove")}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t("products.valuesLabel")}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {option.values.map((val, valIndex) => (
                <div
                  key={valIndex}
                  className="bg-white border px-2 py-1 rounded text-sm flex items-center gap-2"
                >
                  <span>{val}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveValue(optIndex, valIndex)}
                    className="text-gray-400 hover:text-red-500"
                    disabled={isPending}
                  >
                    {t("remove")}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={t("products.valuePlaceholder")}
                disabled={isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddValue(optIndex, e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
