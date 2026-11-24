import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

const postUrl = 'https://x.com/account/status/123';
const clips = [
  { source: 'account', postUrl, videoUrl: 'https://video.twimg.com/clip-1.mp4' },
  { source: 'account', postUrl, videoUrl: 'https://video.twimg.com/clip-2.mp4' }
];

test('favorites distinguish two clips in one post and migrate old post-level favorites', async () => {
  const api = await import('../src/favorites.js');
  const favorites = api.loadFavoritesBySource(JSON.stringify({ account: [postUrl] }), '[]', clips);

  assert.equal(api.isFavoriteForSource(favorites, clips[0]), true);
  assert.equal(api.isFavoriteForSource(favorites, clips[1]), true);
  api.toggleFavoriteForSource(favorites, clips[1]);
  assert.equal(api.isFavoriteForSource(favorites, clips[0]), true);
  assert.equal(api.isFavoriteForSource(favorites, clips[1]), false);
  assert.match(api.serializeFavoritesBySource(favorites), /clip-1\.mp4/);
});

test('video cards and playlist items expose keyboard activation semantics', () => {
  assert.match(app, /class="card[^"`]*"[^>]*role="button"[^>]*tabindex="0"/,
    'cards must be focusable buttons by role');
  assert.match(app, /class="pl-item[\s\S]{0,120}role="button" tabindex="0"/,
    'playlist items must be focusable buttons by role');
  assert.match(app, /keydown[^\n]*event\.key[^\n]*Enter/s,
    'keyboard activation should support Enter');
  assert.match(app, /keydown[^\n]*event\.key[^\n]*' '/s,
    'keyboard activation should support Space');
});

test('player keyboard shortcuts ignore focused form controls and editable content', async () => {
  const { shouldIgnorePlayerShortcut } = await import('../src/keyboard.js');
  for (const tagName of ['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA']) {
    assert.equal(shouldIgnorePlayerShortcut({ tagName }), true, `${tagName} must retain native keys`);
  }
  assert.equal(shouldIgnorePlayerShortcut({ isContentEditable: true }), true);
  assert.equal(shouldIgnorePlayerShortcut({ tagName: 'DIV', isContentEditable: false }), false);
  assert.equal(shouldIgnorePlayerShortcut(null), false);
});

test('iOS fullscreen fallback is available and native video fullscreen controls are not disabled', () => {
  assert.doesNotMatch(html, /controlslist="[^"]*nofullscreen/);
  assert.match(app, /webkitEnterFullscreen/);
});
