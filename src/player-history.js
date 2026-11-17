export function createPlayerHistoryController({
  historyApi,
  eventTarget,
  currentUrl,
  isPlayerOpen,
  closePlayer
}) {
  let playerEntryActive = false;

  const onPopState = () => {
    if (!playerEntryActive) return;
    playerEntryActive = false;
    if (isPlayerOpen()) closePlayer();
  };

  eventTarget.addEventListener('popstate', onPopState);

  return {
    open() {
      if (playerEntryActive) return false;
      try {
        historyApi.pushState({ __videoPlayerModal: true }, '', currentUrl());
        playerEntryActive = true;
        return true;
      } catch {
        return false;
      }
    },
    close() {
      if (!playerEntryActive) return false;
      try {
        historyApi.back();
        return true;
      } catch {
        playerEntryActive = false;
        return false;
      }
    },
    dispose() {
      eventTarget.removeEventListener('popstate', onPopState);
    }
  };
}
