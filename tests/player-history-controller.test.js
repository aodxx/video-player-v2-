import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerHistoryController } from '../src/player-history.js';

function createHarness({ initiallyOpen = false } = {}) {
  let playerOpen = initiallyOpen;
  let closeCalls = 0;
  let backCalls = 0;
  const pushed = [];
  const listeners = new Map();
  const removed = [];
  const historyApi = {
    pushState: (...args) => pushed.push(args),
    back: () => { backCalls += 1; }
  };
  const eventTarget = {
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: (name, handler) => removed.push([name, handler]),
    dispatch: name => listeners.get(name)?.()
  };
  const controller = createPlayerHistoryController({
    historyApi,
    eventTarget,
    currentUrl: () => 'https://example.test/player',
    isPlayerOpen: () => playerOpen,
    closePlayer: () => { closeCalls += 1; playerOpen = false; }
  });
  return {
    controller,
    pushed,
    removed,
    eventTarget,
    setPlayerOpen: value => { playerOpen = value; },
    get closeCalls() { return closeCalls; },
    get backCalls() { return backCalls; }
  };
}

test('opening player pushes one same-page history entry for the session', () => {
  const harness = createHarness();
  assert.equal(harness.controller.open(), true);
  assert.equal(harness.controller.open(), false);
  assert.equal(harness.pushed.length, 1);
  assert.deepEqual(harness.pushed[0], [{ __videoPlayerModal: true }, '', 'https://example.test/player']);
});

test('browser Back closes an open player without another history traversal', () => {
  const harness = createHarness();
  harness.setPlayerOpen(true);
  harness.controller.open();
  harness.eventTarget.dispatch('popstate');
  harness.eventTarget.dispatch('popstate');
  assert.equal(harness.closeCalls, 1);
  assert.equal(harness.backCalls, 0);
});

test('manual close returns through the synthetic entry without closing twice', () => {
  const harness = createHarness();
  harness.controller.open();
  harness.setPlayerOpen(false);
  assert.equal(harness.controller.close(), true);
  harness.eventTarget.dispatch('popstate');
  assert.equal(harness.backCalls, 1);
  assert.equal(harness.closeCalls, 0);
});

test('dispose removes the popstate listener', () => {
  const harness = createHarness();
  harness.controller.dispose();
  assert.equal(harness.removed.length, 1);
  assert.equal(harness.removed[0][0], 'popstate');
});
