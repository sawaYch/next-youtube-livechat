/** Thanks https://github.com/LinaTsukusu/youtube-chat */
import axios from 'axios';

import { ChatItem, YoutubeId } from '../types/yt-data';
import { FetchOptions } from '../types/yt-response';
import { getOptionsFromLivePage, parseChatData } from './yt-api-parser';

export async function fetchChat(
  options: FetchOptions
): Promise<[ChatItem[], string]> {
  const url = `/api/yt-api/youtubei/v1/live_chat/get_live_chat?key=${options.apiKey}`;
  const res = await axios.post(url, {
    context: {
      client: {
        clientVersion: options.clientVersion,
        clientName: 'WEB',
      },
    },
    continuation: options.continuation,
  });
  return parseChatData(res.data);
}

export async function fetchLivePageByLiveUrl(liveUrl: string) {
  if (liveUrl.length === 0) {
    throw TypeError('Invalid liveUrl');
  }
  const convertedLiveUrl = liveUrl.replace(
    'https://www.youtube.com',
    '/api/yt-api'
  );
  const res = await axios.get(convertedLiveUrl);
  return getOptionsFromLivePage(res.data.toString());
}

export async function fetchLivePage(
  id: { channelId: string } | { liveId: string } | { handle: string }
) {
  const url = generateLiveUrl(id);
  if (!url) {
    throw TypeError('not found id');
  }
  const res = await axios.get(url);
  return getOptionsFromLivePage(res.data.toString());
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
