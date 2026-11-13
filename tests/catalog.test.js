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

test('filters by source, date/text query and favorite state without mutating input', () => {
  const videos = parseRawData([
    'SO|2026-11-06 9:06|https://x.com/a/status/12345|https://video.twimg.com/a.mp4||23|42|Blue sky',
    'RW|2026-11-05|https://x.com/b/status/23456|https://video.twimg.com/b.mp4||30|50|Green field'
  ].join('\n'));
  const result = filterVideos(videos, { source: 'SoMay', query: 'blue', favorites: new Set(['https://x.com/a/status/12345']) });
  assert.deepEqual(result.map(video => video.postUrl), ['https://x.com/a/status/12345']);
  assert.equal(videos.length, 2);
});
