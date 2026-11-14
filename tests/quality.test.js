import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQualityPreference, shouldFetchHighestQuality } from '../src/quality.js';

test('defaults to catalog quality and migrates old auto/original preferences', () => {
  assert.equal(normalizeQualityPreference(null), 'standard');
  assert.equal(normalizeQualityPreference('auto'), 'standard');
  assert.equal(normalizeQualityPreference('original'), 'standard');
  assert.equal(normalizeQualityPreference('standard'), 'standard');
});

test('preserves explicit maximum quality and only fetches HQ in that mode', () => {
  assert.equal(normalizeQualityPreference('max'), 'max');
  assert.equal(shouldFetchHighestQuality('standard', true), false);
  assert.equal(shouldFetchHighestQuality('max', false), false);
  assert.equal(shouldFetchHighestQuality('max', true), true);
});
