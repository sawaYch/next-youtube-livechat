import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';

import { fetchChat, fetchLivePageByLiveUrl } from '../libs/youtubeApiRequests';
import { useLIveChatReturnType } from '../types/useLiveChatType';
import { ChatItem, YoutubeDetails } from '../types/youtubeData';
import { FetchOptions } from '../types/youtubeResponse';

interface useLiveChatProps {
  onBeforeStart?: () => void;
  onStart?: () => void;
  onChatItemsReceive?: (
    newChatItems: ChatItem[],
    existingChatItems: ChatItem[]
  ) => void;
  onError?: (err: Error) => void;
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
}: useLiveChatProps): useLIveChatReturnType => {
  const [rawChatItems, setRawChatItems] = useState<ChatItem[]>([]);
  const rawChatItemRef = useRef(rawChatItems);
  const intervalHandle = useRef<NodeJS.Timeout | null>(null);
  rawChatItemRef.current = rawChatItems;
  const [options, setOptions] = useState<
    FetchOptions & {
      liveId: string;
    }
  >();
  const [liveDetails, setLiveDetails] = useState<YoutubeDetails>();

  const cleanUp = useCallback(() => {
    if (intervalHandle?.current) {
      clearInterval(intervalHandle.current);
    }
    setRawChatItems([]);
    setOptions(undefined);
    setLiveDetails(undefined);
  }, [intervalHandle]);

  useEffect(() => {
    // url must provide
    try {
      if (url) {
        // run task before start
        onBeforeStart?.();
        fetchLivePageByLiveUrl(url)
          .then((data) => {
            setOptions(data);
            setLiveDetails({
              title: data.liveTitle,
              thumbnail: data.liveThumbnail,
              channelName: data.channelName,
              channelUrl: data.channelUrl,
            });
          })
          .catch((err) => {
            onError?.(err as unknown as Error);
          });
        // run task on start success
        onStart?.();
      }
    } catch (err) {
      onError?.(err as unknown as Error);
    }
  }, [onBeforeStart, onError, onStart, url]);

  useEffect(() => {
    if (options == null || !isReady || !url) return;
    try {
      intervalHandle.current = setInterval(async () => {
        if (!isReady) {
          cleanUp();
          return;
        }
        const [chatItems, continuation] = await fetchChat(options);
        if (chatItems.length != 0) {
          onChatItemsReceive?.(chatItems, rawChatItemRef.current);
        }
        setRawChatItems((prev) => [...prev, ...chatItems]);
        options.continuation = continuation;
      }, 1000);
    } catch (err) {
      // run task on something wrong
      onError?.(err as unknown as Error);
      cleanUp();
    }

    return () => {
      // clean up interval timer
      cleanUp();
    };
  }, [
    url,
    isReady,
    onBeforeStart,
    onStart,
    onError,
    onChatItemsReceive,
    cleanUp,
    options,
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
      wordCount: it.message
        .map((it) => {
          if ('text' in it) {
            return it.text;
          }
          return ' ';
        })
        .join('')
        .trim()
        .split(/\s+/).length,
      characterCount: it.message
        .map((it) => {
          if ('text' in it) {
            return it.text;
          }
          return ' ';
        })
        .join('').length,
    }));
  }, [isReady, rawChatItems, url]);

  return { rawChatItems, messages, liveDetails };
};

export default useLiveChat;
