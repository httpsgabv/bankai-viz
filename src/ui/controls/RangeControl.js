import { el } from '../dom.js';

const decimalsOf = (step) => (String(step).split('.')[1] ?? '').length;

/**
 * Labelled slider. Controls flagged `rebuild` only commit on release,
 * so expensive rebuilds don't run on every drag tick.
 */
export class RangeControl {
  constructor(definition, value, onChange) {
    const { label, min, max, step, rebuild } = definition;
    this.definition = definition;
    this.decimals = decimalsOf(step);

    this.output = el('output', { class: 'control__value' });
    this.input = el('input', {
      class: 'control__range',
      attrs: { type: 'range', min, max, step, 'aria-label': label },
    });

    const read = () => parseFloat(this.input.value);
    this.input.addEventListener('input', () => {
      this.#render(read());
      if (!rebuild) onChange(read());
    });
    if (rebuild) this.input.addEventListener('change', () => onChange(read()));

    this.element = el('label', { class: 'control control--range' }, [
      el('span', { class: 'control__row' }, [el('span', { class: 'control__label', text: label }), this.output]),
      this.input,
    ]);
    this.setValue(value);
  }

  setValue(value) {
    this.input.value = value;
    this.#render(value);
  }

  #render(value) {
    const { min, max } = this.definition;
    this.output.textContent = Number(value).toFixed(this.decimals);
    this.input.style.setProperty('--fill', `${((value - min) / (max - min)) * 100}%`);
  }
}
