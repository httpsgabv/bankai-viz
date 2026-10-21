import { el, iconButton } from './dom.js';
import { icons } from './icons.js';
import { ReleaseSwitch } from './ReleaseSwitch.js';

/** Overlay chrome: title, release switch, hints and a toolbar for icon buttons. */
export class Hud {
  constructor(parent, { zanpakuto, onSelectRelease, onReplay }) {
    this.command = el('p', { class: 'hud-title__command' });
    const title = el('header', { class: 'hud-title' }, [
      el('span', { class: 'hud-title__kanji', text: zanpakuto.kanji }),
      el('div', { class: 'hud-title__meta' }, [
        el('h1', { class: 'hud-title__name', text: zanpakuto.name }),
        this.command,
        el('p', { class: 'hud-title__wielder', text: zanpakuto.wielder }),
      ]),
    ]);

    this.toolbar = el('div', { class: 'hud-toolbar' }, [iconButton(icons.replay, 'Replay release (Space)', onReplay)]);
    this.switch = new ReleaseSwitch(zanpakuto.releases, onSelectRelease);
    this.hints = el('ul', { class: 'hud-hints' });

    this.element = el('div', { class: 'hud' }, [title, this.toolbar, this.switch.element, this.hints]);
    parent.append(this.element);
  }

  setRelease({ id, command, hints }) {
    this.command.textContent = command;
    this.hints.replaceChildren(...hints.map((hint) => el('li', { text: hint })));
    this.switch.setActive(id);
  }

  toggleHidden() {
    document.body.classList.toggle('ui-hidden');
  }
}
