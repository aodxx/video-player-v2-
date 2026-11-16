const SOURCES = Object.freeze({
  SO: ['SoMay', 'So_May'],
  RW: ['Rewaida', 'Rewaida'],
  CX: ['Rabbit Rayong', '@CxllmeB64'],
  SU: ['Subhash', '@Subhash72782123'],
  LT: ['Lietongheng', '@lietongheng'],
  NK: ['NNNKII88', '@NNNKII88'],
  DP: ['Deepak', '@DeepakC92550200'],
  TD: ['Thanh Do', '@thanhDO53161694'],
  GN: ['Ginan', '@Ginan459'],
  RP: ['Reno16Promax1', '@reno16promax1'],
  DS: ['Dedprajamsoy', '@dedprajamsoy']
});

const ACCOUNT_LABELS = Object.freeze({
  SoMay: '@So_MayBDSM',
  Rewaida: '@RewaidaMohamed',
  Reno16Promax1: '@reno16promax1',
  Dedprajamsoy: '@dedprajamsoy'
});

function isHttpsHost(value, host) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function parseRawData(raw) {
  return String(raw ?? '').split(/\r?\n/).flatMap((line) => {
    if (!line.trim()) return [];
    const parts = line.split('|');
    if (parts.length < 8) return [];
    const [sourceCode, postedAt, postUrl, videoUrl, thumbnailUrl, duration, views, ...text] = parts;
    const source = Object.hasOwn(SOURCES, sourceCode) ? SOURCES[sourceCode] : null;
    if (!source || !validPostedAt(postedAt)) return [];
    if (!/^https:\/\/x\.com\/[^/]+\/status\/\d+(?:[/?#]|$)/.test(postUrl)) return [];
    if (!isHttpsHost(videoUrl, 'video.twimg.com')) return [];
    if (thumbnailUrl && !isHttpsHost(thumbnailUrl, 'pbs.twimg.com')) return [];
    if (!/^\d+$/.test(duration) || !/^\d+$/.test(views)) return [];
    const [sourceName, sourceLabel] = source;
    return [{
      source: sourceName,
      sourceLabel,
      postedAt,
      postUrl,
      videoUrl,
      thumbnailUrl,
      durationSeconds: Number(duration),
      views: Number(views),
      text: text.join('|')
    }];
  });
}

function validPostedAt(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{1,2}):(\d{2}))?$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour = '0', minute = '0'] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year)
    && date.getUTCMonth() === Number(month) - 1
    && date.getUTCDate() === Number(day)
    && Number(hour) < 24
    && Number(minute) < 60;
}

export function findDuplicateVideoUrls(videos) {
  const seen = new Set();
  const duplicates = new Set();
  for (const video of videos) {
    if (seen.has(video.videoUrl)) duplicates.add(video.videoUrl);
    seen.add(video.videoUrl);
  }
  return [...duplicates];
}

export function filterPlaylistItems(videos, query = '') {
  const needle = String(query).trim().toLocaleLowerCase();
  const items = videos.map((video, index) => ({ video, index }));
  if (!needle) return items;

  return items.filter(({ video, index }) => {
    const duration = Math.max(0, Number(video.durationSeconds) || 0);
    const durationLabel = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
    const searchable = [
      index + 1,
      video.sourceLabel,
      video.postedAt,
      video.text,
      video.postUrl,
      video.views,
      duration,
      durationLabel
    ].join(' ').toLocaleLowerCase();
    return searchable.includes(needle);
  });
}

export function filterVideos(videos, { source = 'all', query = '', favorites = null } = {}) {
  const needle = String(query).trim().toLocaleLowerCase();
  return videos.filter((video) => {
    if (source !== 'all' && video.source !== source) return false;
    if (favorites && !favorites.has(video.postUrl)) return false;
    if (!needle) return true;
    return `${video.text} ${video.postedAt}`.toLocaleLowerCase().includes(needle);
  });
}

export function summarizeSources(videos) {
  const summaries = new Map();
  for (const video of videos) {
    if (!video?.source || !video?.sourceLabel) continue;
    if (!summaries.has(video.source)) {
      summaries.set(video.source, {
        source: video.source,
        sourceLabel: video.sourceLabel,
        accountLabel: ACCOUNT_LABELS[video.source] || video.sourceLabel,
        count: 0
      });
    }
    summaries.get(video.source).count += 1;
  }
  return [...summaries.values()];
}
