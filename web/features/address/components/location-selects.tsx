 
"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  District,
  Province,
  Ward,
  getDistricts,
  getProvinces,
  getWards,
} from "@/features/shipping/actions";

interface LocationSelectsProps {
  provinceId?: number;
  districtId?: number;
  wardCode?: string;
  onProvinceChange: (id: number, name: string) => void;
  onDistrictChange: (id: number, name: string) => void;
  onWardChange: (code: string, name: string) => void;
  errors?: {
    provinceId?: string;
    districtId?: string;
    wardCode?: string;
  };
  disabled?: boolean;
  t: (key: string) => string;
}

export function LocationSelects({
  provinceId,
  districtId,
  wardCode,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  errors,
  disabled,
  t,
}: LocationSelectsProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // 1. Fetch Provinces on Mount (and initial data)
  useEffect(() => {
    const fetchProvinces = async () => {
      const res = await getProvinces();
      if (res.success && res.data) setProvinces(res.data);
    };
    fetchProvinces();
  }, []);

  // 2. Fetch Districts
  useEffect(() => {
    const fetchDistricts = async () => {
      if (provinceId) {
        const res = await getDistricts(provinceId);
        if (res.success && res.data) setDistricts(res.data);
      } else {
        setDistricts([]);
      }
    };
    fetchDistricts();
  }, [provinceId]);

  // 3. Fetch Wards
  useEffect(() => {
    const fetchWards = async () => {
      if (districtId) {
        const res = await getWards(districtId);
        if (res.success && res.data) setWards(res.data);
      } else {
        setWards([]);
      }
    };
    fetchWards();
  }, [districtId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* City / Province */}
      <div className="space-y-1">
        <Label>{t("addressForm.cityLabel")}</Label>
        <Select
          value={provinceId?.toString()}
          onValueChange={(val) => {
            const p = provinces.find((x) => x.ProvinceID.toString() === val);
            if (p) onProvinceChange(p.ProvinceID, p.ProvinceName);
          }}
          disabled={disabled || provinces.length === 0}
        >
          <SelectTrigger className={errors?.provinceId ? "border-red-500" : ""}>
            <SelectValue placeholder={t("addressForm.selectProvince")} />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p) => (
              <SelectItem key={p.ProvinceID} value={p.ProvinceID.toString()}>
                {p.ProvinceName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* District */}
      <div className="space-y-1">
        <Label>{t("addressForm.districtLabel")}</Label>
        <Select
          value={districtId?.toString()}
          onValueChange={(val) => {
            const d = districts.find((x) => x.DistrictID.toString() === val);
            if (d) onDistrictChange(d.DistrictID, d.DistrictName);
          }}
          disabled={disabled || !provinceId || districts.length === 0}
        >
          <SelectTrigger className={errors?.districtId ? "border-red-500" : ""}>
            <SelectValue placeholder={t("addressForm.selectDistrict")} />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.DistrictID} value={d.DistrictID.toString()}>
                {d.DistrictName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ward */}
      <div className="space-y-1">
        <Label>{t("addressForm.wardLabel")}</Label>
        <Select
          value={wardCode}
          onValueChange={(val) => {
            const w = wards.find((x) => x.WardCode === val);
            if (w) onWardChange(w.WardCode, w.WardName);
          }}
          disabled={disabled || !districtId || wards.length === 0}
        >
          <SelectTrigger className={errors?.wardCode ? "border-red-500" : ""}>
            <SelectValue placeholder={t("addressForm.selectWard")} />
          </SelectTrigger>
          <SelectContent>
            {wards.map((w) => (
              <SelectItem key={w.WardCode} value={w.WardCode}>
                {w.WardName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
