import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

test('player open and close are integrated with browser Back history', () => {
  assert.match(app, /createPlayerHistoryController/);
  assert.match(app, /playerHistory\.open\(\)/);
  assert.match(app, /playerHistory\.close\(\)/);
});
