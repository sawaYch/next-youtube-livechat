import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useLiveChat from '../src/hooks/useLiveChat';
import {
  fetchChat,
  fetchLivePageByLiveUrl,
} from '../src/libs/youtubeApiRequests';
import { sampleChatItem } from './fixtures/liveChat';
import { renderHook, waitFor } from './renderHook';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock('../src/libs/youtubeApiRequests', () => ({
  fetchLivePageByLiveUrl: vi.fn(),
  fetchChat: vi.fn(),
}));

const fetchLivePageByLiveUrlMock = vi.mocked(fetchLivePageByLiveUrl);
const fetchChatMock = vi.mocked(fetchChat);

const livePageResult = {
  liveId: 'abc123',
  apiKey: 'key',
  clientVersion: '2.0',
  continuation: 'cont-1',
  liveThumbnail: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
  liveTitle: 'My Live',
  channelName: 'Channel',
  channelUrl: 'https://www.youtube.com/@channel',
};

describe('useLiveChat', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    fetchLivePageByLiveUrlMock.mockResolvedValue(livePageResult);
    fetchChatMock.mockResolvedValue([[], 'cont-2']);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not fetch when url is missing', () => {
    const onBeforeStart = vi.fn();
    const onStart = vi.fn();

    renderHook(() =>
      useLiveChat({
        url: undefined,
        isReady: false,
        onBeforeStart,
        onStart,
      })
    );

    expect(onBeforeStart).not.toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
    expect(fetchLivePageByLiveUrlMock).not.toHaveBeenCalled();
  });

  it('loads live details and calls lifecycle callbacks', async () => {
    const onBeforeStart = vi.fn();
    const onStart = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useLiveChat({
        url: 'https://www.youtube.com/watch?v=abc123',
        isReady: false,
        onBeforeStart,
        onStart,
        onError,
      })
    );

    expect(onBeforeStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(fetchLivePageByLiveUrlMock).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=abc123'
    );

    await waitFor(() => {
      expect(result.current.liveDetails).toEqual({
        title: 'My Live',
        thumbnail: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
        channelName: 'Channel',
        channelUrl: 'https://www.youtube.com/@channel',
      });
    });

    expect(onError).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it('calls onError when the live page fetch fails', async () => {
    const error = new Error('Live Stream was not found');
    fetchLivePageByLiveUrlMock.mockRejectedValue(error);
    const onError = vi.fn();

    renderHook(() =>
      useLiveChat({
        url: 'https://www.youtube.com/watch?v=missing',
        isReady: false,
        onError,
      })
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('polls chat, appends items, and reports counts', async () => {
    const onChatItemsReceive = vi.fn();
    const first = sampleChatItem({ id: 'msg-1' });
    const second = sampleChatItem({
      id: 'msg-2',
      message: [{ text: 'Hi' }],
    });
    fetchChatMock
      .mockResolvedValueOnce([[first], 'cont-2'])
      .mockResolvedValueOnce([[second], 'cont-3']);

    const { result } = renderHook(() =>
      useLiveChat({
        url: 'https://www.youtube.com/watch?v=abc123',
        isReady: true,
        onChatItemsReceive,
      })
    );

    await waitFor(() => {
      expect(result.current.liveDetails).toBeDefined();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() => {
      expect(result.current.rawChatItems).toHaveLength(1);
    });

    expect(onChatItemsReceive).toHaveBeenCalledWith([first], []);
    expect(result.current.messages[0]).toMatchObject({
      name: 'Alice',
      avatar: 'https://avatar.example/a.png',
      wordCount: 2,
      characterCount: 11,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() => {
      expect(result.current.rawChatItems).toHaveLength(2);
    });

    expect(onChatItemsReceive).toHaveBeenCalledWith([second], [first]);
    expect(fetchChatMock).toHaveBeenCalledTimes(2);
  });

  it('does not notify when a poll returns no new items', async () => {
    const onChatItemsReceive = vi.fn();
    fetchChatMock.mockResolvedValue([[], 'cont-2']);

    const { result } = renderHook(() =>
      useLiveChat({
        url: 'https://www.youtube.com/watch?v=abc123',
        isReady: true,
        onChatItemsReceive,
      })
    );

    await waitFor(() => {
      expect(result.current.liveDetails).toBeDefined();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(fetchChatMock).toHaveBeenCalled();
    expect(onChatItemsReceive).not.toHaveBeenCalled();
  });

  it('stops polling after unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useLiveChat({
        url: 'https://www.youtube.com/watch?v=abc123',
        isReady: true,
      })
    );

    await waitFor(() => {
      expect(result.current.liveDetails).toBeDefined();
    });

    unmount();
    fetchChatMock.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(fetchChatMock).not.toHaveBeenCalled();
  });

  it('counts emoji-only messages as a single word-sized gap', async () => {
    const emojiItem = sampleChatItem({
      message: [
        {
          url: 'https://emoji.example/smile.png',
          alt: ':smile:',
          isCustomEmoji: true,
          emojiText: ':smile:',
        },
      ],
    });
    fetchChatMock.mockResolvedValue([[emojiItem], 'cont-2']);

    const { result } = renderHook(() =>
      useLiveChat({
        url: 'https://www.youtube.com/watch?v=abc123',
        isReady: true,
      })
    );

    await waitFor(() => {
      expect(result.current.liveDetails).toBeDefined();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    expect(result.current.messages[0]).toMatchObject({
      wordCount: 1,
      characterCount: 1,
    });
  });
});
