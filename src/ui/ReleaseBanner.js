import { el } from './dom.js';

const VISIBLE_MS = 2600;

/** Large calligraphic announcement shown when a release is activated. */
export class ReleaseBanner {
  #timer = 0;

  constructor(parent) {
    this.eyebrow = el('span', { class: 'banner__eyebrow' });
    this.kanji = el('span', { class: 'banner__kanji' });
    this.romaji = el('span', { class: 'banner__romaji' });
    this.translation = el('span', { class: 'banner__translation' });
    this.element = el('div', { class: 'banner', attrs: { 'aria-live': 'polite' } }, [
      this.eyebrow,
      this.kanji,
      this.romaji,
      this.translation,
    ]);
    parent.append(this.element);
  }

  show({ eyebrow = '', kanji, romaji, translation }) {
    this.eyebrow.textContent = eyebrow;
    this.kanji.textContent = kanji;
    this.romaji.textContent = romaji;
    this.translation.textContent = translation;

    clearTimeout(this.#timer);
    this.element.classList.remove('is-visible');
    void this.element.offsetWidth; // restart the CSS transition
    this.element.classList.add('is-visible');
    this.#timer = setTimeout(() => this.element.classList.remove('is-visible'), VISIBLE_MS);
  }
}
