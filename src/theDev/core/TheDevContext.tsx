import { createContext, useContext, useState, useCallback } from "react";
import type { TheDevContextValue, SelfTestConfig } from "./types";
import { defaultSelfTestConfig } from "../configs/defaultSelfTest";

const TheDevContext = createContext<TheDevContextValue | null>(null);

export function useTheDev() {
  const ctx = useContext(TheDevContext);
  if (!ctx) throw new Error("TheDev 必須放在 TheDevProvider 內使用");
  return ctx;
}

interface TheDevProviderProps {
  children: React.ReactNode;
  apiBaseUrl: string;
  project?: string;
  token?: string;
  appVersion?: string;
  selfTestConfig?: SelfTestConfig;
  snapshotPayload?: Record<string, unknown>;
}

export function TheDevProvider({
  children,
  apiBaseUrl,
  project = "theDev",
  token,
  appVersion = "0.0.0",
  selfTestConfig = defaultSelfTestConfig,
  snapshotPayload: initialSnapshot = {},
}: TheDevProviderProps) {
  const [snapshotPayload, setSnapshotPayload] = useState<Record<string, unknown>>(initialSnapshot);

  const value: TheDevContextValue = {
    apiBaseUrl,
    project,
    token,
    appVersion,
    selfTestConfig,
    snapshotPayload,
    setSnapshotPayload: useCallback((payload: Record<string, unknown>) => setSnapshotPayload(payload), []),
  };

  return (
    <TheDevContext.Provider value={value}>
      {children}
    </TheDevContext.Provider>
  );
}
