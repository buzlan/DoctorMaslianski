import { createContext, useContext } from "react";

/** Pixel inset reserved for the fixed web tab bar. Null outside that frame. */
export const WebTabBarInsetContext = createContext<number | null>(null);

export function useWebTabBarInset(): number {
  return useContext(WebTabBarInsetContext) ?? 0;
}

export function useIsDocumentScrollFrame(): boolean {
  return useContext(WebTabBarInsetContext) !== null;
}
