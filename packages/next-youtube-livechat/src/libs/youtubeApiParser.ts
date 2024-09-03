/** Thanks https://github.com/LinaTsukusu/youtube-chat */
import { ChatItem, ImageItem, MessageItem } from '../types/youtubeData';
import {
  Action,
  FetchOptions,
  GetLiveChatResponse,
  LiveChatMembershipItemRenderer,
  LiveChatPaidMessageRenderer,
  LiveChatPaidStickerRenderer,
  LiveChatTextMessageRenderer,
  MessageRun,
  Thumbnail,
} from '../types/youtubeResponse';

export function getOptionsFromLivePage(
  data: string
): FetchOptions & { liveId: string } {
  let liveId: string;
  const idResult = data.match(
    /"originalUrl":"https:\/\/www.youtube.com\/watch\?v\\u003d(.+?)"/
  );
  console.log(idResult);
  if (idResult) {
    liveId = idResult[0]
      .replace('"originalUrl":"https://www.youtube.com/watch?v\\u003d', '')
      .replace('"', '');
  } else {
    throw new Error('Live Stream was not found');
  }

  const replayResult = data.match(/['"]isReplay['"]:\s*(true)/);
  if (replayResult) {
    throw new Error(`${liveId} is finished live`);
  }

  let apiKey: string;
  const keyResult = data.match(/['"]INNERTUBE_API_KEY['"]:\s*['"](.+?)['"]/);
  if (keyResult) {
    apiKey = keyResult[1];
  } else {
    throw new Error('API Key was not found');
  }

  let clientVersion: string;
  const verResult = data.match(
    /['"]clientVersion['"]:['"].*['"],['"]osVersion['"]/
  );
  if (verResult) {
    clientVersion = verResult[0]
      .replace('"clientVersion":"', '')
      .replace('","osVersion"', '');
  } else {
    console.error('Client Version was not found', data);
    throw new Error('Client Version was not found');
  }

  let continuation: string;
  const continuationResult = data.match(
    /['"]continuation['"]:\s*['"](.+?)['"]/
  );
  if (continuationResult) {
    continuation = continuationResult[1];
  } else {
    //- 24-Aug-2024: if live stream is finished, continuation is not found.
    throw new Error(
      'Continuation was not found. Probably live stream is finished.'
    );
  }

  let liveThumbnail: string;
  const liveThumbnailResult = data.match(
    /'https:\/\/i.ytimg.com\/vi\/[^\s]+\/hqdefault.jpg'\)/
  );
  if (liveThumbnailResult) {
    liveThumbnail = liveThumbnailResult[0];
    let lastIndex = liveThumbnail.lastIndexOf("')");
    if (lastIndex !== -1) {
      liveThumbnail =
        liveThumbnail.substring(0, lastIndex) +
        liveThumbnail.substring(lastIndex + 2);
    }
    const res = liveThumbnail.match(/https?:\/\/[^\s">]+/)?.[0];
    if (res == null) {
      throw new Error('Live Thumbnail image url parse error');
    }
    liveThumbnail = res;
  } else {
    throw new Error('Live Thumbnail was not found');
  }

  let liveTitle: string;
  const liveTitleResult = data.match(
    /{"playerOverlayVideoDetailsRenderer":{"title":{"simpleText":"[\s\S]*"},"subtitle":{/
  );
  console.log('liveTitleResult', liveTitleResult);
  if (liveTitleResult) {
    liveTitle = liveTitleResult[0]
      .replace(
        '{"playerOverlayVideoDetailsRenderer":{"title":{"simpleText":"',
        ''
      )
      .replace('"},"subtitle":{', '');
  } else {
    throw new Error('Live Title was not found');
  }

  let channelName: string;
  const channelNameResult = data.match(
    /"videoDescriptionInfocardsSectionRenderer":{"sectionTitle":{"simpleText":".*"},"creatorVideosButton"/
  );
  console.log('channelNameResult', channelNameResult);
  if (channelNameResult) {
    channelName = channelNameResult[0]
      .replace(
        '"videoDescriptionInfocardsSectionRenderer":{"sectionTitle":{"simpleText":"',
        ''
      )
      .replace('"},"creatorVideosButton"', '');
  } else {
    // throw new Error('Channel Name was not found');
    channelName = '???'; // FIXME
  }

  let channelUrl: string = 'https://www.youtube.com/';
  const channelUrlResult = data.match(
    /"canonicalBaseUrl":"\/@.*"}}}]},"subscriptionButton":{"type":"FREE"},/
  );
  console.log('channelUrlResult', channelUrlResult);

  if (channelUrlResult) {
    const channelAtId = channelUrlResult[0]
      .replace('"canonicalBaseUrl":"/', '')
      .replace('"}}}]},"subscriptionButton":{"type":"FREE"},', '');
    channelUrl += channelAtId;
  } else {
    // throw new Error('Channel Url was not found');
    channelUrl = '???'; // FIXME
  }

  return {
    liveId,
    apiKey,
    clientVersion,
    continuation,
    liveThumbnail,
    liveTitle,
    channelName,
    channelUrl,
  };
}

/** get_live_chat レスポンスを変換 */
export function parseChatData(data: GetLiveChatResponse): [ChatItem[], string] {
  let chatItems: ChatItem[] = [];
  if (data.continuationContents.liveChatContinuation.actions) {
    chatItems = data.continuationContents.liveChatContinuation.actions
      .map((v) => parseActionToChatItem(v))
      .filter((v): v is NonNullable<ChatItem> => v !== null);
  }

  const continuationData =
    data.continuationContents.liveChatContinuation.continuations[0];
  let continuation = '';
  if (continuationData.invalidationContinuationData) {
    continuation = continuationData.invalidationContinuationData.continuation;
  } else if (continuationData.timedContinuationData) {
    continuation = continuationData.timedContinuationData.continuation;
  }

  return [chatItems, continuation];
}

/** サムネイルオブジェクトをImageItemへ変換 */
function parseThumbnailToImageItem(data: Thumbnail[], alt: string): ImageItem {
  const thumbnail = data.pop();
  if (thumbnail) {
    return {
      url: thumbnail.url,
      alt: alt,
    };
  } else {
    return {
      url: '',
      alt: '',
    };
  }
}

function convertColorToHex6(colorNum: number) {
  return `#${colorNum.toString(16).slice(2).toLocaleUpperCase()}`;
}

/** メッセージrun配列をMessageItem配列へ変換 */
function parseMessages(runs: MessageRun[]): MessageItem[] {
  return runs.map((run: MessageRun): MessageItem => {
    if ('text' in run) {
      return run;
    } else {
      // Emoji
      const thumbnail = run.emoji.image.thumbnails.shift();
      const isCustomEmoji = Boolean(run.emoji.isCustomEmoji);
      const shortcut = run.emoji.shortcuts ? run.emoji.shortcuts[0] : '';
      return {
        url: thumbnail ? thumbnail.url : '',
        alt: shortcut,
        isCustomEmoji: isCustomEmoji,
        emojiText: isCustomEmoji ? shortcut : run.emoji.emojiId,
      };
    }
  });
}

/** actionの種類を判別してRendererを返す */
function rendererFromAction(
  action: Action
):
  | LiveChatTextMessageRenderer
  | LiveChatPaidMessageRenderer
  | LiveChatPaidStickerRenderer
  | LiveChatMembershipItemRenderer
  | null {
  if (!action.addChatItemAction) {
    return null;
  }
  const item = action.addChatItemAction.item;
  if (item.liveChatTextMessageRenderer) {
    return item.liveChatTextMessageRenderer;
  } else if (item.liveChatPaidMessageRenderer) {
    return item.liveChatPaidMessageRenderer;
  } else if (item.liveChatPaidStickerRenderer) {
    return item.liveChatPaidStickerRenderer;
  } else if (item.liveChatMembershipItemRenderer) {
    return item.liveChatMembershipItemRenderer;
  }
  return null;
}

/** an action to a ChatItem */
function parseActionToChatItem(data: Action): ChatItem | null {
  const messageRenderer = rendererFromAction(data);
  if (messageRenderer === null) {
    return null;
  }
  let message: MessageRun[] = [];
  if ('message' in messageRenderer) {
    message = messageRenderer.message.runs;
  } else if ('headerSubtext' in messageRenderer) {
    message = messageRenderer.headerSubtext.runs;
  }

  const authorNameText = messageRenderer.authorName?.simpleText ?? '';
  const ret: ChatItem = {
    id: messageRenderer.id,
    author: {
      name: authorNameText,
      thumbnail: parseThumbnailToImageItem(
        messageRenderer.authorPhoto.thumbnails,
        authorNameText
      ),
      channelId: messageRenderer.authorExternalChannelId,
    },
    message: parseMessages(message),
    isMembership: false,
    isOwner: false,
    isVerified: false,
    isModerator: false,
    timestamp: new Date(Number(messageRenderer.timestampUsec) / 1000),
  };

  if (messageRenderer.authorBadges) {
    for (const entry of messageRenderer.authorBadges) {
      const badge = entry.liveChatAuthorBadgeRenderer;
      if (badge.customThumbnail) {
        ret.author.badge = {
          thumbnail: parseThumbnailToImageItem(
            badge.customThumbnail.thumbnails,
            badge.tooltip
          ),
          label: badge.tooltip,
        };
        ret.isMembership = true;
      } else {
        switch (badge.icon?.iconType) {
          case 'OWNER':
            ret.isOwner = true;
            break;
          case 'VERIFIED':
            ret.isVerified = true;
            break;
          case 'MODERATOR':
            ret.isModerator = true;
            break;
        }
      }
    }
  }

  if ('sticker' in messageRenderer) {
    ret.superchat = {
      amount: messageRenderer.purchaseAmountText.simpleText,
      color: convertColorToHex6(messageRenderer.backgroundColor),
      sticker: parseThumbnailToImageItem(
        messageRenderer.sticker.thumbnails,
        messageRenderer.sticker.accessibility.accessibilityData.label
      ),
    };
  } else if ('purchaseAmountText' in messageRenderer) {
    ret.superchat = {
      amount: messageRenderer.purchaseAmountText.simpleText,
      color: convertColorToHex6(messageRenderer.bodyBackgroundColor),
    };
  }

  return ret;
}
