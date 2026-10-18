"use client";
import { createContext, useContext, type ReactNode } from "react";

export interface Branding {
  name: string;
  logoUrl: string | null;
  accent: string;
  isDark: boolean;
}

const BrandingContext = createContext<Branding>({
  name: "CRMGráfica",
  logoUrl: null,
  accent: "#2563EB",
  isDark: false,
});

export function MarcaDaInstalacaoProvider({ marca, children }: { marca: Branding; children: ReactNode }) {
  return (
    <BrandingContext.Provider value={marca}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useMarcaDaInstalacao(): Branding {
  return useContext(BrandingContext);
}
