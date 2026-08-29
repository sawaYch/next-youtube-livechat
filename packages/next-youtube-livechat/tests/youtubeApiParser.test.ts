import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getOptionsFromLivePage,
  parseChatData,
} from '../src/libs/youtubeApiParser';
import {
  TIMESTAMP_DATE,
  addChatItemAction,
  chatResponse,
  membershipRenderer,
  paidMessageRenderer,
  paidStickerRenderer,
  textRenderer,
} from './fixtures/liveChat';
import { buildLivePageHtml, defaultLivePage } from './fixtures/livePage';

describe('getOptionsFromLivePage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('parses live page fields and ignores decoy canonicalBaseUrl entries', () => {
    const options = getOptionsFromLivePage(buildLivePageHtml());

    expect(options).toEqual({
      liveId: defaultLivePage.liveId,
      apiKey: defaultLivePage.apiKey,
      clientVersion: defaultLivePage.clientVersion,
      continuation: defaultLivePage.continuation,
      liveThumbnail: `https://i.ytimg.com/vi/${defaultLivePage.liveId}/hqdefault.jpg`,
      liveTitle: defaultLivePage.title,
      channelName: defaultLivePage.channelName,
      channelUrl: `https://www.youtube.com${defaultLivePage.channelPath}`,
    });
  });

  it('throws when the live stream is not found', () => {
    expect(() =>
      getOptionsFromLivePage(buildLivePageHtml({ omitLiveId: true }))
    ).toThrow('Live Stream was not found');
  });

  it('throws when the live is a finished replay', () => {
    expect(() =>
      getOptionsFromLivePage(buildLivePageHtml({ isReplay: true }))
    ).toThrow(`${defaultLivePage.liveId} is finished live`);
  });

  it('throws when the API key is missing', () => {
    expect(() =>
      getOptionsFromLivePage(buildLivePageHtml({ omitApiKey: true }))
    ).toThrow('API Key was not found');
  });

  it('throws when the client version is missing', () => {
    expect(() =>
      getOptionsFromLivePage(buildLivePageHtml({ omitClientVersion: true }))
    ).toThrow('Client Version was not found');
  });

  it('throws when continuation is missing', () => {
    expect(() =>
      getOptionsFromLivePage(buildLivePageHtml({ omitContinuation: true }))
    ).toThrow('Continuation was not found. Probably live stream is finished.');
  });

  it('throws when the live thumbnail is missing', () => {
    expect(() =>
      getOptionsFromLivePage(buildLivePageHtml({ omitThumbnail: true }))
    ).toThrow('Live Thumbnail was not found');
  });

  it('throws when the live title is missing', () => {
    expect(() =>
      getOptionsFromLivePage(buildLivePageHtml({ omitTitle: true }))
    ).toThrow('Live Title was not found');
  });

  it('falls back when channel owner metadata is missing', () => {
    const options = getOptionsFromLivePage(
      buildLivePageHtml({ omitChannelOwner: true })
    );

    expect(options.channelName).toBe('???');
    expect(options.channelUrl).toBe('???');
  });
});

