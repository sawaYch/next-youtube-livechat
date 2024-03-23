'use client';

import { useDemoStore } from '@/stores/store';
import { ChatItem } from '@/types/yt-data';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useToast } from './ui/use-toast';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import UrlInput from '@/components/url-input';

import { cn } from '@/lib/utils';
import { fetchChat, fetchLivePageByLiveUrl } from '@/lib/yt-api-requests';

const Demo = () => {
  const { toast } = useToast();
  const { isReady, isLoading, setUrl, url, setIsReady, setIsLoading } =
    useDemoStore();
  const [messages, setMessages] = useState<ChatItem[]>([]);

  const intervalHandle = useRef<NodeJS.Timeout>();
  const endOfMessageDivRef = useRef<HTMLDivElement>(null);
  const scrollableMessageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
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
      } catch (err) {
        toast({
          title: '🚨Oops...',
          description: (err as unknown as Error).message,
          variant: 'destructive',
        });
        setIsLoading(false);
        setIsReady(false);
        setUrl();
      }
    })();

    return () => {
      if (intervalHandle.current) {
        clearInterval(intervalHandle.current);
      }
    };
  }, [isReady, setIsLoading, setIsReady, setUrl, toast, url]);

  const displayedMessage = useMemo(() => {
    return messages.map((it) => ({
      message: it.message.map((it, index) => {
        if ('text' in it) {
          return <span key={`${it.text}${index}`}>{it.text}</span>;
        }

        return (
          <Image
            key={`${it.emojiText}${index}`}
            className='relative inline-block'
            src={it.url}
            alt={it.alt}
            width={32}
            height={32}
          />
        );
      }),
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
            className='flex h-full w-full flex-col overflow-y-auto overflow-x-hidden pr-2'
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
                  <div className='max-w-xs rounded-md bg-accent p-3'>
                    <div className='rounded-lg bg-primary px-2 mb-2 w-fit'>
                      {message.name}
                    </div>
                    <span>{message.message}</span>
                  </div>
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
