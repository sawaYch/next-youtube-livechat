# Next Youtube Livechat Monorepo

This is the monorepo for next-youtube-livechat package hook, create with [Turborepo](https://turbo.build/repo).  
Contains a demo NextJS 14 website demonstrate the usage of `next-youtube-livechat` react hook library.  

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

To develop all apps and packages, run:
Both app & packages should be hot reload on file changed, and supporting linting & typecheck.  

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
