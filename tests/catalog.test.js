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

test('parses the MJN96744 source code and account label', () => {
  const [video] = parseRawData('MJ|2026-11-23 09:00|https://x.com/MJN96744/status/2124790184650961276|https://video.twimg.com/amplify_video/2124782800838754304/vid/avc1/360x638/a81TNu09SpsGlfs7.mp4?tag=14|https://pbs.twimg.com/amplify_video_thumb/2124782800838754304/img/2IHsyWJCoeG1KqOP.jpg|106|38507|sample clip');
  assert.equal(video?.source, 'MJN96744');
  assert.equal(video?.sourceLabel, '@MJN96744');
  assert.equal(video?.postUrl, 'https://x.com/MJN96744/status/2124790184650961276');
  assert.equal(video?.durationSeconds, 106);
  assert.equal(video?.views, 38507);
});

test('parses the Yxdkamkhun source code and account label', () => {
  const [video] = parseRawData('YX|2026-11-25 15:18|https://x.com/Yxdkamkhun/status/2125610155442335793|https://video.twimg.com/amplify_video/2069026743168692224/vid/avc1/608x1080/e4H-DFo88DnoKzQg.mp4?tag=28|https://pbs.twimg.com/amplify_video_thumb/2069026743168692224/img/d-qy6r97P810AT0o.jpg|328|1378|ALPHAONE');
  assert.equal(video?.source, 'Yxdkamkhun');
  assert.equal(video?.sourceLabel, '@Yxdkamkhun');
  assert.equal(video?.durationSeconds, 328);
  assert.equal(video?.views, 1378);
  assert.equal(catalog.summarizeSources([video])[0]?.accountLabel, '@Yxdkamkhun');
});

test('parses the Jimwhan01 source code and account label', () => {
  const [video] = parseRawData('JI|2026-11-24 11:19|https://x.com/Jimwhan01/status/2125187549635490098|https://video.twimg.com/amplify_video/2125090047963893760/vid/avc1/478x852/EiZWY2C1POHCtrxw.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2125090047963893760/img/9e3XtuPECMYl5L1O.jpg|1377|4377|sample clip');
  assert.equal(video?.source, 'Jimwhan01');
  assert.equal(video?.sourceLabel, '@Jimwhan01');
  assert.equal(video?.postUrl, 'https://x.com/Jimwhan01/status/2125187549635490098');
});

test('parses the LuangKhoNom source code and account label', () => {
  const [video] = parseRawData('LK|2026-11-24 15:07|https://x.com/LuangKhoNom/status/2125244935645605962|https://video.twimg.com/amplify_video/2124873856053895169/vid/avc1/1280x720/ws3IdOFqwcQ_rept.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2124873856053895169/img/y-rg4JJFR1-3GpVl.jpg|2304|20633|sample clip');
  assert.equal(video?.source, 'LuangKhoNom');
  assert.equal(video?.sourceLabel, '@LuangKhoNom');
  assert.equal(video?.postUrl, 'https://x.com/LuangKhoNom/status/2125244935645605962');
});

test('parses the MdSarfa54717106 source code and account label', () => {
  const [video] = parseRawData('MS|2026-11-22 00:13|https://x.com/MdSarfa54717106/status/2124189513195073623|https://video.twimg.com/amplify_video/1989308362971037696/vid/avc1/852x480/i_98--SwPleqjobW.mp4?tag=21|https://pbs.twimg.com/amplify_video_thumb/1989308362971037696/img/md1Eiv8G77mMbrCJ.jpg|1814|26730|');
  assert.equal(video?.source, 'MdSarfa54717106');
  assert.equal(video?.sourceLabel, '@MdSarfa54717106');
  assert.equal(video?.postUrl.startsWith('https://x.com/MdSarfa54717106/status/'), true);
  assert.ok(video?.durationSeconds > 0);
});

