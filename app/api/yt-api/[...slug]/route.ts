import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_URL = 'https://www.youtube.com';

const buildYouTubeEndpoint = (req: NextRequest) => {
  const path = req.nextUrl.pathname.replace('/api/yt-api', '');
  const suffix = `${path}${req.nextUrl.search}`;
  const url = `${YOUTUBE_URL}${suffix}`;
  return url;
};

const GET = async (req: NextRequest) => {
  const res = await fetch(buildYouTubeEndpoint(req), { cache: 'no-store' })
    .then((d) => d.text())
    .then((d) => {
      return d;
    })
    .catch((error) => {
      throw new Error(`Server Action Failed: ${error.message}`);
    });
  return NextResponse.json(res, { status: 200 });
};

const POST = async (req: NextRequest) => {
  const postData = await req.json();
  const data = await fetch(buildYouTubeEndpoint(req), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  })
    .then((d) => d.json())
    .catch((error) => {
      throw new Error(`Server Action Failed: ${error.message}`);
    });
  return NextResponse.json(data, { status: 200 });
};

export { GET, POST };
