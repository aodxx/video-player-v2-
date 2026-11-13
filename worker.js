// Cloudflare Worker: ?url=<mp4> proxies Range requests, ?hq=<tweetId>&m=<mediaId> resolves a higher-quality MP4.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const MAX_REDIRECTS = 3;
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'Accept-Ranges, Content-Length, Content-Range, Content-Type',
};
const json = (value, ttl = 0, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { ...CORS, 'content-type': 'application/json; charset=utf-8', 'cache-control': ttl ? `public, max-age=${ttl}` : 'no-store' },
});
const bad = (message, status = 400) => new Response(message, { status, headers: { ...CORS, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
const tokenFor = id => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
const resOf = url => { const match = /\/(\d+)x(\d+)\//.exec(url); return match ? +match[1] * +match[2] : 0; };

async function viaSyndication(id) {
  const response = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${tokenFor(id)}`, {
    headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return [];
  const json = await response.json();
  const media = [...(json.mediaDetails || []), ...((json.quoted_tweet && json.quoted_tweet.mediaDetails) || [])];
  return media.map(item => ((item.video_info && item.video_info.variants) || [])
    .filter(variant => variant.content_type === 'video/mp4' && typeof variant.url === 'string')
    .map(variant => ({ url: variant.url, bitrate: variant.bitrate || 0 }))).filter(list => list.length);
}
async function viaFx(id) {
  const response = await fetch(`https://api.fxtwitter.com/status/${id}`, {
    headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return [];
  const tweet = (await response.json()).tweet || {};
  const videos = [...((tweet.media && tweet.media.videos) || []), ...((tweet.quote && tweet.quote.media && tweet.quote.media.videos) || [])];
  return videos.map(video => [{ url: video.url, bitrate: (video.height || 0) * 1000 }]).filter(list => list[0].url);
}
async function findHQ(id, mediaId) {
  let lists = [];
  try { lists = await viaSyndication(id); } catch { /* try secondary provider */ }
  if (!lists.length) { try { lists = await viaFx(id); } catch { /* upstream unavailable */ } }
  if (!lists.length) return null;
  const variants = (lists.find(list => mediaId && list.some(item => item.url.includes(mediaId))) || lists[0])
    .slice().sort((a, b) => (b.bitrate - a.bitrate) || (resOf(b.url) - resOf(a.url)));
  const best = variants[0];
  const match = /\/(\d+)x(\d+)\//.exec(best.url);
  return { url: best.url, width: match ? +match[1] : 0, height: match ? +match[2] : 0 };
}
function allowedVideoURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'video.twimg.com' && !url.username && !url.password;
  } catch { return false; }
}

async function fetchAllowedVideo(url, method, headers) {
  let target = new URL(url);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(target, { method, headers, redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get('location');
    try { await response.body?.cancel(); } catch { /* redirect body is not needed */ }
    if (!location || hop === MAX_REDIRECTS) return null;
    let next;
    try { next = new URL(location, target); } catch { return null; }
    if (!allowedVideoURL(next.href)) return null;
    target = next;
  }
  return null;
}

export default {
  async fetch(request) {
    const corsHeaders = {
      ...CORS,
      'access-control-allow-methods': 'GET, HEAD, OPTIONS',
      'access-control-allow-headers': 'Range',
      'access-control-max-age': '86400',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'GET' && request.method !== 'HEAD') return bad('method not allowed', 405);

    const query = new URL(request.url).searchParams;
    const highQualityId = query.get('hq');
    if (highQualityId) {
      if (!/^\d{5,25}$/.test(highQualityId)) return json({ error: 'bad id' }, 0, 400);
      const found = await findHQ(highQualityId, query.get('m') || '');
      return found ? json(found, 3600) : json({ error: 'not found' }, 0, 404);
    }

    const target = query.get('url');
    if (!target || !allowedVideoURL(target)) return bad('bad url');
    const headers = new Headers({ 'user-agent': UA });
    const range = request.headers.get('range');
    if (range) headers.set('range', range);

    let upstream;
    try { upstream = await fetchAllowedVideo(target, request.method, headers); }
    catch { return bad('upstream request failed', 502); }
    if (!upstream) return bad('upstream redirect rejected or limit exceeded', 502);

    const responseHeaders = new Headers(upstream.headers);
    for (const [key, value] of Object.entries(corsHeaders)) responseHeaders.set(key, value);
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
  },
};
