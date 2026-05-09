"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchSheetData, SheetData } from "@/lib/sheetData";

type SheetDataContextType = {
  data: SheetData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const SheetDataContext = createContext<SheetDataContextType | undefined>(undefined);

export function SheetDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchSheetData()
      .then((sheetData) => {
        if (!mounted) return;
        setData(sheetData);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Unable to load sheet data");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [tick]);

  return (
    <SheetDataContext.Provider value={{ data, loading, error, refresh }}>
      {children}
    </SheetDataContext.Provider>
  );
}

export function useSheetData() {
  const context = useContext(SheetDataContext);
  if (!context) {
    throw new Error("useSheetData must be used within SheetDataProvider");
  }
  return context;
}
