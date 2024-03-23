import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_URL = 'https://www.youtube.com';

const buildYouTubeEndpoint = (req: NextRequest) => {
  const path = req.nextUrl.pathname.replace('/api/yt-api', '');
  const suffix = `${path}${req.nextUrl.search}`;
  const url = `${YOUTUBE_URL}${suffix}`;
  return url;
};

const GET = async (req: NextRequest) => {
  const res = await axios.get(buildYouTubeEndpoint(req));
  return NextResponse.json(res.data, { status: 200 });
};

const POST = async (req: NextRequest) => {
  const postData = await req.json();
  const res = await axios.post(buildYouTubeEndpoint(req), postData);
  return NextResponse.json(res.data, { status: 200 });
};

export { GET, POST };
