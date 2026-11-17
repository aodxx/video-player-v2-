import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('account and player views are represented in browser history', () => {
  assert.match(app, /playerHistory\.openAccount\(/);
  assert.match(app, /playerHistory\.openPlayer\(/);
  assert.match(app, /playerHistory\.back\(\)/);
  assert.match(app, /handleHistoryNavigation/);
});

test('closing the player invalidates any pending video-resolution callback', () => {
  const start = app.indexOf('function closeModal');
  const end = app.indexOf('player.addEventListener', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.match(app.slice(start, end), /\+\+openToken/);
});

test('the player close button and choose-account navigation button are removed', () => {
  assert.doesNotMatch(html, /id="btnClose"/);
  assert.doesNotMatch(html, /id="backToAccounts"/);
});
