export interface LivePageOptions {
  liveId?: string;
  apiKey?: string;
  clientVersion?: string;
  continuation?: string;
  title?: string;
  channelName?: string;
  channelPath?: string;
  isReplay?: boolean;
  omitLiveId?: boolean;
  omitApiKey?: boolean;
  omitClientVersion?: boolean;
  omitContinuation?: boolean;
  omitThumbnail?: boolean;
  omitTitle?: boolean;
  omitChannelOwner?: boolean;
}

export const defaultLivePage = {
  liveId: 'dQw4w9wgGcQ',
  apiKey: 'test-api-key',
  clientVersion: '2.20240801.00.00',
  continuation: 'test-continuation',
  title: 'Test Live Stream',
  channelName: 'sora',
  channelPath: '/@hasakakisora',
} as const;

export function buildLivePageHtml(options: LivePageOptions = {}): string {
  const liveId = options.liveId ?? defaultLivePage.liveId;
  const apiKey = options.apiKey ?? defaultLivePage.apiKey;
  const clientVersion = options.clientVersion ?? defaultLivePage.clientVersion;
  const continuation = options.continuation ?? defaultLivePage.continuation;
  const title = options.title ?? defaultLivePage.title;
  const channelName = options.channelName ?? defaultLivePage.channelName;
  const channelPath = options.channelPath ?? defaultLivePage.channelPath;

  const parts: string[] = [
    '"canonicalBaseUrl":"/watch?v=unrelatedVideo"',
    '"title":{"runs":[{"text":"Wrong Title From Player Microformat"}',
    '"canonicalBaseUrl":"/channel/UC_DECOY_CHANNEL"',
  ];

  if (!options.omitLiveId) {
    parts.push(
      `"originalUrl":"https://www.youtube.com/watch?v\\u003d${liveId}"`
    );
  }

  if (options.isReplay) {
    parts.push('"isReplay": true');
  }

  if (!options.omitApiKey) {
    parts.push(`"INNERTUBE_API_KEY": "${apiKey}"`);
  }

  if (!options.omitClientVersion) {
    parts.push(`"clientVersion":"${clientVersion}","osVersion"`);
  }

  if (!options.omitContinuation) {
    parts.push(`"continuation": "${continuation}"`);
  }

  if (!options.omitThumbnail) {
    parts.push(`'https://i.ytimg.com/vi/${liveId}/hqdefault.jpg')`);
  }

  if (!options.omitTitle) {
    parts.push(
      `{"playerOverlayVideoDetailsRenderer":{"title":{"simpleText":"${title}"},"subtitle":{`
    );
  }

  if (!options.omitChannelOwner) {
    parts.push(
      `"videoOwnerRenderer":{"thumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/photo"}]},"title":{"runs":[{"text":"${channelName}","navigationEndpoint":{"browseEndpoint":{"canonicalBaseUrl":"${channelPath}"}}}]},"navigationEndpoint":{"browseEndpoint":{"canonicalBaseUrl":"${channelPath}"}}}`
    );
  }

  return parts.join('\n');
}
