import { ChatItem, YoutubeDetails } from './youtubeData';

export interface useLiveChatMessageType {
  message: React.JSX.Element[];
  avatar: string | undefined;
  name: string;
  wordCount: number;
  characterCount: number;
}

export interface useLIveChatReturnType {
  rawChatItems: ChatItem[];
  messages: useLiveChatMessageType[];
  liveDetails?: YoutubeDetails;
}
