import { el, iconButton } from './dom.js';
import { icons } from './icons.js';
import { createControl } from './controls/createControl.js';

/**
 * Slide-in configuration panel. Renders any number of ParamSources from their schemas,
 * so new releases get a panel for free.
 */
export class ControlPanel {
  #bindings = [];
  #sources = [];
  #open = false;

  constructor(parent, { toolbar }) {
    toolbar.append(iconButton(icons.sliders, 'Configure (C)', () => this.toggle()));

    this.title = el('h2', { class: 'panel__title' });
    this.body = el('div', { class: 'panel__body' });
    this.actions = el('div', { class: 'panel__actions' });
    this.element = el('aside', { class: 'panel', attrs: { 'aria-hidden': 'true' } }, [
      el('header', { class: 'panel__header' }, [this.title, iconButton(icons.close, 'Close', () => this.setOpen(false))]),
      this.body,
      el('footer', { class: 'panel__footer' }, [
        this.actions,
        el('p', { class: 'panel__shortcuts', text: '1/2 release · Z zanpakutō · Space replay · H hide · C panel' }),
      ]),
    ]);
    parent.append(this.element);
  }

  toggle() {
    this.setOpen(!this.#open);
  }

  setOpen(open) {
    this.#open = open;
    this.element.classList.toggle('is-open', open);
    this.element.setAttribute('aria-hidden', String(!open));
  }

  /** @param {{ title: string, sources: ParamSource[], actions: { label, onClick }[] }} options */
  bind({ title, sources, actions = [] }) {
    this.title.textContent = title;
    this.#sources = sources;
    this.#bindings = [];
    this.body.replaceChildren(...sources.flatMap((source) => source.schema.map((group) => this.#renderGroup(source, group))));

    const buttons = actions.map(({ label, onClick }) => this.#button(label, onClick));
    buttons.push(this.#button('Reset', () => this.#reset(), 'panel__button--quiet'));
    this.actions.replaceChildren(...buttons);
  }

  #renderGroup(source, { group, controls }) {
    const items = controls.map((definition) => {
      const control = createControl(definition, source.params[definition.key], (value) =>
        source.setParam(definition.key, value),
      );
      this.#bindings.push({ source, definition, control });
      return control.element;
    });
    return el('section', { class: 'panel__group' }, [el('h3', { class: 'panel__group-title', text: group }), ...items]);
  }

  #reset() {
    this.#sources.forEach((source) => source.resetParams());
    this.#bindings.forEach(({ source, definition, control }) => control.setValue(source.params[definition.key]));
  }

  #button(label, onClick, modifier = '') {
    return el('button', {
      class: `panel__button ${modifier}`.trim(),
      text: label,
      attrs: { type: 'button' },
      on: { click: onClick },
    });
  }
}
