// Cloudflare Worker สำหรับ Video Player
//  1) ?url=<mp4>            -> ดึงวิดีโอจาก video.twimg.com ผ่านตัวกลาง (รองรับกรอวิดีโอ)
//  2) ?hq=<tweetId>&m=<id>  -> หาลิงก์ MP4 ความละเอียดสูงสุดของทวีตนั้น (ตอบเป็น JSON)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const CORS = { 'access-control-allow-origin': '*' };
const json = (o, ttl = 0) => new Response(JSON.stringify(o), {
  headers: { ...CORS, 'content-type': 'application/json', 'cache-control': ttl ? `public, max-age=${ttl}` : 'no-store' }
});

const tokenFor = id => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
const resOf = u => { const m = /\/(\d+)x(\d+)\//.exec(u); return m ? +m[1] * +m[2] : 0; };

// คืน array ของ "รายการวิดีโอ" (แต่ละรายการ = หลายความละเอียดของวิดีโอเดียวกัน)
async function viaSyndication(id) {
  const r = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${tokenFor(id)}`,
    { headers: { 'user-agent': UA } });
  if (!r.ok) return [];
  const j = await r.json();
  const media = [...(j.mediaDetails || []), ...((j.quoted_tweet && j.quoted_tweet.mediaDetails) || [])];
  return media.map(m => ((m.video_info && m.video_info.variants) || [])
    .filter(v => v.content_type === 'video/mp4')
    .map(v => ({ url: v.url, bitrate: v.bitrate || 0 }))).filter(l => l.length);
}
async function viaFx(id) {
  const r = await fetch(`https://api.fxtwitter.com/status/${id}`, { headers: { 'user-agent': UA } });
  if (!r.ok) return [];
  const t = (await r.json()).tweet || {};
  const vids = [...((t.media && t.media.videos) || []), ...((t.quote && t.quote.media && t.quote.media.videos) || [])];
  return vids.map(v => [{ url: v.url, bitrate: (v.height || 0) * 1000 }]);
}

async function findHQ(id, mediaId) {
  let lists = [];
  try { lists = await viaSyndication(id); } catch (e) {}
  if (!lists.length) { try { lists = await viaFx(id); } catch (e) {} }
  if (!lists.length) return null;
  let list = lists.find(l => mediaId && l.some(v => v.url.includes(mediaId))) || lists[0];
  list = list.slice().sort((a, b) => (b.bitrate - a.bitrate) || (resOf(b.url) - resOf(a.url)));
  const best = list[0];
  const m = /\/(\d+)x(\d+)\//.exec(best.url);
  return { url: best.url, width: m ? +m[1] : 0, height: m ? +m[2] : 0 };
}

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: { ...CORS, 'access-control-allow-headers': 'range' } });
    const q = new URL(req.url).searchParams;

    const hq = q.get('hq');
    if (hq) {
      if (!/^\d{5,25}$/.test(hq)) return json({ error: 'bad id' });
      const found = await findHQ(hq, q.get('m') || '');
      return found ? json(found, 3600) : json({ error: 'not found' });
    }

    const target = q.get('url');
    if (!target || !/^https:\/\/video\.twimg\.com\//.test(target)) {
      return new Response('bad url', { status: 400, headers: CORS });
    }
    const headers = new Headers({ 'user-agent': UA });
    const range = req.headers.get('range');
    if (range) headers.set('range', range);
    const res = await fetch(target, { headers });
    const out = new Headers(res.headers);
    out.set('access-control-allow-origin', '*');
    return new Response(res.body, { status: res.status, headers: out });
  }
};
