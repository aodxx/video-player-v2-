import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

test('video selection keeps cover-card rendering and player navigation without the duplicate text-only playlist', () => {
  assert.match(html, /<div id="grid"/);
  assert.match(html, /id="btnPrev"/);
  assert.match(html, /id="btnNext"/);
  assert.match(app, /class="card /);
  assert.match(app, /d\.thumbnailUrl/);
  assert.match(app, /btnPrev\.onclick = prevVideo/);
  assert.match(app, /btnNext\.onclick = nextVideo/);
  assert.doesNotMatch(html, /id="(?:togglePlaylist|playlist|playlistSearch|plList)"/);
});
