import test from 'node:test';
import assert from 'node:assert/strict';
import * as catalog from '../src/catalog.js';

const { parseRawData, filterVideos } = catalog;

test('parses pipe-delimited rows and preserves text containing pipes', () => {
  const [video] = parseRawData('SO|2026-11-06 9:06|https://x.com/a/status/12345|https://video.twimg.com/a.mp4|https://pbs.twimg.com/a.jpg|23|42|hello|world');
  assert.equal(video.source, 'SoMay');
  assert.equal(video.text, 'hello|world');
  assert.equal(video.durationSeconds, 23);
  assert.equal(video.views, 42);
});

test('parses the Rabbit Rayong source code from imported catalogue rows', () => {
  const [video] = parseRawData('CX|2026-11-11 13:39|https://x.com/CxllmeB64/status/2120511724931719298|https://video.twimg.com/amplify_video/2120510632365854720/vid/avc1/480x270/hcTEFT1RhwLiYY2H.mp4?tag=29||119|23768|');
  assert.equal(video?.source, 'Rabbit Rayong');
  assert.equal(video?.sourceLabel, '@CxllmeB64');
  assert.equal(video?.views, 23768);
});

test('parses the Subhash source code and label from imported catalogue rows', () => {
  const [video] = parseRawData('SU|2026-11-13 15:57|https://x.com/Subhash72782123/status/2121271208033591401|https://video.twimg.com/amplify_video/2120417636249153536/vid/avc1/480x270/K7b2w9FSs-5PranK.mp4?tag=14||596|3816|sample clip');
  assert.equal(video?.source, 'Subhash');
  assert.equal(video?.sourceLabel, '@Subhash72782123');
  assert.equal(video?.durationSeconds, 596);
});

test('parses the Lietongheng source code and label for account-owned clips', () => {
  const [video] = parseRawData('LT|2026-02-12 17:05|https://x.com/lietongheng/status/2021994157494124669|https://video.twimg.com/amplify_video/2021994068562391042/vid/avc1/720x1028/t1gbZoS0EpyUcW6g.mp4?tag=14||228|64190|sample clip');
  assert.equal(video?.source, 'Lietongheng');
  assert.equal(video?.sourceLabel, '@lietongheng');
  assert.equal(video?.durationSeconds, 228);
  assert.equal(video?.views, 64190);
});

test('parses the NNNKII88 source code and label', () => {
  const [video] = parseRawData('NK|2026-11-13 3:23|https://x.com/NNNKII88/status/2121081588138287157|https://video.twimg.com/amplify_video/2121081490293587968/vid/avc1/720x1246/dDCEBGKc9pCX-SY0.mp4?tag=14||293|41758|');
  assert.equal(video?.source, 'NNNKII88');
  assert.equal(video?.sourceLabel, '@NNNKII88');
  assert.equal(video?.durationSeconds, 293);
  assert.equal(video?.views, 41758);
});

test('duplicate validation keys videos by media URL, not post URL', () => {
  assert.equal(typeof catalog.findDuplicateVideoUrls, 'function');
  if (typeof catalog.findDuplicateVideoUrls !== 'function') return;
  const raw = [
    'SO|2026-11-06|https://x.com/a/status/12345|https://video.twimg.com/a.mp4||23|42|',
    'SO|2026-11-06|https://x.com/a/status/12345|https://video.twimg.com/b.mp4||24|43|',
    'SO|2026-11-06|https://x.com/b/status/23456|https://video.twimg.com/a.mp4||25|44|'
  ].join('\n');
  const duplicates = catalog.findDuplicateVideoUrls(parseRawData(raw));
  assert.deepEqual(duplicates, ['https://video.twimg.com/a.mp4']);
});

test('rejects malformed rows and non-HTTPS media URLs', () => {
  assert.deepEqual(parseRawData([
    'SO|2026-11-06|https://x.com/a/status/12345|http://video.twimg.com/a.mp4||20|30|',
    'BAD|2026-11-06|https://x.com/a/status/23456|https://video.twimg.com/b.mp4||20|30|'
  ].join('\n')), []);
});

test('rejects prototype-key source codes and invalid calendar dates', () => {
  const rows = [
    'toString|2026-11-06|https://x.com/a/status/12345|https://video.twimg.com/a.mp4||20|30|',
    'SO|2026-19-44|https://x.com/a/status/12345|https://video.twimg.com/a.mp4||20|30|'
  ];
  assert.deepEqual(parseRawData(rows.join('\n')), []);
});

test('playlist includes all items beyond 200 and preserves original indices', () => {
  assert.equal(typeof catalog.filterPlaylistItems, 'function');
  if (typeof catalog.filterPlaylistItems !== 'function') return;
  const videos = Array.from({ length: 350 }, (_, index) => ({
    sourceLabel: `@source${index}`,
    postedAt: '2026-11-14 09:00',
    text: `clip ${index}`,
    postUrl: `https://x.com/a/status/${10000 + index}`,
    views: index,
    durationSeconds: 60
  }));
  const items = catalog.filterPlaylistItems(videos);
  assert.equal(items.length, 350);
  assert.equal(items[0].index, 0);
  assert.equal(items[349].index, 349);
  assert.strictEqual(items[349].video, videos[349]);
});

test('playlist search matches case-insensitive metadata and retains the original index', () => {
  assert.equal(typeof catalog.filterPlaylistItems, 'function');
  if (typeof catalog.filterPlaylistItems !== 'function') return;
  const videos = [
    { sourceLabel: '@So_MayBDSM', postedAt: '2026-11-14 09:00', text: 'sunset', postUrl: 'https://x.com/a/status/123', views: 10, durationSeconds: 60 },
    { sourceLabel: '@CxllmeB64', postedAt: '2026-11-11 13:39', text: '', postUrl: 'https://x.com/CxllmeB64/status/2120511724931719298', views: 23768, durationSeconds: 119 }
  ];
  const result = catalog.filterPlaylistItems(videos, '  CXLLMEB64  ');
  assert.deepEqual(result, [{ video: videos[1], index: 1 }]);
});

test('filters by source, date/text query and favorite state without mutating input', () => {
  const videos = parseRawData([
    'SO|2026-11-06 9:06|https://x.com/a/status/12345|https://video.twimg.com/a.mp4||23|42|Blue sky',
    'RW|2026-11-05|https://x.com/b/status/23456|https://video.twimg.com/b.mp4||30|50|Green field'
  ].join('\n'));
  const result = filterVideos(videos, { source: 'SoMay', query: 'blue', favorites: new Set(['https://x.com/a/status/12345']) });
  assert.deepEqual(result.map(video => video.postUrl), ['https://x.com/a/status/12345']);
  assert.equal(videos.length, 2);
});
