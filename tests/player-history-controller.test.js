import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerHistoryController } from '../src/player-history.js';

const HISTORY_KEY = '__videoPlayerNavigation';

function createHarness() {
  const pushed = [];
  const replaced = [];
  const navigations = [];
  const listeners = new Map();
  const removed = [];
  let backCalls = 0;
  const historyApi = {
    state: null,
    pushState: (state, _title, url) => {
      pushed.push({ state, url });
      historyApi.state = state;
    },
    replaceState: (state, _title, url) => {
      replaced.push({ state, url });
      historyApi.state = state;
    },
    back: () => { backCalls += 1; }
  };
  const eventTarget = {
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: (name, handler) => {
      removed.push([name, handler]);
      if (listeners.get(name) === handler) listeners.delete(name);
    },
    dispatch: (name, event = {}) => {
      if (name === 'popstate') historyApi.state = event.state ?? null;
      listeners.get(name)?.(event);
    }
  };
  const controller = createPlayerHistoryController({
    historyApi,
    eventTarget,
    currentUrl: () => 'https://example.test/player',
    onNavigate: state => navigations.push(state)
  });
  return {
    controller,
    pushed,
    replaced,
    navigations,
    removed,
    eventTarget,
    get backCalls() { return backCalls; }
  };
}

test('opening an account pushes a same-page account state', () => {
  const harness = createHarness();
  assert.equal(harness.controller.openAccount('LX'), true);
  assert.deepEqual(harness.pushed[0], {
    state: { [HISTORY_KEY]: { view: 'account', source: 'LX' } },
    url: 'https://example.test/player'
  });
});

test('opening a player pushes its account and video identity', () => {
  const harness = createHarness();
  assert.equal(harness.controller.openPlayer('LX', 'https://video.example/clip.mp4'), true);
  assert.deepEqual(harness.pushed[0].state[HISTORY_KEY], {
    view: 'player',
    source: 'LX',
    videoUrl: 'https://video.example/clip.mp4'
  });
});

test('player history stores the list filters needed to restore Forward navigation', () => {
  const harness = createHarness();
  const viewState = { search: 'sun', sort: 'views', favoriteOnly: true };
  harness.controller.openPlayer('LX', 'https://video.example/clip.mp4', viewState);
  assert.deepEqual(harness.pushed[0].state[HISTORY_KEY].viewState, viewState);
});

test('changing clips replaces the current player entry instead of adding a Back step', () => {
  const harness = createHarness();
  const viewState = { search: '', sort: 'date', favoriteOnly: false };
  harness.controller.openPlayer('LX', 'https://video.example/old.mp4');
  assert.equal(harness.controller.updatePlayer('LX', 'https://video.example/new.mp4', viewState), true);
  assert.equal(harness.pushed.length, 1);
  assert.deepEqual(harness.replaced[0].state[HISTORY_KEY], {
    view: 'player',
    source: 'LX',
    videoUrl: 'https://video.example/new.mp4',
    viewState
  });
});

test('popstate forwards account, player, and root states for Back and Forward restoration', () => {
  const harness = createHarness();
  const account = { view: 'account', source: 'LX' };
  const player = { view: 'player', source: 'LX', videoUrl: 'https://video.example/clip.mp4' };
  harness.eventTarget.dispatch('popstate', { state: { [HISTORY_KEY]: account } });
  harness.eventTarget.dispatch('popstate', { state: { [HISTORY_KEY]: player } });
  harness.eventTarget.dispatch('popstate', { state: null });
  assert.deepEqual(harness.navigations, [account, player, null]);
});

test('a new player opened during a pending manual Back is pushed after popstate', () => {
  const harness = createHarness();
  const account = { view: 'account', source: 'LX' };
  assert.equal(harness.controller.openAccount('LX'), true);
  assert.equal(harness.controller.openPlayer('LX', 'https://video.example/old.mp4'), true);
  assert.equal(harness.controller.back(), true);
  assert.equal(harness.backCalls, 1);
  const countBeforeReopen = harness.pushed.length;
  assert.equal(harness.controller.openPlayer('LX', 'https://video.example/new.mp4'), true);
  assert.equal(harness.pushed.length, countBeforeReopen);
  harness.eventTarget.dispatch('popstate', { state: { [HISTORY_KEY]: account } });
  assert.equal(harness.navigations.length, 0);
  assert.deepEqual(harness.pushed.at(-1).state[HISTORY_KEY], {
    view: 'player',
    source: 'LX',
    videoUrl: 'https://video.example/new.mp4'
  });
});

test('closing a deferred player cancels its reopen after the pending popstate', () => {
  const harness = createHarness();
  const account = { view: 'account', source: 'LX' };
  assert.equal(harness.controller.openAccount('LX'), true);
  assert.equal(harness.controller.openPlayer('LX', 'https://video.example/old.mp4'), true);
  assert.equal(harness.controller.back(), true);
  assert.equal(harness.controller.openPlayer('LX', 'https://video.example/new.mp4'), true);
  assert.equal(harness.controller.back(), true);
  harness.eventTarget.dispatch('popstate', { state: { [HISTORY_KEY]: account } });
  assert.equal(harness.pushed.length, 2);
  assert.deepEqual(harness.navigations, [account]);
});

test('dispose removes the popstate listener', () => {
  const harness = createHarness();
  harness.controller.dispose();
  assert.equal(harness.removed.length, 1);
  assert.equal(harness.removed[0][0], 'popstate');
  harness.eventTarget.dispatch('popstate', { state: null });
  assert.deepEqual(harness.navigations, []);
});
