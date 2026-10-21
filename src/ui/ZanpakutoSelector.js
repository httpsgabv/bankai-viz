import { el } from './dom.js';
import { icons } from './icons.js';

/**
 * The HUD title doubles as the zanpakutō picker: click it to open a small menu.
 * With a single zanpakutō it stays a plain title.
 */
export class ZanpakutoSelector {
  #open = false;
  #items = new Map();

  constructor(zanpakutoList, onSelect) {
    this.kanji = el('span', { class: 'selector__kanji' });
    this.name = el('span', { class: 'selector__name' });
    this.command = el('span', { class: 'selector__command' });
    this.wielder = el('span', { class: 'selector__wielder' });

    const multiple = zanpakutoList.length > 1;
    this.trigger = el(
      'button',
      {
        class: 'selector__trigger',
        attrs: { type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', title: 'Choose zanpakutō (Z)' },
        on: { click: () => this.setOpen(!this.#open) },
      },
      [
        this.kanji,
        el('span', { class: 'selector__meta' }, [
          el('span', { class: 'selector__name-row' }, [this.name, multiple ? el('span', { class: 'selector__chevron', html: icons.chevron }) : '']),
          this.command,
          this.wielder,
        ]),
      ],
    );
    this.trigger.disabled = !multiple;

    this.menu = el('ul', { class: 'selector__menu', attrs: { role: 'listbox' } });
    for (const zanpakuto of zanpakutoList) {
      const item = el(
        'li',
        {
          class: 'selector__item',
          attrs: { role: 'option', tabindex: '0' },
          on: {
            click: () => this.#choose(zanpakuto.id, onSelect),
            keydown: (event) => event.key === 'Enter' && this.#choose(zanpakuto.id, onSelect),
          },
        },
        [
          el('span', { class: 'selector__item-kanji', text: zanpakuto.kanji }),
          el('span', { class: 'selector__item-meta' }, [
            el('span', { class: 'selector__item-name', text: zanpakuto.name }),
            el('span', { class: 'selector__item-wielder', text: zanpakuto.wielder }),
          ]),
        ],
      );
      this.#items.set(zanpakuto.id, item);
      this.menu.append(item);
    }

    this.element = el('div', { class: 'selector' }, [this.trigger, this.menu]);
    document.addEventListener('pointerdown', (event) => {
      if (this.#open && !this.element.contains(event.target)) this.setOpen(false);
    });
  }

  setZanpakuto({ id, kanji, name, wielder }) {
    this.kanji.textContent = kanji;
    this.name.textContent = name;
    this.wielder.textContent = wielder;
    for (const [itemId, item] of this.#items) item.setAttribute('aria-selected', String(itemId === id));
  }

  setCommand(command) {
    this.command.textContent = command;
  }

  setOpen(open) {
    this.#open = open;
    this.element.classList.toggle('is-open', open);
    this.trigger.setAttribute('aria-expanded', String(open));
  }

  #choose(id, onSelect) {
    this.setOpen(false);
    onSelect(id);
  }
}
