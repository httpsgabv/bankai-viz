import { Stage } from '../engine/Stage.js';
import { CameraRig } from '../engine/CameraRig.js';
import { Pointer } from '../engine/Pointer.js';
import { Loop } from '../engine/Loop.js';
import { Floor } from '../render/environment/Floor.js';
import { SceneSettings } from './SceneSettings.js';
import { zanpakutoRegistry } from '../zanpakuto/registry.js';
import { Hud } from '../ui/Hud.js';
import { ControlPanel } from '../ui/ControlPanel.js';
import { ReleaseBanner } from '../ui/ReleaseBanner.js';
import { bindShortcuts } from '../ui/shortcuts.js';

const FLOOR_Y = 0;

/** Wires the 3D stage, the active zanpakutō release and the UI together. */
export class App {
  #release = null;
  #releaseId = null;
  #firstActivation = true;

  constructor(root) {
    this.stage = new Stage(root);
    this.rig = new CameraRig(this.stage.camera);
    this.pointer = new Pointer(this.stage.canvas);
    this.floor = new Floor(this.stage.atmosphere, { y: FLOOR_Y });
    this.stage.scene.add(this.floor.mesh);
    this.settings = new SceneSettings({ stage: this.stage, rig: this.rig, floor: this.floor });

    this.hud = new Hud(root, {
      zanpakutoList: zanpakutoRegistry,
      onSelectZanpakuto: (id) => this.selectZanpakuto(id),
      onSelectRelease: (id) => this.activate(id),
      onReplay: () => this.#release?.replay(),
    });
    this.panel = new ControlPanel(root, { toolbar: this.hud.toolbar });
    this.banner = new ReleaseBanner(root);

    this.pointer.on('down', () => this.#release?.onPointerDown());
    this.pointer.on('up', () => this.#release?.onPointerUp());
    this.#bindShortcuts();

    this.loop = new Loop((dt, time) => this.#tick(dt, time));
  }

  start() {
    this.selectZanpakuto(zanpakutoRegistry[0].id);
    this.loop.start();
  }

  selectZanpakuto(id) {
    const zanpakuto = zanpakutoRegistry.find((entry) => entry.id === id);
    if (!zanpakuto || zanpakuto === this.zanpakuto) return;
    this.zanpakuto = zanpakuto;
    this.#releaseId = null;
    this.settings.setTheme(zanpakuto.theme);
    this.hud.setZanpakuto(zanpakuto);
    this.activate(zanpakuto.releases[0].id);
  }

  activate(releaseId) {
    if (releaseId === this.#releaseId) return;
    const definition = this.zanpakuto.releases.find((release) => release.id === releaseId);
    if (!definition || definition.locked) return;

    this.#release?.dispose();
    const release = definition.create({ stage: this.stage, pointer: this.pointer, cameraRig: this.rig, floorY: FLOOR_Y });
    release.mount();
    this.#release = release;
    this.#releaseId = releaseId;

    const { camera, fog, focus } = release.view;
    this.rig.setPreset(camera, this.#firstActivation);
    this.stage.setFog(fog, this.#firstActivation);
    this.pointer.setFocus(focus);
    this.#firstActivation = false;

    this.hud.setRelease(definition);
    this.banner.show(definition.banner);
    this.panel.bind({
      title: `${this.zanpakuto.name} · ${definition.title}`,
      sources: [release, this.settings],
      actions: [{ label: 'Replay release', onClick: () => this.#release.replay() }],
    });
  }

  #cycleZanpakuto() {
    const index = zanpakutoRegistry.indexOf(this.zanpakuto);
    this.selectZanpakuto(zanpakutoRegistry[(index + 1) % zanpakutoRegistry.length].id);
  }

  #bindShortcuts() {
    const releaseAt = (index) => () => {
      const release = this.zanpakuto.releases[index];
      if (release) this.activate(release.id);
    };
    bindShortcuts({
      1: releaseAt(0),
      2: releaseAt(1),
      z: () => this.#cycleZanpakuto(),
      space: () => this.#release?.replay(),
      h: () => this.hud.toggleHidden(),
      c: () => this.panel.toggle(),
      escape: () => this.panel.setOpen(false),
    });
  }

  #tick(dt, time) {
    this.rig.update(dt, this.pointer.ndc);
    this.stage.update(dt);
    this.pointer.update(this.stage.camera, dt);
    this.#release.update(dt, time);
    this.floor.setFocus(this.#release.focus);
    this.hud.setStatus(this.#release.status);
    this.stage.render();
  }
}
