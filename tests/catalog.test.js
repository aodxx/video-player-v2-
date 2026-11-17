import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('parses the Deepak source code and label for account-owned clips', () => {
  const [video] = parseRawData('DP|2026-11-14 17:51|https://x.com/DeepakC92550200/status/2121632255064105329|https://video.twimg.com/amplify_video/2103773585596973056/vid/avc1/320x568/3E5aGOskoGziR4ti.mp4?tag=14||272|2248|');
  assert.equal(video?.source, 'Deepak');
  assert.equal(video?.sourceLabel, '@DeepakC92550200');
  assert.equal(video?.durationSeconds, 272);
  assert.equal(video?.views, 2248);
});

test('parses the Thanh Do source code and label', () => {
  const [video] = parseRawData('TD|2026-11-14 17:35|https://x.com/thanhDO53161694/status/2121658201376731302|https://video.twimg.com/amplify_video/2120906596079546368/vid/avc1/720x1280/bAAhdFJTafa_8uRP.mp4?tag=29||33|9135|');
  assert.equal(video?.source, 'Thanh Do');
  assert.equal(video?.sourceLabel, '@thanhDO53161694');
  assert.equal(video?.durationSeconds, 33);
  assert.equal(video?.views, 9135);
});

test('parses the Ginan459 source code, label, and thumbnail URL', () => {
  const [video] = parseRawData('GN|2026-11-16|https://x.com/Ginan459/status/2122327578367152302|https://video.twimg.com/amplify_video/2121992780700655617/vid/avc1/960x720/qDYtQXcFaEFrv02N.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2121992780700655617/img/iMILyU5B6yf6hsFE.jpg|2595|781|');
  assert.equal(video?.source, 'Ginan');
  assert.equal(video?.sourceLabel, '@Ginan459');
  assert.equal(video?.thumbnailUrl, 'https://pbs.twimg.com/amplify_video_thumb/2121992780700655617/img/iMILyU5B6yf6hsFE.jpg');
  assert.equal(video?.durationSeconds, 2595);
  assert.equal(video?.views, 781);
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

test('parses the Reno16Promax1 source code and label for account clips', () => {
  const [video] = parseRawData('RP|2026-11-16 15:54|https://x.com/reno16promax1/status/2122357654890889399|https://video.twimg.com/amplify_video/2122143422056423424/vid/avc1/700x1280/ahkf7h8onRvxxS8c.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2122143422056423424/img/PZGFBtfsojdcgNRg.jpg|467|16145|');
  assert.deepEqual(video, {
    source: 'Reno16Promax1', sourceLabel: '@reno16promax1',
    postedAt: '2026-11-16 15:54',
    postUrl: 'https://x.com/reno16promax1/status/2122357654890889399',
    videoUrl: 'https://video.twimg.com/amplify_video/2122143422056423424/vid/avc1/700x1280/ahkf7h8onRvxxS8c.mp4?tag=29',
    thumbnailUrl: 'https://pbs.twimg.com/amplify_video_thumb/2122143422056423424/img/PZGFBtfsojdcgNRg.jpg',
    durationSeconds: 467, views: 16145, text: ''
  });
});

test('parses the Ana Lopez source code and label for account clips', () => {
  const [video] = parseRawData('AL|2026-11-16 22:36|https://x.com/AnaLopez1210921/status/2122470000000000000|https://video.twimg.com/amplify_video/2122470000000000000/vid/avc1/720x1280/test.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2122470000000000000/img/test.jpg|56|9498|sample clip');
  assert.equal(video?.source, 'Ana Lopez');
  assert.equal(video?.sourceLabel, '@AnaLopez1210921');
  assert.equal(video?.durationSeconds, 56);
  assert.equal(video?.views, 9498);
});
test('parses the Jean Lajemo source code and label for account clips', () => {
  const [video] = parseRawData('JL|2026-11-16 22:36|https://x.com/JeanLajemo2/status/2122470000000000000|https://video.twimg.com/amplify_video/2122470000000000000/vid/avc1/720x1280/test.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2122470000000000000/img/test.jpg|56|9498|sample clip');
  assert.equal(video?.source, 'Jean Lajemo');
  assert.equal(video?.sourceLabel, '@JeanLajemo2');
  assert.equal(video?.durationSeconds, 56);
  assert.equal(video?.views, 9498);
});
test('parses the joupze source code and label for account clips', () => {
  const [video] = parseRawData('JP|2026-11-16 22:36|https://x.com/joupze/status/2122470000000000000|https://video.twimg.com/amplify_video/2122470000000000000/vid/avc1/720x1280/test.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2122470000000000000/img/test.jpg|56|9498|sample clip');
  assert.equal(video?.source, 'ลับเด็ด 18+');
  assert.equal(video?.sourceLabel, '@joupze');
  assert.equal(video?.durationSeconds, 56);
  assert.equal(video?.views, 9498);
});
test('parses the Dedprajamsoy source code and label for account clips', () => {
  const [video] = parseRawData('DS|2026-11-16 16:52|https://x.com/dedprajamsoy/status/2122372173998551366|https://video.twimg.com/amplify_video/2122372075952480258/vid/avc1/400x720/c9TaEi7TLifGu3Ci.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2122372075952480258/img/f3vLcdlKJnWV5az3.jpg|410|10897|');
  assert.deepEqual(video, {
    source: 'Dedprajamsoy', sourceLabel: '@dedprajamsoy',
    postedAt: '2026-11-16 16:52',
    postUrl: 'https://x.com/dedprajamsoy/status/2122372173998551366',
    videoUrl: 'https://video.twimg.com/amplify_video/2122372075952480258/vid/avc1/400x720/c9TaEi7TLifGu3Ci.mp4?tag=29',
    thumbnailUrl: 'https://pbs.twimg.com/amplify_video_thumb/2122372075952480258/img/f3vLcdlKJnWV5az3.jpg',
    durationSeconds: 410, views: 10897, text: ''
  });
});

test('summarizes each account once with its label and video count', () => {
  const videos = parseRawData([
    'SO|2026-11-06|https://x.com/a/status/123|https://video.twimg.com/a.mp4||23|42|',
    'RW|2026-11-05|https://x.com/b/status/234|https://video.twimg.com/b.mp4||30|50|',
    'SO|2026-11-04|https://x.com/a/status/345|https://video.twimg.com/c.mp4||31|60|'
  ].join('\n'));

  assert.deepEqual(catalog.summarizeSources(videos), [
    { source: 'SoMay', sourceLabel: 'So_May', accountLabel: '@So_MayBDSM', count: 2 },
    { source: 'Rewaida', sourceLabel: 'Rewaida', accountLabel: '@RewaidaMohamed', count: 1 }
  ]);
});

test('existing duplicate Ginan clips retain their supplied thumbnail URLs', () => {
  const rows = parseRawData(readFileSync(new URL('../data/videos.txt', import.meta.url), 'utf8'));
  const existingPosts = [
    'https://x.com/DeepakC92550200/status/2112892556778537465',
    'https://x.com/Subhash72782123/status/2112928774945935711',
    'https://x.com/DeepakC92550200/status/2112892532107743550',
    'https://x.com/thanhDO53161694/status/2119495536822874342',
    'https://x.com/RewaidaMohamed/status/2117157811302072455',
    'https://x.com/DeepakC92550200/status/2112240359342555190'
  ];
  const videos = rows.filter(video => existingPosts.includes(video.postUrl));

  assert.equal(videos.length, existingPosts.length);
  for (const video of videos) {
    const mediaId = video.videoUrl.match(/amplify_video\/(\d+)\//)?.[1];
    assert.ok(video.thumbnailUrl, `${video.postUrl} should have a thumbnail`);
    assert.ok(video.thumbnailUrl.startsWith('https://pbs.twimg.com/amplify_video_thumb/'));
    assert.ok(video.thumbnailUrl.includes(`/${mediaId}/`) || video.thumbnailUrl.includes(`amplify_video_thumb/${mediaId}/`));
  }
});
