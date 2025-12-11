"use client";

import { createContext, useContext } from "react";

interface AuthContextType {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  permissions: [],
  hasPermission: () => false,
});

export function AuthProvider({
  children,
  initialPermissions,
}: {
  children: React.ReactNode;
  initialPermissions: string[];
}) {
  const hasPermission = (permission: string) => {
    return initialPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{ permissions: initialPermissions, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
