import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchChat,
  fetchLivePage,
  fetchLivePageByLiveUrl,
} from '../src/libs/youtubeApiRequests';
import { FetchOptions } from '../src/types/youtubeResponse';
import {
  addChatItemAction,
  chatResponse,
  textRenderer,
} from './fixtures/liveChat';
import { buildLivePageHtml, defaultLivePage } from './fixtures/livePage';

const livePage = buildLivePageHtml();

function jsonResponse(data: unknown) {
  return {
    json: async () => data,
  };
}

describe('youtubeApiRequests', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('fetchLivePageByLiveUrl', () => {
    it('throws when liveUrl is empty', async () => {
      await expect(fetchLivePageByLiveUrl('')).rejects.toThrow(
        TypeError('Invalid liveUrl')
      );
    });

    it('rewrites the YouTube URL through the CORS proxy and parses the page', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(livePage));
      vi.stubGlobal('fetch', fetchMock);

      const options = await fetchLivePageByLiveUrl(
        `https://www.youtube.com/watch?v=${defaultLivePage.liveId}`
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `/api/yt-api/watch?v=${defaultLivePage.liveId}`
      );
      expect(options.liveId).toBe(defaultLivePage.liveId);
      expect(options.apiKey).toBe(defaultLivePage.apiKey);
      expect(options.channelUrl).toBe(
        `https://www.youtube.com${defaultLivePage.channelPath}`
      );
    });
  });

  describe('fetchLivePage', () => {
    it.each([
      [{ channelId: 'UCabc' }, '/api/yt-api/channel/UCabc/live'],
      [
        { liveId: defaultLivePage.liveId },
        `/api/yt-api/watch?v=${defaultLivePage.liveId}`,
      ],
      [{ handle: 'hasakakisora' }, '/api/yt-api/@hasakakisora/live'],
      [{ handle: '@hasakakisora' }, '/api/yt-api/@hasakakisora/live'],
    ] as const)('fetches %j from %s', async (id, expectedUrl) => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(livePage));
      vi.stubGlobal('fetch', fetchMock);

      await fetchLivePage(id);

      expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('fetchChat', () => {
    it('posts the inner tube payload and returns parsed chat items', async () => {
      const options: FetchOptions = {
        apiKey: 'test-api-key',
        clientVersion: '2.20240801.00.00',
        continuation: 'cont-0',
        liveThumbnail: 'https://i.ytimg.com/vi/id/hqdefault.jpg',
        liveTitle: 'Test Live Stream',
        channelName: defaultLivePage.channelName,
        channelUrl: `https://www.youtube.com${defaultLivePage.channelPath}`,
      };
      const payload = chatResponse([
        addChatItemAction({
          liveChatTextMessageRenderer: textRenderer(),
        }),
      ]);
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(payload));
      vi.stubGlobal('fetch', fetchMock);

      const [chatItems, continuation] = await fetchChat(options);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/yt-api/youtubei/v1/live_chat/get_live_chat?key=test-api-key',
        {
          method: 'POST',
          body: JSON.stringify({
            context: {
              client: {
                clientVersion: options.clientVersion,
                clientName: 'WEB',
              },
            },
            continuation: 'cont-0',
          }),
        }
      );
      expect(chatItems).toHaveLength(1);
      expect(chatItems[0]?.message).toEqual([{ text: 'Hello, World!' }]);
      expect(continuation).toBe('test-continuation:01');
    });
  });
});
