import { el } from '../dom.js';

/** Labelled colour swatch backed by the native colour picker. */
export class ColorControl {
  constructor({ label }, value, onChange) {
    this.input = el('input', { class: 'control__color', attrs: { type: 'color', 'aria-label': label } });
    this.code = el('span', { class: 'control__value' });
    this.input.addEventListener('input', () => {
      this.code.textContent = this.input.value;
      onChange(this.input.value);
    });

    this.element = el('label', { class: 'control control--color' }, [
      el('span', { class: 'control__label', text: label }),
      el('span', { class: 'control__color-wrap' }, [this.code, this.input]),
    ]);
    this.setValue(value);
  }

  setValue(value) {
    this.input.value = value;
    this.code.textContent = value;
  }
}
