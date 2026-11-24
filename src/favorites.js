function parseScopedFavorites(raw) {
  if (typeof raw !== 'string') return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const favorites = new Map();
    for (const [source, urls] of Object.entries(value)) {
      if (typeof source !== 'string' || !source || !Array.isArray(urls)) continue;
      const posts = new Set(urls.filter(url => typeof url === 'string'));
      if (posts.size) favorites.set(source, posts);
    }
    return favorites;
  } catch {
    return null;
  }
}

function favoriteKey(video) {
  return video && typeof video.videoUrl === 'string' && video.videoUrl ? video.videoUrl : video?.postUrl;
}

function migratePostKeys(favorites, videos) {
  for (const [source, keys] of favorites) {
    const migrated = new Set();
    for (const key of keys) {
      const matching = videos.filter(video => video?.source === source && video.postUrl === key);
      if (matching.length) matching.forEach(video => migrated.add(favoriteKey(video)));
      else migrated.add(key);
    }
    if (migrated.size) favorites.set(source, migrated);
    else favorites.delete(source);
  }
  return favorites;
}

function parseLegacyFavorites(raw) {
  if (typeof raw !== 'string') return new Set();
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? new Set(value.filter(url => typeof url === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

export function loadFavoritesBySource(scopedRaw, legacyRaw, videos) {
  const scoped = parseScopedFavorites(scopedRaw);
  if (scoped) return migratePostKeys(scoped, videos);

  const legacy = parseLegacyFavorites(legacyRaw);
  const favorites = new Map();
  for (const video of videos) {
    if (!video || typeof video.source !== 'string' || typeof video.postUrl !== 'string' || !legacy.has(video.postUrl)) continue;
    if (!favorites.has(video.source)) favorites.set(video.source, new Set());
    favorites.get(video.source).add(favoriteKey(video));
  }
  return favorites;
}

export function toggleFavoriteForSource(favoritesBySource, sourceOrVideo, key) {
  const source = typeof sourceOrVideo === 'object' ? sourceOrVideo?.source : sourceOrVideo;
  const favorite = typeof sourceOrVideo === 'object' ? favoriteKey(sourceOrVideo) : key;
  if (!(favoritesBySource instanceof Map) || typeof source !== 'string' || !source || typeof favorite !== 'string' || !favorite) return favoritesBySource;
  if (!favoritesBySource.has(source)) favoritesBySource.set(source, new Set());
  const favorites = favoritesBySource.get(source);
  if (favorites.has(favorite)) favorites.delete(favorite);
  else favorites.add(favorite);
  if (!favorites.size) favoritesBySource.delete(source);
  return favoritesBySource;
}

export function isFavoriteForSource(favoritesBySource, video) {
  return !!video && !!favoritesBySource?.get(video.source)?.has(favoriteKey(video));
}

export function countFavoritesForSource(favoritesBySource, source) {
  return favoritesBySource?.get(source)?.size || 0;
}

export function serializeFavoritesBySource(favoritesBySource) {
  const buckets = [...(favoritesBySource || new Map())]
    .filter(([source, urls]) => typeof source === 'string' && urls instanceof Set && urls.size)
    .map(([source, urls]) => [source, [...urls]]);
  return JSON.stringify(Object.fromEntries(buckets));
}
