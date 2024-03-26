export interface LiveChatThemeEditorInterface {
  isLoading: boolean;
  isReady: boolean;
  url: string | undefined;
}

export interface LiveChatThemeEditorActionInterface {
  setIsLoading: (isLoading: boolean) => void;
  setIsReady: (isReady: boolean) => void;
  setUrl: (url?: string) => void;
}

export type LiveChatThemeEditorFullInterface = LiveChatThemeEditorInterface &
  LiveChatThemeEditorActionInterface;
