"use client";



import { getProfileAction } from "@/features/profile/actions";
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
