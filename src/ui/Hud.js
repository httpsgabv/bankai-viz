import { el, iconButton } from './dom.js';
import { icons } from './icons.js';
import { ReleaseSwitch } from './ReleaseSwitch.js';
import { ZanpakutoSelector } from './ZanpakutoSelector.js';

/** Overlay chrome: zanpakutō selector, release switch, hints, status and a toolbar. */
export class Hud {
  #onSelectRelease;
  #statusText = null;

  constructor(parent, { zanpakutoList, onSelectZanpakuto, onSelectRelease, onReplay }) {
    this.#onSelectRelease = onSelectRelease;
    this.selector = new ZanpakutoSelector(zanpakutoList, onSelectZanpakuto);
    this.toolbar = el('div', { class: 'hud-toolbar' }, [iconButton(icons.replay, 'Replay release (Space)', onReplay)]);
    this.switchSlot = el('div', { class: 'hud-switch' });
    this.hints = el('ul', { class: 'hud-hints' });
    this.status = el('p', { class: 'hud-status' });

    this.element = el('div', { class: 'hud' }, [
      this.selector.element,
      this.toolbar,
      this.switchSlot,
      this.hints,
      this.status,
    ]);
    parent.append(this.element);
  }

  setZanpakuto(zanpakuto) {
    this.selector.setZanpakuto(zanpakuto);
    this.switch = new ReleaseSwitch(zanpakuto.releases, this.#onSelectRelease);
    this.switchSlot.replaceChildren(this.switch.element);
  }

  setRelease({ id, command, hints }) {
    this.selector.setCommand(command);
    this.hints.replaceChildren(...hints.map((hint) => el('li', { text: hint })));
    this.switch.setActive(id);
  }

  /** Called every frame; only touches the DOM when the text changes. */
  setStatus(text) {
    if (text === this.#statusText) return;
    this.#statusText = text;
    this.status.textContent = text ?? '';
  }

  toggleHidden() {
    document.body.classList.toggle('ui-hidden');
  }
}
