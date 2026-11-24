export function shouldIgnorePlayerShortcut(target) {
  if (!target) return false;
  return ['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(target.tagName) ||
    target.isContentEditable === true || Boolean(target.closest?.('[contenteditable]'));
}
