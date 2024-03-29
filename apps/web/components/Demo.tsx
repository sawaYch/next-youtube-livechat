'use client';

import { useDemoStore } from '@/stores/store';
import { AnimatePresence, motion } from 'framer-motion';
import { useLiveChat } from 'next-youtube-livechat';
import Image from 'next/image';
import { useCallback, useEffect, useRef } from 'react';

import UrlInput from '@/components/UrlInput';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

import { cn } from '@/lib/utils';

const Demo = () => {
  const { isReady, isLoading, setUrl, url, setIsReady, setIsLoading } =
    useDemoStore();
  const endOfMessageDivRef = useRef<HTMLDivElement>(null);
  const scrollableMessageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const onBeforeStart = useCallback(() => {
    setIsLoading(true);
  }, [setIsLoading]);

  const onStart = useCallback(() => {
    setIsLoading(false);
    setIsReady(true);
  }, [setIsLoading, setIsReady]);

  const onError = useCallback(
    (err: Error) => {
      toast({
        title: '🚨Oops...',
        description: (err as unknown as Error).message,
        variant: 'destructive',
      });
      setIsLoading(false);
      setIsReady(false);
      setUrl();
    },
    [setIsLoading, setIsReady, setUrl, toast]
  );

  const { messages, liveDetails } = useLiveChat({
    url,
    isReady,
    onBeforeStart,
    onStart,
    onError,
  });

  useEffect(() => {
    if (!scrollableMessageContainerRef.current) return;

    const shouldScrollToBottom =
      (scrollableMessageContainerRef.current.scrollTop +
        scrollableMessageContainerRef.current.offsetHeight) *
        1.1 >=
      scrollableMessageContainerRef.current.scrollHeight;

    if (messages.length != 0 && shouldScrollToBottom) {
      endOfMessageDivRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages.length]);

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
          }}
        />
        {liveDetails && (
          <div className='items-center flex flex-col justify-center'>
            <Image
              src={liveDetails.thumbnail}
              width={240}
              height={160}
              alt='thumbnail'
            />
            <div>{liveDetails.title}</div>
            <div>Channel Owner Name: {liveDetails.channelName}</div>
            <div>Channel Profile URL: {liveDetails.channelUrl}</div>
          </div>
        )}
        <AnimatePresence>
          <div
            ref={scrollableMessageContainerRef}
            className='flex h-full w-full flex-col overflow-y-auto overflow-x-hidden pr-2'
          >
            {messages?.map((message, index) => (
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
                    duration: messages.indexOf(message) * 0.05 + 0.2,
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
                    <span className='relative inline-block'>
                      {message.message}
                    </span>
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
