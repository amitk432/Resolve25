import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    return NextResponse.json({ error: 'Unsplash API key is not configured' }, { status: 500 });
  }

  const url = `https://api.unsplash.com/photos/random?query=${query}&client_id=${accessKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ url: data.urls.regular });
    } else {
      return NextResponse.json({ error: data.errors || 'Failed to fetch image from Unsplash' }, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
