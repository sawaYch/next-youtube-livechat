import { ChatItem } from '@/types/yt-data';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useToast } from '@/components/ui/use-toast';

import { fetchChat, fetchLivePageByLiveUrl } from '@/lib/yt-api-requests';

interface useLiveChatProps {
  onBeforeStart: () => Promise<void>;
  onStart: () => Promise<void>;
  onError: (err: Error) => Promise<void>;
  url: string | undefined;
  isReady: boolean;
}

const useLiveChat = ({
  onBeforeStart,
  onStart,
  onError,
  url,
  isReady,
}: useLiveChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const intervalHandle = useRef<NodeJS.Timeout>();

  useEffect(() => {
    (async () => {
      try {
        if (url) {
          await onBeforeStart();
          let options = await fetchLivePageByLiveUrl(url);
          intervalHandle.current = setInterval(async () => {
            if (!isReady) return;
            const [chatItems, continuation] = await fetchChat(options);
            setMessages((prev) => [...prev, ...chatItems]);
            options.continuation = continuation;
          }, 1000);
          await onStart();
        }
      } catch (err) {
        toast({
          title: '🚨Oops...',
          description: (err as unknown as Error).message,
          variant: 'destructive',
        });

        await onError(err as unknown as Error);
      }
    })();

    return () => {
      if (intervalHandle.current) {
        clearInterval(intervalHandle.current);
      }
    };
  }, [isReady, toast, url, onBeforeStart, onStart, onError]);

  const displayedMessage = useMemo(() => {
    return messages.map((it) => ({
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
  }, [messages]);

  const cleanUp = useCallback(async () => {
    if (intervalHandle.current) {
      clearInterval(intervalHandle.current);
    }
    setMessages([]);
  }, []);

  return { displayedMessage, cleanUp };
};

export default useLiveChat;
