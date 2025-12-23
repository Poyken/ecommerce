"use client";

/**
 * =====================================================================
 * USE USER PROFILE HOOK - Hook quản lý thông tin user
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. OPTIMISTIC UI (Giao diện lạc quan):
 * - Nhận `initialUser` từ Server Component để hiển thị ngay lập tức.
 * - Tránh hiện tượng "layout shift" (nhảy giao diện) hoặc loading spinner không cần thiết.
 *
 * 2. CLIENT-SIDE FETCHING STRATEGY:
 * - Nếu `initialUser` được provide (dù là null hoặc object), ta TIN TƯỞNG giá trị đó.
 * - CHỈ fetch khi `initialUser === undefined` (tức là component không nhận được data từ server).
 * - Điều này tránh duplicate API calls khi server đã fetch sẵn.
 * =====================================================================
 */

import { getProfileAction } from "@/actions/profile";
import { User } from "@/types/models";
import { useEffect, useState } from "react";

export function useUserProfile(initialUser?: User | null) {
  // State lưu thông tin user. Khởi tạo bằng dữ liệu từ server (nếu có)
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [prevInitialUser, setPrevInitialUser] = useState<
    User | null | undefined
  >(initialUser);

  // Sync state with prop during render (pattern from React docs)
  if (initialUser !== prevInitialUser) {
    setPrevInitialUser(initialUser);
    setUser(initialUser ?? null);
  }

  useEffect(() => {
    // Only fetch on client if initialUser was NEVER provided
    // If initialUser is null, it means the server explicitly said "no user"
    if (initialUser !== undefined) {
      return;
    }

    async function fetchData() {
      try {
        const { data } = await getProfileAction();
        setUser(data || null);
      } catch (error) {
        console.error("Failed to fetch profile in hook:", error);
        setUser(null);
      }
    }

    fetchData();
  }, [initialUser]); // Run when initialUser changes

  return { user };
}
