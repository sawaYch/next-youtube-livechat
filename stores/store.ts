import {
  LiveChatThemeEditorFullInterface,
  LiveChatThemeEditorInterface,
} from '@/types/livechat-theme-editor';
import { createContext, useContext } from 'react';
import { createStore, useStore as useZustandStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

const storeContext = createContext<ReturnType<typeof initStore> | null>(null);
export const StoreContextProvider = storeContext.Provider;

function useStore<T>(selector: (state: LiveChatThemeEditorFullInterface) => T) {
  const store = useContext(storeContext);
  if (!store) throw new Error('Store is missing the provider');
  return useZustandStore(store, selector);
}

const getDefaultInitialState: () => LiveChatThemeEditorInterface = () => ({
  isLoading: false,
  isReady: false,
  url: undefined,
});

export const useDemoStore = () => {
  return useStore(
    useShallow((store) => ({
      isLoading: store.isLoading,
      isReady: store.isReady,
      url: store.url,
      setIsLoading: store.setIsLoading,
      setIsReady: store.setIsReady,
      setUrl: store.setUrl,
    }))
  );
};

export const initStore = () => {
  return createStore<LiveChatThemeEditorFullInterface>((set, _get) => ({
    ...getDefaultInitialState(),
    setIsLoading: (isLoading: boolean) => {
      set((_state) => {
        return { isLoading };
      });
    },
    setIsReady: (isReady: boolean) => {
      set((_state) => {
        return { isReady };
      });
    },
    setUrl: (url?: string) => {
      set((_state) => {
        return { url };
      });
    },
  }));
};
