'use client';

import { useDemoStore } from '@/stores/store';
import { ChatItem } from '@/types/yt-data';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import UrlInput from '@/components/url-input';

import { cn } from '@/lib/utils';
import { fetchChat, fetchLivePageByLiveUrl } from '@/lib/yt-api-requests';

const Demo = () => {
  const { isReady, isLoading, setUrl, url, setIsReady, setIsLoading } =
    useDemoStore();
  const [messages, setMessages] = useState<ChatItem[]>([]);

  const intervalHandle = useRef<NodeJS.Timeout>();
  const endOfMessageDivRef = useRef<HTMLDivElement>(null);
  const scrollableMessageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (url) {
        setIsLoading(true);
        let options = await fetchLivePageByLiveUrl(url);
        intervalHandle.current = setInterval(async () => {
          if (!isReady) return;
          const [chatItems, continuation] = await fetchChat(options);
          setMessages((prev) => [...prev, ...chatItems]);
          options.continuation = continuation;
        }, 1000);
        setIsLoading(false);
        setIsReady(true);
      }
    })();
  }, [isReady, setIsLoading, setIsReady, url]);

  const displayedMessage = useMemo(() => {
    return messages.map((it) => ({
      message: it.message.map(
        (it) => `${'text' in it ? it.text : it.emojiText}`
      ),
      avatar: it.author.thumbnail?.url,
      name: it.author.name,
    }));
  }, [messages]);

  useEffect(() => {
    if (!scrollableMessageContainerRef.current) return;

    const shouldScrollToBottom =
      (scrollableMessageContainerRef.current.scrollTop +
        scrollableMessageContainerRef.current.offsetHeight) *
        1.1 >=
      scrollableMessageContainerRef.current.scrollHeight;

    if (displayedMessage.length != 0 && shouldScrollToBottom) {
      endOfMessageDivRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [displayedMessage.length]);

  return (
    <div className='z-40 mt-4 flex h-[calc(100dvh-10rem)] w-[calc(100dvw-10rem)] flex-col items-center justify-start'>
      <div className='flex p-4 h-full w-full flex-col overflow-y-auto overflow-x-hidden gap-4'>
        <UrlInput
          isLoading={isLoading}
          isReady={isReady}
          handleUrlSubmit={async (url: string) => {
            if (!isReady) {
              setUrl(url);
              return;
            }
            setIsReady(false);
            setUrl();
            if (intervalHandle.current) {
              clearInterval(intervalHandle.current);
            }
            setMessages([]);
          }}
        />

        <AnimatePresence>
          <div
            ref={scrollableMessageContainerRef}
            className='flex h-full w-full flex-col overflow-y-auto overflow-x-hidden'
          >
            {displayedMessage?.map((message, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
                transition={{
                  opacity: { duration: 0.1 },
                  layout: {
                    type: 'spring',
                    bounce: 0.3,
                    duration: displayedMessage.indexOf(message) * 0.05 + 0.2,
                  },
                }}
                style={{
                  originX: 0.5,
                  originY: 0.5,
                }}
                className={cn(
                  'flex flex-col items-end gap-2 whitespace-pre-wrap p-4'
                )}
              >
                <div className='flex items-center gap-3'>
                  <span className=' max-w-xs rounded-md bg-accent p-3'>
                    {message.message}
                  </span>
                  <Avatar className='flex items-center justify-center'>
                    <AvatarImage
                      src={message.avatar}
                      alt={message.name}
                      width={6}
                      height={6}
                    />
                  </Avatar>
                </div>
              </motion.div>
            ))}
            <div id='endOfMessageDiv' ref={endOfMessageDivRef} />
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Demo;
