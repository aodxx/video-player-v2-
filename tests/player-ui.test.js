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

test('automatic fullscreen is opt-in so Android Back closes the player predictably', () => {
  const control = html.match(/<input\b[^>]*id="autofs"[^>]*>/);
  assert.ok(control, 'automatic fullscreen control must remain available');
  assert.doesNotMatch(control[0], /\bchecked\b/, 'automatic fullscreen should be off by default');
  const openAt = app.slice(app.indexOf('function openAt('), app.indexOf('function updateDetails('));
  assert.ok(openAt.indexOf("modal.classList.add('active')") < openAt.indexOf('enterFS()'),
    'show the player before requesting fullscreen');
});

test('installed app display modes avoid redundant system fullscreen transitions', () => {
  assert.match(app, /\['standalone','fullscreen'\]\.some\(mode=>window\.matchMedia/,
    'detect PWA display modes that already occupy the app window');
  assert.match(app, /if\(appDisplayMode\)\{\s*btnFS\.hidden=true;/,
    'hide the redundant fullscreen action in installed app windows');
  assert.match(app, /async function enterFS\(\)\{\s*if\(appDisplayMode \|\| fullscreenPending \|\| fsEl\(\)\) return;/,
    'do not request browser fullscreen while running as an installed app');
});

test('fullscreen transitions cannot be started again before the previous request settles', () => {
  assert.match(app, /let fullscreenPending=false/);
  assert.match(app, /async function enterFS\(\)\{\s*if\(appDisplayMode \|\| fullscreenPending \|\| fsEl\(\)\) return;/);
  assert.match(app, /async function exitFS\(\)\{\s*if\(appDisplayMode \|\| fullscreenPending \|\| !fsEl\(\)\) return;/);
  assert.match(app, /finally\{fullscreenPending=false;syncFullscreenButton\(\);\}/,
    'always release the transition lock and refresh the actual button state');
});

test('opens the original source before resolving HQ and preserves playback when upgrading', () => {
  const openAt = app.slice(app.indexOf('function openAt('), app.indexOf('function updateDetails('));
  assert.ok(openAt.indexOf('startPlay(d.videoUrl);') < openAt.indexOf('withTimeout(resolveHQ(d),2500)'),
    'the original source should start before the HQ lookup');
  assert.match(openAt, /const position=Number\.isFinite\(player\.currentTime\)/,
    'capture the current playback position before changing sources');
  assert.match(openAt, /const shouldResume=!player\.paused&&!player\.ended/,
    'preserve whether playback was active before changing sources');
  assert.match(openAt, /reloadPlayerAt\(h\.url,position,token,shouldResume\)/,
    'restore playback state after the HQ source is ready');
});
