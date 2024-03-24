# next-youtube-chat

Fetch YouTube live chat without API using NextJS which bypass CORS.

🚨 You will need to take full responsibility for your action 🚨

## Getting started

### Source Code

Hook

> React hook for getting livestream message data, event handling

- `hooks\useLiveChat.tsx`

Youtube related functions

> Use to parse chat message / emoji  
> API functions contain payload for fetching live chatroom (without using YouTube Data API)

- `lib\yt-api-parser.ts`
- `lib\yt-api-requests.ts`

Next Backend API

> Act as proxy to bypass CORS.

- `app\api\yt-api\[...slug]\route.ts`

### Usage

```ts
import useLiveChat from '@/hooks/useLiveChat';

const Demo = () => {
  /** loading state, optional. Can use to control show spinner before fetching start & hide spinner after fetching start **/
  const [isLoading, setIsLoading] = useState<boolean>();

  /** ready state, required. Use to control start/termination of chat message polling **/
  const [isReady, setIsReady] = useState<boolean>();

  /** url state, required. Use to provide YouTube livestream target to fetch chat message **/
  const [url, setUrl] = useState<string | undefined>();

  const onBeforeStart = useCallback(async () => {
    setIsLoading(true);
  }, [setIsLoading]);

  const onStart = useCallback(async () => {
    setIsLoading(false);
    setIsReady(true);
  }, [setIsLoading, setIsReady]);

  const onError = useCallback(async () => {
    setIsLoading(false);
    setIsReady(false);
    setUrl();
  }, [setIsLoading, setIsReady, setUrl]);

  const { displayedMessage, cleanUp } = useLiveChat({
    url,
    isReady,
    onBeforeStart,
    onStart,
    onError,
  });

return  (<div>
          {displayedMessage?.map((it, index) => (
            <span key={`${it.message}${index}`}>{it.message}</span>
          ))}
        </div>)
}
```

## Reference

Part of the code is referenced from [LinaTsukusu/youtube-chat](https://github.com/LinaTsukusu/youtube-chat), many thanks 🙌
