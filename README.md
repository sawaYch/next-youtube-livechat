# Next Youtube Livechat Monorepo

![Vercel Deploy](https://vercel-badge-sawa.vercel.app/?app=next-youtube-livechat)
<span class="badge-npmversion"><a href="https://npmjs.org/package/next-youtube-livechat" title="View this project on NPM"><img src="https://img.shields.io/npm/v/next-youtube-livechat" alt="NPM version" /></a></span>
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

This is the monorepo for next-youtube-livechat package hook, create with [Turborepo](https://turbo.build/repo).  
Include a demo NextJS 14 website demonstrate the usage of `next-youtube-livechat` react hook library.

## Package `next-youtube-livechat`

Fetch YouTube live chat without API using NextJS which bypass CORS.  
Demo site: [https://next-youtube-livechat.vercel.app/](https://next-youtube-livechat.vercel.app/)

<sup><sub>🚨 You will need to take full responsibility for your action 🚨</sub></sup>

### Getting started

#### Installation

> Package already provide types files

```ts
npm i next-youtube-livechat
```

#### Source Code

Hook

> React hook for getting livestream message data, event handling

- `src/hooks/useLiveChat.tsx`

Youtube related functions

> Use to parse chat message / emoji  
> API functions contain payload for fetching live chatroom (without using YouTube Data API)

- `src/lib/yt-api-parser.ts`
- `src/lib/yt-api-requests.ts`

#### Usage

##### NextJS API

Add the follow API code to bypass CORS, otherwise this library will not work.  
Here is the example for NextJS 14 app directory:

`app\api\yt-api\[...slug]\route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_URL = 'https://www.youtube.com';

const buildYouTubeEndpoint = (req: NextRequest) => {
  const path = req.nextUrl.pathname.replace('/api/yt-api', '');
  const suffix = `${path}${req.nextUrl.search}`;
  const url = `${YOUTUBE_URL}${suffix}`;
  return url;
};

const GET = async (req: NextRequest) => {
  const res = await fetch(buildYouTubeEndpoint(req), { cache: 'no-store' })
    .then((d) => d.text())
    .then((d) => {
      return d;
    })
    .catch((error) => {
      throw new Error(`Server Action Failed: ${error.message}`);
    });
  return NextResponse.json(res, { status: 200 });
};

const POST = async (req: NextRequest) => {
  const postData = await req.json();
  const data = await fetch(buildYouTubeEndpoint(req), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  })
    .then((d) => d.json())
    .catch((error) => {
      throw new Error(`Server Action Failed: ${error.message}`);
    });
  return NextResponse.json(data, { status: 200 });
};

export { GET, POST };
```

##### Example

```ts
import { useLiveChat } from 'next-youtube-livechat';

/** Example Demo page component **/
export const Demo = () => {
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

  const { displayedMessage, rawChatItems, liveDetails } = useLiveChat({
    url,
    isReady,
    onBeforeStart,
    onStart,
    onChatItemsReceive,
    onError,
  });

return  (<div>
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
          {displayedMessage?.map((it, index) => (
            <span key={`${it.message}${index}`}>{it.message}</span>
          ))}
        </div>)
}
```

### Reference

Part of the code is referenced from [LinaTsukusu/youtube-chat](https://github.com/LinaTsukusu/youtube-chat), many thanks 🙌

## Monorepo structure

```ts
├── README.md
├── apps
│   └── web
├── components.json
├── next.config.mjs
├── package-lock.json
├── package.json
├── packages
│   ├── eslint-config
│   ├── next-youtube-livechat
│   ├── prettier-config
│   └── typescript-config
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── turbo.json
```

- `apps/web` - Demo website
- `packages/next-youtube-livechat` - React hook library `next-youtube-livechat`
- `packages/eslint-config` - eslint configurations (includes `eslint-config-next`, `eslint-config-prettier` and `eslint-config-turbo`)
- `packages/typescript-config` - tsconfig.json used throughout the monorepo
- `packages/prettier-config` - prettier config

## Develop

Restore dependencies:

```sh
npm i
```

Developing apps & packages should be able to hot reload on file changed, also with linting & typecheck.  
To develop (all apps and packages), run:

```sh
turbo dev
```

### Build

To build all apps and packages, run:

```sh
turbo build
```

### Lint, Format, Typecheck

```sh
turbo lint
turbo format
turbo format:fix # prettier fix
turbo typecheck # tsc --noEmit typecheck
```

## Publish packages

Publish package local and manually:

```sh
turbo build # build dist for all the packages and apps
cd packages/next-youtube-livechat

#... do bump version stuffs

npm login
npm publish
```
