"use client";

import { LiveChatThemeEditorFullInterface } from "../types/livechatThemeEditor";
import { type PropsWithChildren, useRef } from "react";
import { StoreApi } from "zustand";

import { StoreContextProvider, initStore } from "./store";

export default function StoreProvider({ children }: PropsWithChildren) {
  const storeRef = useRef<StoreApi<LiveChatThemeEditorFullInterface>>();

  if (!storeRef.current) {
    storeRef.current = initStore();
  }

  return (
    <StoreContextProvider value={storeRef.current}>
      {children}
    </StoreContextProvider>
  );
}
