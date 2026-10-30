// Public MDNT MRKT CONT newsletter RSS. No private subscriber feeds or tokens.
const RSS_SOURCE = 'https://mdntmrktcont.substack.com/feed';
export default async function handler(request) {
  if (request.method !== 'GET') return new Response('Method not allowed', {status:405,headers:{Allow:'GET'}});
  try {
    const response = await fetch(RSS_SOURCE, {
      headers:{Accept:'application/rss+xml, application/xml, text/xml','User-Agent':'MDNT-MRKT-CONT-Public-Archive/1.0'},
      signal:AbortSignal.timeout(12000)
    });
    if (!response.ok) return new Response('Substack public feed unavailable', {status:502});
    const xml = await response.text();
    if (xml.length > 8000000 || !/<rss\b|<feed\b/i.test(xml)) return new Response('Unexpected RSS response', {status:502});
    return new Response(xml,{status:200,headers:{
      'Content-Type':'application/rss+xml; charset=utf-8',
      'Cache-Control':'public, max-age=300, s-maxage=900',
      'X-Content-Type-Options':'nosniff'
    }});
  } catch (error) {
    console.error('Newsletter RSS unavailable:', String(error));
    return new Response('Could not contact public Substack newsletter feed', {status:502,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }
}