test('parses the fayeol11 source code and account label', () => {
  const [video] = parseRawData('FY|2026-11-24 15:31|https://x.com/fayeol11/status/2125250908414238965|https://video.twimg.com/amplify_video/2125250738339381249/vid/avc1/394x720/vAc5_qqby1n9Va4P.mp4?tag=14|https://pbs.twimg.com/amplify_video_thumb/2125250738339381249/img/t3ZtHeirqIaxkrFg.jpg|395|5112|sample clip');
  assert.equal(video?.source, 'fayeol11');
  assert.equal(video?.sourceLabel, '@fayeol11');
  assert.equal(video?.postUrl, 'https://x.com/fayeol11/status/2125250908414238965');
  assert.equal(video?.durationSeconds, 395);
  assert.equal(video?.views, 5112);
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

test('allows duplicate video URLs only for explicitly exempted sources', () => {
  const raw = [
    'VH|2026-11-06|https://x.com/vhcosmetic/status/111|https://video.twimg.com/repeated.mp4||23|42|',
    'VH|2026-11-06|https://x.com/vhcosmetic/status/222|https://video.twimg.com/repeated.mp4||23|42|',
    'SO|2026-11-06|https://x.com/a/status/333|https://video.twimg.com/checked.mp4||23|42|',
    'SO|2026-11-06|https://x.com/b/status/444|https://video.twimg.com/checked.mp4||23|42|'
  ].join('\n');
  const videos = parseRawData(raw);

  assert.deepEqual(catalog.findDuplicateVideoUrls(videos, { allowDuplicateSources: ['Vhcosmetic'] }), [
    'https://video.twimg.com/checked.mp4'
  ]);
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
test('parses the Hludcaktheph source code and account label', () => {
  const [video] = parseRawData('HL|2026-11-16 13:39|https://x.com/Hludcaktheph/status/2122323720815730822|https://video.twimg.com/amplify_video/2107302819200180224/vid/avc1/540x960/RBCk0PG-7j6kz2Ng.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2107302819200180224/img/U2KM3MbNuB45MwLh.jpg|44|23926|test clip');
  assert.equal(video?.source, 'หลุดจากเทพ 🔱🔞');
  assert.equal(video?.sourceLabel, '@Hludcaktheph');
  assert.equal(video?.durationSeconds, 44);
  assert.equal(video?.views, 23926);
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

test('parses the lxrvip1 source code and account label', () => {
  const [video] = parseRawData('LX|2026-11-16 23:33|https://x.com/lxrvip1/status/2122473229961097553|https://video.twimg.com/amplify_video/2122472681006350336/vid/avc1/1280x720/mM2OMkwU9HRdbRJZ.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2122472681006350336/img/OfqalxqP0grxzbW7.jpg|1354|5534|');
  assert.equal(video?.source, 'Lxrvip1');
  assert.equal(video?.sourceLabel, '@lxrvip1');
  assert.equal(video?.postedAt, '2026-11-16 23:33');
  assert.equal(video?.postUrl, 'https://x.com/lxrvip1/status/2122473229961097553');
  assert.equal(video?.videoUrl, 'https://video.twimg.com/amplify_video/2122472681006350336/vid/avc1/1280x720/mM2OMkwU9HRdbRJZ.mp4?tag=29');
  assert.equal(video?.durationSeconds, 1354);
  assert.equal(video?.views, 5534);
});

test('parses the Kaled46164207 source code and account label', () => {
  const [video] = parseRawData('KA|2026-11-17 16:38|https://x.com/Kaled46164207/status/2122731098677608733|https://video.twimg.com/amplify_video/2122723218016641024/vid/avc1/1080x1920/63lhFosR_IpK38HM.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2122723218016641024/img/uyP7OmV6thvBVmCT.jpg|462|7543|clip');
  assert.equal(video?.source, 'Kaled46164207');
  assert.equal(video?.sourceLabel, '@Kaled46164207');
  assert.equal(video?.views, 7543);
});

test('parses the Charles74943343 source code and account label', () => {
  const [video] = parseRawData('CH|2026-10-30 16:25|https://x.com/Charles74943343/status/2116204857946448179|https://video.twimg.com/amplify_video/2105166059968008192/vid/avc1/720x1280/4JBicdiMmDcXh9EL.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2105166059968008192/img/POXAIE15kORhKCIF.jpg|2255|64952|clip');
  assert.equal(video?.source, 'Charles74943343');
  assert.equal(video?.sourceLabel, '@Charles74943343');
  assert.equal(video?.durationSeconds, 2255);
});

test('parses the porpine3344 source code and account label', () => {
  const [video] = parseRawData('PP|2026-11-17 17:46|https://x.com/porpine3344/status/2122748228781396165|https://video.twimg.com/amplify_video/2121972737644101632/vid/avc1/720x960/Nudadv6VZnbZjMy8.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2121972737644101632/img/ZCznuz_gdT5oitaK.jpg|1537|2566|clip');
  assert.equal(video?.source, 'porpine3344');
  assert.equal(video?.sourceLabel, '@porpine3344');
  assert.equal(video?.views, 2566);
});

test('parses the mariana20845787 source code and account label', () => {
  const [video] = parseRawData('AA|2026-11-17 09:56|https://x.com/mariana20845787/status/2122630027519176803|https://video.twimg.com/amplify_video/2122606843017191424/vid/avc1/1280x720/mUIWscdU8bZ6QT25.mp4?tag=14|https://pbs.twimg.com/amplify_video_thumb/2122606843017191424/img/yDx0_peWZipvsVQr.jpg|596|15698|sample clip');
  assert.equal(video?.source, 'ชอบแบบนี้');
  assert.equal(video?.sourceLabel, '@mariana20845787');
  assert.equal(video?.postedAt, '2026-11-17 09:56');
  assert.equal(video?.durationSeconds, 596);
  assert.equal(video?.views, 15698);
});

test('parses and summarizes the Songruhee23 and AmySchkade sources', () => {
  const videos = parseRawData([
    'SR|2026-11-21|https://x.com/Songruhee23/status/987654321|https://video.twimg.com/test-songruhee.mp4||30|120|',
    'AM|2026-11-20|https://x.com/AmySchkade/status/987654322|https://video.twimg.com/test-amyschkade.mp4||45|240|'
  ].join('\n'));

  assert.deepEqual(videos.map(({ source, sourceLabel }) => ({ source, sourceLabel })), [
    { source: 'Songruhee23', sourceLabel: '@Songruhee23' },
    { source: 'AmySchkade', sourceLabel: '@AmySchkade' }
  ]);
  assert.deepEqual(catalog.summarizeSources(videos).map(({ source, accountLabel, count }) => ({ source, accountLabel, count })), [
    { source: 'Songruhee23', accountLabel: '@Songruhee23', count: 1 },
    { source: 'AmySchkade', accountLabel: '@AmySchkade', count: 1 }
  ]);
});

test('parses the Goodwork56 source code and account label', () => {
  const [video] = parseRawData('GW|2026-11-22 09:34|https://x.com/goodwork56/status/2124436384358519045|https://video.twimg.com/amplify_video/2124435977276178432/vid/avc1/862x1920/hyR4EqmFKzXqkHdn.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2124435977276178432/img/FGHEbm-AiUlETJm-.jpg|432|6053|sample clip');
  assert.equal(video?.source, 'Goodwork56');
  assert.equal(video?.sourceLabel, '@goodwork56');
  assert.equal(video?.durationSeconds, 432);
  assert.equal(video?.views, 6053);
});

test('parses Thephphraceaca source code and account label', () => {
  const [video] = parseRawData('TP|2026-11-22 15:16|https://x.com/Thephphraceaca/status/2124522408866668821|https://video.twimg.com/amplify_video/2117532897246851072/vid/avc1/464x848/6ZUaSTc2lg1d0yPo.mp4?tag=14|https://pbs.twimg.com/amplify_video_thumb/2117532897246851072/img/F-M3_Vhr-NgWz1Hd.jpg|44|11513|RT sample');
  assert.equal(video?.source, 'Thephphraceaca');
  assert.equal(video?.sourceLabel, '@Thephphraceaca');
  assert.equal(video?.durationSeconds, 44);
  assert.equal(video?.views, 11513);
});

test('parses the Mnnnnnnnnnn20 source code and account label', () => {
  const [video] = parseRawData('MN|2026-11-22 16:07|https://x.com/Mnnnnnnnnnn20/status/2124535163732586696|https://video.twimg.com/amplify_video/2124191606249295872/vid/avc1/540x960/LjrUc8c2g6hmIWKP.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2124191606249295872/img/fOWhVmNDOjhlfnY_.jpg|84|19852|sample clip');
  assert.equal(video?.source, 'Mnnnnnnnnnn20');
  assert.equal(video?.sourceLabel, '@Mnnnnnnnnnn20');
  assert.equal(video?.durationSeconds, 84);
  assert.equal(video?.views, 19852);
});

test('parses the yes_mailueK source code and account label', () => {
  const [video] = parseRawData('YM|2026-11-22 18:43|https://x.com/yes_mailueK/status/2124574405963710526|https://video.twimg.com/amplify_video/2124574331414175744/vid/avc1/438x782/0C8twZDkDP5PxLN0.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2124574331414175744/img/vxnzjpwa1nT-9sxr.jpg|93|1253|sample clip');
  assert.equal(video?.source, 'Yes‼️ไม่เลือกหน้า');
  assert.equal(video?.sourceLabel, '@yes_mailueK');
  assert.equal(video?.durationSeconds, 93);
  assert.equal(video?.views, 1253);
});

test('parses the Gamemint4210 source code and account label with blank text', () => {
  const [video] = parseRawData('GM|2026-11-22 14:58|https://x.com/Gamemint4210/status/2124517760973836756|https://video.twimg.com/amplify_video/2124517685581275136/vid/avc1/960x530/z-isY-8ydFNn1s1G.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2124517685581275136/img/avKwcNOXpUr_xyHP.jpg|120|1085|');
  assert.equal(video?.source, 'Gamemint4210');
  assert.equal(video?.sourceLabel, '@Gamemint4210');
  assert.equal(video?.postedAt, '2026-11-22 14:58');
  assert.equal(video?.text, '');
  assert.equal(catalog.summarizeSources([video])[0]?.accountLabel, '@Gamemint4210');
});

test('parses the vhcosmetic source code, account label, and pipe-delimited timeline text', () => {
  const [video] = parseRawData('VH|2026-11-22 20:07|https://x.com/vhcosmetic/status/2124595726168756588|https://video.twimg.com/amplify_video/2124094393523306496/vid/avc1/720x1280/bleZbicVZTTHsJYk.mp4?tag=29|https://pbs.twimg.com/amplify_video_thumb/2124094393523306496/img/jM4Qu5U3EuIfvkYg.jpg|324|11803|timeline clip|with a pipe');
  assert.equal(video?.source, 'Vhcosmetic');
  assert.equal(video?.sourceLabel, '@vhcosmetic');
  assert.equal(video?.views, 11803);
  assert.equal(video?.text, 'timeline clip|with a pipe');
  assert.equal(catalog.summarizeSources([video])[0]?.accountLabel, '@vhcosmetic');
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
