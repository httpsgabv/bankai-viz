import * as THREE from 'three';
import { Release } from '../Release.js';
import { shikaiSchema } from './schemas/shikaiSchema.js';
import { Shikomizue } from '../../render/blades/Shikomizue.js';
import { CrescentVolley } from '../../render/energy/CrescentVolley.js';
import { HexShield } from '../../render/energy/HexShield.js';
import { MoteField } from '../../effects/MoteField.js';
import { CrescentBlasts } from '../../sim/CrescentBlasts.js';
import { AimController } from '../../sim/AimController.js';
import { FlowForce } from '../../sim/forces/FlowForce.js';
import { BoundsForce } from '../../sim/forces/BoundsForce.js';
import { Sequence } from '../../utils/Sequence.js';
import { easeInOutCubic } from '../../utils/math.js';

const PIVOT = new THREE.Vector3(0, 1.8, 0);
const TAP_SECONDS = 0.22;
const STATUS_SECONDS = 1.2;
const MOTE_BOUNDS = { min: [-11, 0.2, -8], max: [11, 9, 5] };
const MOTE_CENTER = new THREE.Vector3(0, 4.5, -1.5);

/**
 * "Okiro, Benihime" — the cane sword awakens in a room of drifting ink.
 * Tap: "Nake, Benihime" fires a crimson crescent that tears through and stains the ink.
 * Hold: "Chikasumi no Tate" raises a honeycomb blood-mist shield; letting go shatters it.
 */
export class BenihimeShikai extends Release {
  #formed = 0;
  #pressTime = -1;
  #technique = null;
  #techniqueAge = 0;
  #aimer = new AimController();
  #tip = new THREE.Vector3();

  constructor(context) {
    super(context, shikaiSchema);
    const { atmosphere } = context.stage;

    this.sword = new Shikomizue({ atmosphere, crimson: this.params.crimson });
    this.sword.group.position.copy(PIVOT);
    this.blasts = new CrescentBlasts(8);
    this.volley = new CrescentVolley(this.blasts, atmosphere, { color: this.params.crimson });
    this.root.add(this.sword.group, this.volley.object);

    this.flow = new FlowForce();
    this.flow.frequency = 0.25;
    this.flow.speed = 0.3;
    this.bounds = new BoundsForce();
    this.bounds.center.copy(MOTE_CENTER);
    this.bounds.radius = 9;
    this.bounds.strength = 0.6;

    this.#buildShield();
    this.#buildMotes();
    this.sequence = new Sequence(this.#awakenSteps()).start();
  }

  get view() {
    return {
      camera: { position: [0, 3.4, 13], target: [0, 3, 0] },
      fog: { near: 13, far: 42 },
      focus: [0, 3, 0],
    };
  }

  get status() {
    return this.#technique;
  }

  update(dt, time) {
    const { pointer, stage } = this.context;
    this.sequence.update(dt);
    this.sword.dissolve = 1 - this.#formed;
    this.sword.update(time);

    const base = PIVOT.clone().add(pointer.depthOffset);
    this.#aimer.update(dt, base, pointer.world, pointer.presence * this.#formed);
    this.sword.group.position.copy(base);
    this.sword.group.quaternion.copy(this.#aimer.quaternion);
    this.sword.group.updateMatrixWorld(true);
    this.sword.tipPosition(this.#tip);

    this.#updateHold(dt);
    this.#updateBlasts(dt);
    this.shield.update(dt, stage.camera, pointer.world);
    if (this.shield.isUp) this.motes.disturb(pointer.world, this.shield.radius * 1.15, 0.6);

    this.flow.strength = this.params.drift;
    this.motes.update(dt, time, stage.viewportHeight);
    this.#updateStatus(dt);
    this.focus.copy(pointer.world);
  }

  replay() {
    this.sequence = new Sequence([
      { name: 'seal', duration: 0.6, update: (p) => (this.#formed = 1 - easeInOutCubic(p)) },
      ...this.#awakenSteps(),
    ]).start();
  }

  onPointerDown() {
    if (this.#formed < 0.9) return;
    this.#pressTime = 0;
  }

  onPointerUp() {
    if (this.#pressTime < 0) return;
    if (this.#pressTime < TAP_SECONDS) this.#fireCrescent();
    else this.#dropShield();
    this.#pressTime = -1;
  }

  onParamsChanged(definitions) {
    const keys = definitions.map((def) => def.key);
    if (keys.includes('motes')) this.#buildMotes();
    if (keys.includes('rings') || keys.includes('cellSize')) this.#buildShield();
    this.#applyAppearance();
  }

  dispose() {
    this.motes.dispose();
    super.dispose();
  }

  #awakenSteps() {
    return [
      { name: 'sealed', duration: 0.4, update: () => (this.#formed = 0) },
      { name: 'awaken', duration: 1.3, update: (p) => (this.#formed = easeInOutCubic(p)) },
    ];
  }

  #updateHold(dt) {
    if (this.#pressTime < 0) return;
    this.#pressTime += dt;
    if (this.#pressTime >= TAP_SECONDS && !this.shield.isUp) {
      this.shield.raise();
      this.#announce('Chikasumi no Tate', Infinity);
    }
  }

  #fireCrescent() {
    const p = this.params;
    Object.assign(this.blasts, { speed: p.blastSpeed, life: p.blastLife });
    this.blasts.spawn(this.#tip, this.#aimer.direction);
    this.#announce('Nake, Benihime');
  }

  #dropShield() {
    this.shield.shatter();
    this.motes.disturb(this.context.pointer.world, this.shield.radius * 2.2, 6);
    this.#announce(null, 0);
  }

  #updateBlasts(dt) {
    const p = this.params;
    this.blasts.update(dt);
    for (const blast of this.blasts.items) {
      if (!blast.active) continue;
      const radius = this.blasts.scale(blast, p.blastSize) * 1.1;
      this.motes.disturb(blast.position, radius, p.blastForce * dt * 6, blast.direction);
    }
    this.volley.sync(this.context.stage.camera, p.blastSize);
  }

  #announce(technique, seconds = STATUS_SECONDS) {
    this.#technique = technique;
    this.#techniqueAge = -seconds;
  }

  #updateStatus(dt) {
    this.#techniqueAge += dt;
    if (this.#techniqueAge > 0 && !this.shield.isUp) this.#technique = null;
  }

  #buildShield() {
    this.shield?.object.removeFromParent();
    this.shield?.mesh.geometry.dispose();
    this.shield?.material.dispose();
    const { rings, cellSize, crimson } = this.params;
    this.shield = new HexShield(this.context.stage.atmosphere, { rings, cellSize, color: crimson });
    this.root.add(this.shield.object);
  }

  #buildMotes() {
    this.motes?.dispose();
    this.motes = new MoteField({
      count: this.params.motes,
      ...MOTE_BOUNDS,
      atmosphere: this.context.stage.atmosphere,
      forces: [this.flow, this.bounds],
    });
    this.motes.swarm.drag = 1.6;
    this.motes.swarm.maxSpeed = 30;
    this.motes.swarm.floorY = this.context.floorY + 0.05;
    this.root.add(this.motes.object);
    this.#applyAppearance();
  }

  #applyAppearance() {
    const p = this.params;
    this.motes.setAppearance({ size: p.moteSize, opacity: p.moteOpacity, ink: p.ink, hot: p.crimson });
    this.motes.cooling = p.cooling;
    this.volley.setColor(p.crimson);
    this.shield.setColor(p.crimson);
    this.sword.material.uniforms.uGlow.value.set(p.crimson);
  }
}
