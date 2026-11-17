import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');

test('player has one previous/next navigation set', () => {
  assert.equal((html.match(/id="btnPrev"/g) || []).length, 1);
  assert.equal((html.match(/id="btnNext"/g) || []).length, 1);
  assert.doesNotMatch(html, /id="desktopPrev"|id="desktopNext"|class="desktop-nav"/);
});

test('less-used controls and clip details are inside a closed More panel', () => {
  const panel = html.match(/<details\b[^>]*id="playerMore"[^>]*>([\s\S]*?)<\/details>/);
  assert.ok(panel, 'player must have a native details panel');
  assert.doesNotMatch(panel[0].split('>')[0], /\sopen(?:\s|=|>)/, 'More panel should start closed');
  assert.match(panel[1], /<summary[^>]*>เพิ่มเติม<\/summary>/);
  for (const id of ['autonext', 'autofs', 'qualityMode', 'details']) {
    assert.match(panel[1], new RegExp(`id="${id}"`), `${id} must be inside More`);
  }
  assert.match(html, /id="favoriteCurrent"/, 'favorite action stays immediately accessible');
  assert.match(app, /เปิดโพสต์ต้นทาง ↗/, 'source post link stays available in clip details');
  assert.match(app, /sourceDetailsEl\.textContent = d\.sourceLabel/);
});
