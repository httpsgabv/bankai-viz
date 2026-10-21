const svg = (paths) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  sliders: svg(
    '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="2.2" fill="var(--surface-solid)"/><circle cx="15" cy="17" r="2.2" fill="var(--surface-solid)"/>',
  ),
  replay: svg('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><polyline points="4 4 4 9 9 9"/>'),
  close: svg('<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>'),
};
