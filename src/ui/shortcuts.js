/** Maps keys to handlers, ignoring presses while typing in a form field. */
export function bindShortcuts(handlers) {
  window.addEventListener('keydown', (event) => {
    if (event.target.closest?.('input, textarea, select')) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.code === 'Space' ? 'space' : event.key.toLowerCase();
    const handler = handlers[key];
    if (!handler) return;
    event.preventDefault();
    handler();
  });
}
