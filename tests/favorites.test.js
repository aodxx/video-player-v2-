import test from 'node:test';
import assert from 'node:assert/strict';

async function favoritesApi(t) {
  const api = await import('../src/favorites.js').catch((error) => {
    if (error.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  });
  assert.ok(api, 'favorites helpers should be implemented in src/favorites.js');
  if (!api) t.skip('favorites module is not implemented yet');
  return api;
}

const sharedPost = 'https://x.com/shared/status/123';
const videos = [
  { source: 'SoMay', postUrl: sharedPost },
  { source: 'Rewaida', postUrl: sharedPost },
  { source: 'Deepak', postUrl: 'https://x.com/deepak/status/456' }
];

test('migrates legacy favorite post URLs into every matching account bucket', async (t) => {
  const api = await favoritesApi(t);
  if (!api) return;

  const favorites = api.loadFavoritesBySource(null, JSON.stringify([sharedPost, 'https://x.com/missing/status/789']), videos);

  assert.deepEqual([...favorites.get('SoMay')], [sharedPost]);
  assert.deepEqual([...favorites.get('Rewaida')], [sharedPost]);
  assert.equal(favorites.has('Deepak'), false);
});

test('keeps account favorites isolated when the same post exists in two sources', async (t) => {
  const api = await favoritesApi(t);
  if (!api) return;

  const favorites = api.loadFavoritesBySource(JSON.stringify({ SoMay: [sharedPost], Rewaida: [sharedPost] }), '[]', videos);
  api.toggleFavoriteForSource(favorites, 'SoMay', sharedPost);

  assert.equal(api.isFavoriteForSource(favorites, videos[0]), false);
  assert.equal(api.isFavoriteForSource(favorites, videos[1]), true);
  assert.equal(api.countFavoritesForSource(favorites, 'SoMay'), 0);
  assert.equal(api.countFavoritesForSource(favorites, 'Rewaida'), 1);
});

test('uses scoped favorites over legacy storage and ignores malformed entries', async (t) => {
  const api = await favoritesApi(t);
  if (!api) return;

  const favorites = api.loadFavoritesBySource(JSON.stringify({ SoMay: [sharedPost, 2], Rewaida: 'bad' }), JSON.stringify(['https://x.com/legacy/status/9']), videos);

  assert.deepEqual([...favorites.get('SoMay')], [sharedPost]);
  assert.equal(favorites.has('Rewaida'), false);
});
