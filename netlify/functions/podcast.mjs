// The same-origin feed proxy. A browser cannot reliably request Substack RSS
// directly because the server may not allow cross-origin reads.
const PUBLIC_PODCAST_FEED = 'https://api.substack.com/feed/podcast/7894037.rss';

export default async function handler(request) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {status: 405, headers: {'Allow': 'GET'}});
  }
  try {
    const upstream = await fetch(PUBLIC_PODCAST_FEED, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'MDNT-MRKT-VOX-Podcast-Site/1.0'
      },
      signal: AbortSignal.timeout(12000)
    });
    if (!upstream.ok) {
      return new Response('The public podcast feed is temporarily unavailable.', {
        status: 502,
        headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'}
      });
    }
    const xml = await upstream.text();
    if (xml.length > 8_000_000 || !/<rss\b|<feed\b/i.test(xml)) {
      return new Response('Unexpected public feed response.', {status:502});
    }
    return new Response(xml, {
      status:200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=900',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('VOX RSS relay error:', error?.message || error);
    return new Response('Could not contact the public podcast feed.', {
      status:502,
      headers: {'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}
    });
  }
}