describe('parseChatData', () => {
  const author = {
    name: 'authorName',
    thumbnail: {
      url: 'https://author.thumbnail.url',
      alt: 'authorName',
    },
    channelId: 'channelId',
  };

  it('parses a normal text message and invalidation continuation', () => {
    const [chatItems, continuation] = parseChatData(
      chatResponse([
        addChatItemAction({
          liveChatTextMessageRenderer: textRenderer(),
        }),
      ])
    );

    expect(continuation).toBe('test-continuation:01');
    expect(chatItems).toMatchObject([
      {
        id: 'id',
        author,
        message: [{ text: 'Hello, World!' }],
        isMembership: false,
        isVerified: false,
        isOwner: false,
        isModerator: false,
        timestamp: TIMESTAMP_DATE,
      },
    ]);
  });

  it('parses a global emoji using emojiId', () => {
    const [chatItems] = parseChatData(
      chatResponse([
        addChatItemAction({
          liveChatTextMessageRenderer: textRenderer({
            runs: [
              {
                emoji: {
                  emojiId: '👏',
                  shortcuts: [':clapping_hands:'],
                  searchTerms: [],
                  supportsSkinTone: false,
                  image: {
                    thumbnails: [
                      {
                        url: 'https://www.youtube.com/s/gaming/emoji/emoji_u1f44f.svg',
                      },
                    ],
                    accessibility: {
                      accessibilityData: { label: 'clapping hands' },
                    },
                  },
                  variantIds: [],
                },
              },
            ],
          }),
        }),
      ])
    );

    expect(chatItems[0]?.message).toEqual([
      {
        url: 'https://www.youtube.com/s/gaming/emoji/emoji_u1f44f.svg',
        alt: ':clapping_hands:',
        isCustomEmoji: false,
        emojiText: '👏',
      },
    ]);
  });

  it('parses a custom emoji using the shortcut as emojiText', () => {
    const [chatItems] = parseChatData(
      chatResponse([
        addChatItemAction({
          liveChatTextMessageRenderer: textRenderer({
            runs: [
              {
                emoji: {
                  emojiId: 'customEmojiId',
                  shortcuts: [':customEmoji:'],
                  searchTerms: [],
                  supportsSkinTone: false,
                  image: {
                    thumbnails: [{ url: 'https://custom.emoji.url' }],
                    accessibility: {
                      accessibilityData: { label: 'custom emoji' },
                    },
                  },
                  variantIds: [],
                  isCustomEmoji: true,
                },
              },
            ],
          }),
        }),
      ])
    );

    expect(chatItems[0]?.message).toEqual([
      {
        url: 'https://custom.emoji.url',
        alt: ':customEmoji:',
        isCustomEmoji: true,
        emojiText: ':customEmoji:',
      },
    ]);
  });

  it('parses a membership chat with a custom badge', () => {
    const [chatItems] = parseChatData(
      chatResponse([
        addChatItemAction({
          liveChatTextMessageRenderer: textRenderer({
            authorBadges: [
              {
                liveChatAuthorBadgeRenderer: {
                  customThumbnail: {
                    thumbnails: [
                      { url: 'https://membership.badge.small' },
                      { url: 'https://membership.badge.url' },
                    ],
                  },
                  tooltip: 'Member (6 months)',
                  accessibility: {
                    accessibilityData: { label: 'Member (6 months)' },
                  },
                },
              },
            ],
          }),
        }),
      ])
    );

    expect(chatItems[0]).toMatchObject({
      isMembership: true,
      author: {
        badge: {
          label: 'Member (6 months)',
          thumbnail: {
            url: 'https://membership.badge.url',
            alt: 'Member (6 months)',
          },
        },
      },
    });
  });

  it('parses a new membership item from headerSubtext', () => {
    const [chatItems] = parseChatData(
      chatResponse([
        addChatItemAction({
          liveChatMembershipItemRenderer: membershipRenderer(),
        }),
      ])
    );

    expect(chatItems[0]).toMatchObject({
      isMembership: true,
      message: [{ text: 'Welcome to ' }, { text: 'the club!' }],
    });
  });

  it('parses a super chat amount and color', () => {
    const [chatItems] = parseChatData(
      chatResponse([
        addChatItemAction({
          liveChatPaidMessageRenderer: paidMessageRenderer(),
        }),
      ])
    );

    expect(chatItems[0]?.superchat).toEqual({
      amount: '¥1,000',
      color: '#FFCA28',
    });
  });

  it('parses a super sticker', () => {
    const [chatItems] = parseChatData(
      chatResponse([
        addChatItemAction({
          liveChatPaidStickerRenderer: paidStickerRenderer(),
        }),
      ])
    );

    expect(chatItems[0]).toMatchObject({
      message: [],
      superchat: {
        amount: '¥90',
        color: '#1565C0',
        sticker: {
          url: '//super.sticker.url',
          alt: 'superSticker',
        },
      },
    });
  });

  it.each([
    ['OWNER', { isOwner: true, isVerified: false, isModerator: false }],
    ['VERIFIED', { isOwner: false, isVerified: true, isModerator: false }],
    ['MODERATOR', { isOwner: false, isVerified: false, isModerator: true }],
  ] as const)('sets badge flags for %s', (iconType, flags) => {
    const [chatItems] = parseChatData(
      chatResponse([
        addChatItemAction({
          liveChatTextMessageRenderer: textRenderer({
            authorBadges: [
              {
                liveChatAuthorBadgeRenderer: {
                  icon: { iconType },
                  tooltip: iconType,
                  accessibility: {
                    accessibilityData: { label: iconType },
                  },
                },
              },
            ],
          }),
        }),
      ])
    );

    expect(chatItems[0]).toMatchObject(flags);
  });

  it('uses timed continuation when invalidation data is absent', () => {
    const [, continuation] = parseChatData(
      chatResponse([], { timed: 'timed-continuation:01' })
    );

    expect(continuation).toBe('timed-continuation:01');
  });

  it('returns an empty continuation when neither continuation type is present', () => {
    const [, continuation] = parseChatData(chatResponse([], {}));

    expect(continuation).toBe('');
  });

  it('returns no chat items when actions are missing', () => {
    const data = chatResponse([]);
    data.continuationContents.liveChatContinuation.actions =
      undefined as unknown as typeof data.continuationContents.liveChatContinuation.actions;

    const [chatItems, continuation] = parseChatData(data);

    expect(chatItems).toEqual([]);
    expect(continuation).toBe('test-continuation:01');
  });

  it('filters actions that are not chat messages', () => {
    const [chatItems] = parseChatData(
      chatResponse([
        {},
        addChatItemAction({
          liveChatViewerEngagementMessageRenderer: {},
        }),
        addChatItemAction({
          liveChatTextMessageRenderer: textRenderer(),
        }),
      ])
    );

    expect(chatItems).toHaveLength(1);
    expect(chatItems[0]?.id).toBe('id');
  });

  it('uses empty author fields when name and photo thumbnails are missing', () => {
    const [chatItems] = parseChatData(
      chatResponse([
        addChatItemAction({
          liveChatTextMessageRenderer: textRenderer({
            authorName: undefined,
            authorPhoto: { thumbnails: [] },
          }),
        }),
      ])
    );

    expect(chatItems[0]?.author).toEqual({
      name: '',
      thumbnail: { url: '', alt: '' },
      channelId: 'channelId',
    });
  });
});
