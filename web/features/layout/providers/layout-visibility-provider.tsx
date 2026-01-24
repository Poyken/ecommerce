"use client";

import { usePathname } from "@/i18n/routing";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface LayoutVisibilityContextType {
  hideHeader: boolean;
  hideFooter: boolean;
  setHideHeader: (hide: boolean) => void;
  setHideFooter: (hide: boolean) => void;
}

const LayoutVisibilityContext = createContext<
  LayoutVisibilityContextType | undefined
>(undefined);


export function LayoutVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hideHeader, setHideHeader] = useState(false);
  const [hideFooter, setHideFooter] = useState(false);
  const pathname = usePathname();

  // Reset visibility when navigating to a new page
  useEffect(() => {
    // eslint-disable-next-line
    setHideHeader(false);
    setHideFooter(false);
  }, [pathname]);

  return (
    <LayoutVisibilityContext.Provider
      value={{ hideHeader, hideFooter, setHideHeader, setHideFooter }}
    >
      {children}
    </LayoutVisibilityContext.Provider>
  );
}

export function useLayoutVisibility() {
  const context = useContext(LayoutVisibilityContext);
  if (!context) {
    throw new Error(
      "useLayoutVisibility must be used within a LayoutVisibilityProvider"
    );
  }
  return context;
}
