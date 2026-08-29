import { ChatItem } from '../../src/types/youtubeData';
import {
  Action,
  AddChatItemAction,
  GetLiveChatResponse,
  LiveChatMembershipItemRenderer,
  LiveChatPaidMessageRenderer,
  LiveChatPaidStickerRenderer,
  LiveChatTextMessageRenderer,
  MessageRun,
} from '../../src/types/youtubeResponse';

export const TIMESTAMP_USEC = '1609459200000000';
export const TIMESTAMP_DATE = new Date('2021-01-01T00:00:00.000Z');

const unusedEndpoint = {
  clickTrackingParams: '',
  commandMetadata: {
    webCommandMetadata: {
      ignoreNavigation: true as const,
    },
  },
  liveChatItemContextMenuEndpoint: {
    params: '',
  },
};

const unusedA11y = {
  accessibilityData: {
    label: 'Comment actions',
  },
};

export function textRenderer(
  overrides: Partial<LiveChatTextMessageRenderer> & {
    runs?: MessageRun[];
  } = {}
): LiveChatTextMessageRenderer {
  const { runs, ...rest } = overrides;
  return {
    id: 'id',
    timestampUsec: TIMESTAMP_USEC,
    authorExternalChannelId: 'channelId',
    authorName: { simpleText: 'authorName' },
    authorPhoto: {
      thumbnails: [
        { url: 'https://author.thumbnail.small', width: 32, height: 32 },
        { url: 'https://author.thumbnail.url', width: 64, height: 64 },
      ],
    },
    contextMenuEndpoint: unusedEndpoint,
    contextMenuAccessibility: unusedA11y,
    message: {
      runs: runs ?? [{ text: 'Hello, World!' }],
    },
    ...rest,
  };
}

export function addChatItemAction(item: AddChatItemAction['item']): Action {
  return {
    addChatItemAction: {
      item,
      clientId: '',
    },
  };
}

export function chatResponse(
  actions: Action[],
  continuation: { invalidation?: string; timed?: string } = {
    invalidation: 'test-continuation:01',
  }
): GetLiveChatResponse {
  return {
    responseContext: {},
    continuationContents: {
      liveChatContinuation: {
        continuations: [
          {
            ...(continuation.invalidation
              ? {
                  invalidationContinuationData: {
                    invalidationId: {
                      objectSource: 0,
                      objectId: '',
                      topic: '',
                      subscribeToGcmTopics: true,
                      protoCreationTimestampMs: '',
                    },
                    timeoutMs: 10000,
                    continuation: continuation.invalidation,
                  },
                }
              : {}),
            ...(continuation.timed
              ? {
                  timedContinuationData: {
                    timeoutMs: 5000,
                    continuation: continuation.timed,
                    clickTrackingParams: '',
                  },
                }
              : {}),
          },
        ],
        actions,
      },
    },
  };
}

export function paidMessageRenderer(
  overrides: Partial<LiveChatPaidMessageRenderer> = {}
): LiveChatPaidMessageRenderer {
  return {
    ...textRenderer(),
    purchaseAmountText: { simpleText: '¥1,000' },
    headerBackgroundColor: 0,
    headerTextColor: 0,
    bodyBackgroundColor: 0xffffca28,
    bodyTextColor: 0,
    authorNameTextColor: 0,
    ...overrides,
  };
}

function rendererWithoutMessage() {
  const renderer = textRenderer();
  delete renderer.message;
  return renderer;
}

export function paidStickerRenderer(
  overrides: Partial<LiveChatPaidStickerRenderer> = {}
): LiveChatPaidStickerRenderer {
  return {
    ...rendererWithoutMessage(),
    purchaseAmountText: { simpleText: '¥90' },
    sticker: {
      thumbnails: [
        { url: '//super.sticker.small' },
        { url: '//super.sticker.url' },
      ],
      accessibility: {
        accessibilityData: { label: 'superSticker' },
      },
    },
    moneyChipBackgroundColor: 0,
    moneyChipTextColor: 0,
    stickerDisplayWidth: 80,
    stickerDisplayHeight: 80,
    backgroundColor: 0xff1565c0,
    authorNameTextColor: 0,
    ...overrides,
  };
}

export function membershipRenderer(
  overrides: Partial<LiveChatMembershipItemRenderer> = {}
): LiveChatMembershipItemRenderer {
  return {
    ...rendererWithoutMessage(),
    headerSubtext: {
      runs: [{ text: 'Welcome to ' }, { text: 'the club!' }],
    },
    authorBadges: [
      {
        liveChatAuthorBadgeRenderer: {
          customThumbnail: {
            thumbnails: [
              { url: 'https://membership.badge.small' },
              { url: 'https://membership.badge.url' },
            ],
          },
          tooltip: 'New member',
          accessibility: {
            accessibilityData: { label: 'New member' },
          },
        },
      },
    ],
    ...overrides,
  };
}

export function sampleChatItem(overrides: Partial<ChatItem> = {}): ChatItem {
  return {
    id: 'msg-1',
    author: {
      name: 'Alice',
      thumbnail: { url: 'https://avatar.example/a.png', alt: 'Alice' },
      channelId: 'UC123',
    },
    message: [{ text: 'Hello World' }],
    isMembership: false,
    isVerified: false,
    isOwner: false,
    isModerator: false,
    timestamp: TIMESTAMP_DATE,
    ...overrides,
  };
}
