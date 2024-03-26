# Turborepo starter

This is an official starter Turborepo.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/next-youtube-livechat`: hook published to npm public registry
- `@repo/prettier-config`: prettier config
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo
pnpm build
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo
pnpm dev
```

### Remote Caching

Turborepo can use a technique known as [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```
cd my-turborepo
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
npx turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)
# next-youtube-chat

Fetch YouTube live chat without API using NextJS which bypass CORS.

🚨 You will need to take full responsibility for your action 🚨

Demo site: [https://next-youtube-livechat.vercel.app/](https://next-youtube-livechat.vercel.app/)

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

> Proxy to bypass CORS.

- `app\api\yt-api\[...slug]\route.ts`

### Usage

```ts
import useLiveChat from '@/hooks/useLiveChat';
import { ChatItem } from '@/types/yt-data';

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

  const onChatItemsReceive = useCallback(async (newChatItems: ChatItem[], existingChatItems: ChatItem[]) => {
    console.log('new chat items', newChatItems);
    console.log('received chat items', existingChatItems);
  }, []);

  const onError = useCallback(async () => {
    setIsLoading(false);
    setIsReady(false);
    setUrl();
  }, [setIsLoading, setIsReady, setUrl]);

  const { displayedMessage, rawChatItems, cleanUp } = useLiveChat({
    url,
    isReady,
    onBeforeStart,
    onStart,
    onChatItemsReceive,
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
