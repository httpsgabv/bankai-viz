import { el } from './dom.js';

/** Segmented control to pick a release (Shikai / Bankai) with a sliding indicator. */
export class ReleaseSwitch {
  #buttons = new Map();

  constructor(releases, onSelect) {
    this.indicator = el('span', { class: 'release-switch__indicator' });
    this.element = el('nav', { class: 'release-switch', attrs: { 'aria-label': 'Release' } }, [this.indicator]);
    this.element.style.setProperty('--count', releases.length);

    releases.forEach((release, index) => {
      const button = el('button', {
        class: 'release-switch__option',
        text: release.title,
        attrs: { type: 'button', title: release.locked ? release.lockedNote ?? 'Locked' : release.title },
        on: { click: () => onSelect(release.id) },
      });
      // Releases never shown in the story stay visible but can't be picked.
      if (release.locked) {
        button.disabled = true;
        button.classList.add('is-locked');
      }
      button.dataset.index = index;
      this.#buttons.set(release.id, button);
      this.element.append(button);
    });
  }

  setActive(id) {
    for (const [releaseId, button] of this.#buttons) {
      const active = releaseId === id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active);
      if (active) this.element.style.setProperty('--index', button.dataset.index);
    }
  }
}
