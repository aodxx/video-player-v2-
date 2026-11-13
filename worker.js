// Cloudflare Worker สำหรับ Video Player
// ?url=<mp4>            -> ส่งต่อวิดีโอจาก video.twimg.com พร้อมรองรับ HTTP Range/seek
// ?hq=<tweetId>&m=<id>  -> ค้นหาลิงก์ MP4 ความละเอียดสูงของโพสต์และ media ID นั้น
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'Accept-Ranges, Content-Length, Content-Range, Content-Type',
};
const json = (o, ttl = 0) => new Response(JSON.stringify(o), {
  headers: { ...CORS, 'content-type': 'application/json; charset=utf-8', 'cache-control': ttl ? `public, max-age=${ttl}` : 'no-store' }
});
const bad = (message, status = 400) => new Response(message, { status, headers: { ...CORS, 'content-type': 'text/plain; charset=utf-8' } });
const tokenFor = id => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
const resOf = u => { const m = /\/(\d+)x(\d+)\//.exec(u); return m ? +m[1] * +m[2] : 0; };

// Each list represents one video and its available MP4 variants.
async function viaSyndication(id) {
  const r = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${tokenFor(id)}`, {
    headers: { 'user-agent': UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return [];
  const j = await r.json();
  const media = [...(j.mediaDetails || []), ...((j.quoted_tweet && j.quoted_tweet.mediaDetails) || [])];
  return media.map(m => ((m.video_info && m.video_info.variants) || [])
    .filter(v => v.content_type === 'video/mp4' && typeof v.url === 'string')
    .map(v => ({ url: v.url, bitrate: v.bitrate || 0 }))).filter(l => l.length);
}
async function viaFx(id) {
  const r = await fetch(`https://api.fxtwitter.com/status/${id}`, {
    headers: { 'user-agent': UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return [];
  const t = (await r.json()).tweet || {};
  const vids = [...((t.media && t.media.videos) || []), ...((t.quote && t.quote.media && t.quote.media.videos) || [])];
  return vids.map(v => [{ url: v.url, bitrate: (v.height || 0) * 1000 }]).filter(l => l[0].url);
}
async function findHQ(id, mediaId) {
  let lists = [];
  try { lists = await viaSyndication(id); } catch (e) { /* try the secondary provider */ }
  if (!lists.length) { try { lists = await viaFx(id); } catch (e) { /* unavailable */ } }
  if (!lists.length) return null;
  const list = (lists.find(l => mediaId && l.some(v => v.url.includes(mediaId))) || lists[0])
    .slice().sort((a, b) => (b.bitrate - a.bitrate) || (resOf(b.url) - resOf(a.url)));
  const best = list[0];
  const m = /\/(\d+)x(\d+)\//.exec(best.url);
  return { url: best.url, width: m ? +m[1] : 0, height: m ? +m[2] : 0 };
}
function allowedVideoURL(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname === 'video.twimg.com' && !u.username && !u.password;
  } catch { return false; }
}

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') return new Response(null, {
      status: 204,
      headers: {
        ...CORS,
        'access-control-allow-methods': 'GET, HEAD, OPTIONS',
        'access-control-allow-headers': 'Range',
        'access-control-max-age': '86400',
      },
    });
    if (req.method !== 'GET' && req.method !== 'HEAD') return bad('method not allowed', 405);

    const q = new URL(req.url).searchParams;
    const hq = q.get('hq');
    if (hq) {
      if (!/^\d{5,25}$/.test(hq)) return json({ error: 'bad id' });
      const found = await findHQ(hq, q.get('m') || '');
      return found ? json(found, 3600) : json({ error: 'not found' }, 404);
    }

    const target = q.get('url');
    if (!target || !allowedVideoURL(target)) return bad('bad url');
    const headers = new Headers({ 'user-agent': UA });
    const range = req.headers.get('range');
    if (range) headers.set('range', range);

    const upstream = await fetch(target, { method: req.method, headers, redirect: 'follow' });
    const out = new Headers(upstream.headers);
    for (const [key, value] of Object.entries(CORS)) out.set(key, value);
    out.set('access-control-allow-methods', 'GET, HEAD, OPTIONS');
    out.set('access-control-allow-headers', 'Range');
    // Keep upstream status/Content-Range intact (including 206 and 416).
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
  },
};
