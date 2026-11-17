const HISTORY_KEY = '__videoPlayerNavigation';

function getNavigationState(historyState) {
  const navigationState = historyState?.[HISTORY_KEY];
  return navigationState && typeof navigationState === 'object' ? navigationState : null;
}

export function createPlayerHistoryController({
  historyApi,
  eventTarget,
  currentUrl,
  onNavigate
}) {
  let backPending = false;
  let deferredPlayerState = null;

  const pushState = navigationState => {
    try {
      const existingState = historyApi.state;
      const nextState = existingState && typeof existingState === 'object' && !Array.isArray(existingState)
        ? { ...existingState }
        : {};
      nextState[HISTORY_KEY] = navigationState;
      historyApi.pushState(nextState, '', currentUrl());
      return true;
    } catch {
      return false;
    }
  };

  const replaceState = navigationState => {
    try {
      const existingState = historyApi.state;
      const nextState = existingState && typeof existingState === 'object' && !Array.isArray(existingState)
        ? { ...existingState }
        : {};
      nextState[HISTORY_KEY] = navigationState;
      historyApi.replaceState(nextState, '', currentUrl());
      return true;
    } catch {
      return false;
    }
  };

  const onPopState = event => {
    const shouldRestorePlayer = backPending && deferredPlayerState;
    const nextPlayerState = deferredPlayerState;
    backPending = false;
    deferredPlayerState = null;

    if (shouldRestorePlayer && pushState(nextPlayerState)) return;
    onNavigate(getNavigationState(event?.state));
  };

  eventTarget.addEventListener('popstate', onPopState);

  return {
    openAccount(source) {
      return pushState({ view: 'account', source });
    },
    openPlayer(source, videoUrl, viewState) {
      const state = { view: 'player', source, videoUrl, ...(viewState ? { viewState } : {}) };
      if (backPending) {
        deferredPlayerState = state;
        return true;
      }
      return pushState(state);
    },
    updatePlayer(source, videoUrl, viewState) {
      const state = { view: 'player', source, videoUrl, ...(viewState ? { viewState } : {}) };
      if (backPending) {
        deferredPlayerState = state;
        return true;
      }
      if (getNavigationState(historyApi.state)?.view !== 'player') return false;
      return replaceState(state);
    },
    back() {
      if (backPending) {
        if (!deferredPlayerState) return false;
        deferredPlayerState = null;
        return true;
      }
      backPending = true;
      try {
        historyApi.back();
        return true;
      } catch {
        backPending = false;
        return false;
      }
    },
    dispose() {
      eventTarget.removeEventListener('popstate', onPopState);
    }
  };
}
