/** Thanks https://github.com/LinaTsukusu/youtube-chat */
import { ChatItem, YoutubeId } from '../types/youtubeData';
import { FetchOptions } from '../types/youtubeResponse';
import { getOptionsFromLivePage, parseChatData } from './youtubeApiParser';

export async function fetchChat(
  options: FetchOptions
): Promise<[ChatItem[], string]> {
  const url = `/api/yt-api/youtubei/v1/live_chat/get_live_chat?key=${options.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      context: {
        client: {
          clientVersion: options.clientVersion,
          clientName: 'WEB',
        },
      },
      continuation: options.continuation,
    }),
  });
  const data = await res.json();
  return parseChatData(data);
}

export async function fetchLivePageByLiveUrl(liveUrl: string) {
  if (liveUrl.length === 0) {
    throw TypeError('Invalid liveUrl');
  }
  const convertedLiveUrl = liveUrl.replace(
    'https://www.youtube.com',
    '/api/yt-api'
  );
  const res = await fetch(convertedLiveUrl);
  const data = await res.json();
  return getOptionsFromLivePage(data.toString());
}

export async function fetchLivePage(
  id: { channelId: string } | { liveId: string } | { handle: string }
) {
  const url = generateLiveUrl(id);
  if (!url) {
    throw TypeError('not found id');
  }
  const res = await fetch(url);
  const data = await res.json();
  return getOptionsFromLivePage(data.toString());
}

function generateLiveUrl(id: YoutubeId) {
  if ('channelId' in id) {
    return `/api/yt-api/channel/${id.channelId}/live`;
  } else if ('liveId' in id) {
    return `/api/yt-api/watch?v=${id.liveId}`;
  } else if ('handle' in id) {
    let handle = id.handle;
    if (!handle.startsWith('@')) {
      handle = '@' + handle;
    }
    return `/api/yt-api/${handle}/live`;
  }
  return '';
}
