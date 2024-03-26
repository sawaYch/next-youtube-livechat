import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';

import { fetchChat, fetchLivePageByLiveUrl } from '../libs/youtubeApiRequests';
import { ChatItem } from '../types/youtubeData';

interface useLiveChatProps {
  onBeforeStart?: () => Promise<void>;
  onStart?: () => Promise<void>;
  onChatItemsReceive?: (
    newChatItems: ChatItem[],
    existingChatItems: ChatItem[]
  ) => Promise<void>;
  onError?: (err: Error) => Promise<void>;
  url: string | undefined;
  isReady: boolean;
}

const useLiveChat = ({
  onBeforeStart,
  onStart,
  onChatItemsReceive,
  onError,
  url,
  isReady,
}: useLiveChatProps) => {
  const [rawChatItems, setRawChatItems] = useState<ChatItem[]>([]);
  const rawChatItemRef = useRef(rawChatItems);
  const intervalHandle = useRef<NodeJS.Timeout>();
  rawChatItemRef.current = rawChatItems;

  const cleanUp = useCallback(async () => {
    if (intervalHandle.current) {
      clearInterval(intervalHandle.current);
    }
    setRawChatItems([]);
  }, [intervalHandle]);

  useEffect(() => {
    (async () => {
      try {
        // url must provide
        if (url) {
          // run task before start
          await onBeforeStart?.();
          let options = await fetchLivePageByLiveUrl(url);

          intervalHandle.current = setInterval(async () => {
            if (!isReady) {
              cleanUp();
              return;
            }
            const [chatItems, continuation] = await fetchChat(options);
            if (chatItems.length != 0) {
              await onChatItemsReceive?.(chatItems, rawChatItemRef.current);
            }
            setRawChatItems((prev) => [...prev, ...chatItems]);
            options.continuation = continuation;
          }, 1000);
          // run task on start success
          await onStart?.();
        }
      } catch (err) {
        // run task on something wrong
        await onError?.(err as unknown as Error);
      }
    })();

    return () => {
      // clean up interval timer
      if (intervalHandle.current) {
        clearInterval(intervalHandle.current);
      }
    };
  }, [
    isReady,
    url,
    onBeforeStart,
    onStart,
    onError,
    cleanUp,
    onChatItemsReceive,
  ]);

  // render text & emoji tsx element
  const messages = useMemo(() => {
    if (!(url && isReady)) {
      return [];
    }
    return rawChatItems.map((it) => ({
      message: it.message.map((it, index) => {
        if ('text' in it) {
          return (
            <span className='relative inline-block' key={`${it.text}${index}`}>
              {it.text}
            </span>
          );
        }
        return (
          <Image
            key={`${it.emojiText}${index}`}
            className='relative inline-block'
            src={it.url}
            alt={it.alt}
            width={24}
            height={24}
          />
        );
      }),
      avatar: it.author.thumbnail?.url,
      name: it.author.name,
    }));
  }, [isReady, rawChatItems, url]);

  return { rawChatItems, messages, cleanUp };
};

export default useLiveChat;
