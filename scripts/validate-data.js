import { readFile } from 'node:fs/promises';
import { findDuplicateVideoUrls, parseRawData } from '../src/catalog.js';

const raw = await readFile(new URL('../data/videos.txt', import.meta.url), 'utf8');
const rows = raw.split(/\r?\n/).filter(line => line.trim());
const videos = parseRawData(raw);
const duplicates = findDuplicateVideoUrls(videos);
const rejected = rows.length - videos.length;
if (rejected || duplicates.length) {
  console.error(`ข้อมูลไม่ผ่าน: ${rejected} แถวผิดรูปแบบ, ${duplicates.length} รายการซ้ำ`);
  if (duplicates.length) console.error(`video URL ซ้ำ: ${duplicates.slice(0, 10).join(', ')}`);
  process.exitCode = 1;
} else {
  const bySource = videos.reduce((groups, video) => {
    groups[video.source] = (groups[video.source] || 0) + 1;
    return groups;
  }, {});
  console.log(`ข้อมูลผ่าน: ${videos.length} รายการ (${Object.entries(bySource).map(([source, count]) => `${source} ${count}`).join(', ')})`);
}
