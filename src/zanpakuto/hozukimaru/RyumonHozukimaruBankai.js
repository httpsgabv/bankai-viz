import * as THREE from 'three';
import { Release } from '../Release.js';
import { bankaiSchema } from './schemas/bankaiSchema.js';
import { RyumonWeapons } from '../../render/weapons/RyumonWeapons.js';
import { Shockwave } from '../../render/energy/Shockwave.js';
import { BreakablePillars } from '../../effects/BreakablePillars.js';
import { Sequence } from '../../utils/Sequence.js';
import { clamp01, damp, easeOutCubic } from '../../utils/math.js';

const REST_CENTER = new THREE.Vector3(0, 4.2, 0);
const TAP_SECONDS = 0.2;
const PILLAR_BOUNDS = { min: [-10, -1.4], max: [10, 1.4] };
const WAVE_BAND = 0.8;
const TILT = 0.28;
const X_AXIS = new THREE.Vector3(1, 0, 0);

/**
 * "Bankai — Ryūmon Hōzukimaru" — three giant chained weapons whirl around a dragon crest
 * that follows the cursor. Moving fast (or holding) spins them harder; they smash stone
 * pillars, and every hit fills the 龍 crest with red. Tap to slam a shockwave into the
 * ground; with a full crest the slam is unleashed across the whole field.
 */
export class RyumonHozukimaruBankai extends Release {
  #center = REST_CENTER.clone();
  #goal = new THREE.Vector3();
  #lastPointer = new THREE.Vector3();
  #direction = new THREE.Vector3();
  #tilt = new THREE.Quaternion();
  #spin = 0;
  #angularVelocity = 0;
  #pressTime = -1;
  #charge = 0;
  #formed = 0;
  #unleashedAge = Infinity;

  constructor(context) {
    super(context, bankaiSchema);
    this.weapons = new RyumonWeapons({ atmosphere: context.stage.atmosphere, crestColor: this.params.crest });
    this.shockwave = new Shockwave({ color: this.params.wave, floorY: context.floorY });
    this.root.add(this.weapons.object, this.shockwave.object);
    this.#buildPillars();
    this.#lastPointer.copy(context.pointer.world);
    this.sequence = this.#formSequence();
  }

  get view() {
    return {
      camera: { position: [0, 5.2, 20], target: [0, 3.8, -1] },
      fog: { near: 18, far: 60 },
      focus: [0, 4.2, 0],
    };
  }

  get status() {
    if (this.#unleashedAge < 1.6) return 'Ryūmon · unleashed';
    if (this.#charge >= 1) return 'Ryūmon · ready — tap';
    return `Ryūmon · ${Math.round(this.#charge * 100)}%`;
  }

  update(dt, time) {
    const { pointer, stage } = this.context;
    const p = this.params;
    this.sequence.update(dt);
    if (this.#pressTime >= 0) this.#pressTime += dt;
    this.#unleashedAge += dt;

    // The hub chases the cursor; how fast you move feeds the spin.
    const speed = this.#lastPointer.distanceTo(pointer.world) / Math.max(dt, 1e-3);
    this.#lastPointer.copy(pointer.world);
    const holding = this.#pressTime >= TAP_SECONDS;
    const target = p.baseSpin + speed * p.momentum + (holding ? p.holdSpin : 0);
    this.#angularVelocity = damp(this.#angularVelocity, target * this.#formed, 2.5, dt);
    this.#spin += this.#angularVelocity * dt;

    const goal = this.#goal.copy(REST_CENTER).add(pointer.depthOffset).lerp(pointer.world, pointer.presence);
    goal.y = Math.max(goal.y, 2.6 * p.size);
    this.#center.lerp(goal, 1 - Math.exp(-p.follow * dt));

    const formation = this.weapons.object;
    formation.position.copy(this.#center);
    formation.quaternion.copy(stage.camera.quaternion).multiply(this.#tilt.setFromAxisAngle(X_AXIS, -TILT));
    formation.scale.setScalar(p.size * Math.max(0.001, this.#formed));
    this.weapons.charge = this.#charge;
    this.weapons.update(time, this.#spin);

    this.#smashPillars();
    this.shockwave.update(dt);
    this.#waveHits();
    this.pillars.update(dt);
    this.focus.copy(this.#center);
  }

  replay() {
    this.#charge = 0;
    this.sequence = this.#formSequence();
  }

  onPointerDown() {
    this.#pressTime = 0;
  }

  onPointerUp() {
    if (this.#pressTime >= 0 && this.#pressTime < TAP_SECONDS) this.#slam();
    this.#pressTime = -1;
  }

  onParamsChanged(definitions) {
    if (definitions.some((def) => def.rebuild)) this.#buildPillars();
    this.weapons.setCrestColor(this.params.crest);
    this.shockwave.setColor(this.params.wave);
    this.pillars.setColor(this.params.stone);
  }

  /** The weapons unfold out of the hub while spinning hard, then settle. */
  #formSequence() {
    return new Sequence([
      { name: 'sealed', duration: 0.4, update: () => (this.#formed = 0) },
      {
        name: 'form',
        duration: 1.4,
        enter: () => (this.#angularVelocity = 18),
        update: (p) => (this.#formed = easeOutCubic(p)),
      },
    ]).start();
  }

  #buildPillars() {
    if (this.pillars) {
      this.pillars.object.removeFromParent();
      this.pillars.object.traverse((o) => o.geometry?.dispose());
      this.pillars.material.dispose();
    }
    this.pillars = new BreakablePillars({ count: this.params.pillars, ...PILLAR_BOUNDS, floorY: this.context.floorY, color: this.params.stone });
    this.root.add(this.pillars.object);
  }

  /** Weapon heads that pass through a pillar shatter it and charge the crest. */
  #smashPillars() {
    const reach = 0.3 * this.params.size;
    this.weapons.forEachHitPoint((point) => {
      for (const pillar of this.pillars.standing()) {
        if (!this.pillars.contains(pillar, point, reach)) continue;
        this.#direction.subVectors(point, this.#center).setY(0).normalize();
        this.pillars.shatter(pillar, this.#direction, 2 + Math.abs(this.#angularVelocity) * 0.4);
        this.#charge = clamp01(this.#charge + this.params.chargePerHit);
        this.context.cameraRig.shake(0.12);
      }
    });
  }

  #slam() {
    const unleashed = this.#charge >= 1;
    const radius = unleashed ? this.params.unleash : this.params.slam;
    this.shockwave.trigger(this.#center, radius, unleashed ? 1.6 : 0.7);
    this.context.cameraRig.shake(unleashed ? 1.1 : 0.25);
    if (unleashed) {
      this.#charge = 0;
      this.#unleashedAge = 0;
      this.#angularVelocity += 25;
    }
  }

  /** Expanding rings shatter every pillar their edge sweeps over. */
  #waveHits() {
    for (const wave of this.shockwave.active()) {
      for (const pillar of this.pillars.standing()) {
        const distance = Math.hypot(pillar.position.x - wave.center.x, pillar.position.z - wave.center.z);
        if (Math.abs(distance - wave.radius) > WAVE_BAND + pillar.radius) continue;
        this.#direction.set(pillar.position.x - wave.center.x, 0, pillar.position.z - wave.center.z).normalize();
        this.pillars.shatter(pillar, this.#direction, 6);
      }
    }
  }
}
