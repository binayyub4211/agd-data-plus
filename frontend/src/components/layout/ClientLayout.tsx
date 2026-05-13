"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { BrandedLoader } from "./BrandedLoader";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show loader on route change
    setIsNavigating(true);
    const timeout = setTimeout(() => setIsNavigating(false), 600);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <>
      <BrandedLoader isLoading={isNavigating} />
      <Toaster position="top-center" reverseOrder={false} />
      {children}
    </>
  );
}
