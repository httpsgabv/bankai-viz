import * as THREE from 'three';
import { Release } from '../Release.js';
import { bankaiSchema } from './schemas/bankaiSchema.js';
import { BladeProfile } from '../../render/blades/BladeProfile.js';
import { BladeRows } from '../../render/blades/BladeRows.js';
import { sampleBladeAnchors } from '../../render/blades/sampleBladeAnchors.js';
import { PetalStorm } from '../../effects/PetalStorm.js';
import { DissolveEmitter } from '../../sim/DissolveEmitter.js';
import { SeekForce } from '../../sim/forces/SeekForce.js';
import { SwirlForce } from '../../sim/forces/SwirlForce.js';
import { FlowForce } from '../../sim/forces/FlowForce.js';
import { BoundsForce } from '../../sim/forces/BoundsForce.js';
import { OrbitTargets } from '../../sim/targets/OrbitTargets.js';
import { AnchorTargets } from '../../sim/targets/AnchorTargets.js';
import { Sequence } from '../../utils/Sequence.js';
import { clamp01, damp, easeInOutCubic } from '../../utils/math.js';

const PROFILE = new BladeProfile({ length: 7.5, width: 0.85, thickness: 0.1, curvature: 0, tipStart: 0.86, taper: 0.15 });
const STORM_CENTER = new THREE.Vector3(0, 4, -8);

/**
 * "Bankai — Senbonzakura Kageyoshi" — two rows of giant blades rise from the ground,
 * then scatter into a vast storm of petals that orbits the cursor.
 * Hold to gather the storm into a dense sphere, release to blast it outwards.
 */
export class SenbonzakuraBankai extends Release {
  #center = new THREE.Vector3();
  #gather = 0;
  #gathering = false;
  #returning = false;

  constructor(context) {
    super(context, bankaiSchema);

    this.seek = new SeekForce();
    this.vortex = new SwirlForce({ axis: [0, 1, 0] });
    this.storm = null;
    this.stormSwirl = new SwirlForce({ axis: [0, 1, 0] });
    this.stormSwirl.center.copy(STORM_CENTER);
    this.flow = new FlowForce();
    this.flow.frequency = 0.18;
    this.bounds = new BoundsForce();
    this.bounds.center.copy(STORM_CENTER);

    this.#center.copy(context.pointer.world);
    this.#build();
    this.sequence = this.#introSequence().start();
  }

  get view() {
    return {
      camera: { position: [0, 4.2, 20], target: [0, 3.6, -8] },
      fog: { near: 22, far: 80 },
      focus: [0, 3.8, 0],
    };
  }

  update(dt, time) {
    this.#center.lerp(this.context.pointer.world, 1 - Math.exp(-8 * dt));
    this.#gather = damp(this.#gather, this.#gathering ? 1 : 0, 5, dt);

    this.sequence.update(dt);
    this.blades.update();
    this.emitter.sync(this.blades.dissolve, 3);

    this.#syncForces();
    this.storm.update(dt, time);
    this.focus.copy(this.#center);
  }

  replay() {
    this.#gathering = false;
    this.sequence = new Sequence([
      { name: 'gather', duration: 1.8, enter: () => (this.#returning = true) },
      {
        name: 'reform',
        duration: 1.6,
        update: (p) => this.#stagger(this.blades.dissolve, p, 1.5, 0.5, (v) => 1 - easeInOutCubic(v), true),
      },
      { name: 'hold', duration: 0.6, enter: () => (this.#returning = false) },
      this.#scatterStep(),
    ]).start();
  }

  onPointerDown() {
    this.#gathering = true;
  }

  onPointerUp() {
    if (!this.#gathering) return;
    this.#gathering = false;
    const { burst, orbitRadius } = this.params;
    this.storm.swarm.impulse(this.#center, burst * (0.4 + this.#gather), orbitRadius * 4 + 4);
  }

  onParamsChanged(definitions) {
    if (definitions.some((def) => def.rebuild)) {
      this.#build();
      this.sequence = this.#introSequence().finish();
    } else {
      this.#applyAppearance();
    }
  }

  dispose() {
    this.storm.dispose();
    super.dispose();
  }

  #build() {
    if (this.blades) {
      this.blades.mesh.removeFromParent();
      this.blades.mesh.geometry.dispose();
      this.blades.mesh.material.dispose();
      this.blades.mesh.dispose();
    }
    this.storm?.dispose();

    const { atmosphere } = this.context.stage;
    const { count, blades } = this.params;

    this.blades = new BladeRows({ profile: PROFILE, perRow: blades, atmosphere });
    this.storm = new PetalStorm({
      count,
      atmosphere,
      forces: [this.seek, this.vortex, this.stormSwirl, this.flow, this.bounds],
      floorY: this.context.floorY + 0.04,
    });
    this.root.add(this.blades.mesh, this.storm.object);

    const anchors = sampleBladeAnchors(PROFILE, this.blades.finalMatrices, count);
    this.emitter = new DissolveEmitter(this.storm.swarm, anchors);
    this.orbitTargets = new OrbitTargets(count, this.#center);
    this.anchorTargets = new AnchorTargets(anchors.anchors);
    this.#applyAppearance();
  }

  #introSequence() {
    return new Sequence([
      { name: 'rise', duration: 2.6, update: (p) => this.#stagger(this.blades.rise, p, 1.7, 0.7, (v) => v) },
      { name: 'hold', duration: 0.6 },
      this.#scatterStep(),
    ]);
  }

  #scatterStep() {
    return {
      name: 'scatter',
      duration: 3.4,
      update: (p) => this.#stagger(this.blades.dissolve, p, 1.6, 0.6, easeInOutCubic),
    };
  }

  /** Spreads one animation over all blades, nearest first (or farthest first when reversed). */
  #stagger(values, progress, speed, spread, ease, reversed = false) {
    for (let i = 0; i < this.blades.count; i++) {
      const delay = reversed ? 1 - this.blades.delay(i) : this.blades.delay(i);
      values[i] = ease(clamp01(progress * speed - delay * spread));
    }
  }

  #syncForces() {
    const p = this.params;
    const { swarm } = this.storm;
    const gather = this.#gather;
    // Cursor-driven forces fade out when the mouse leaves the page; the storm keeps roaming.
    const presence = Math.max(this.context.pointer.presence, gather);
    swarm.drag = 0.8;

    if (this.#returning) {
      this.seek.targets = this.anchorTargets;
      this.seek.strength = 8;
      this.seek.maxSpeed = 42;
      this.seek.slowRadius = 1;
      swarm.maxSpeed = 42;
      this.vortex.strength = this.stormSwirl.strength = this.bounds.strength = 0;
      this.flow.strength = 0.3;
      return;
    }

    Object.assign(this.orbitTargets, {
      radius: p.orbitRadius,
      cohesion: p.cohesion,
      orbitSpeed: p.orbitSpeed,
      gather,
    });
    this.seek.targets = this.orbitTargets;
    this.seek.strength = (2.2 + gather * 4) * presence;
    this.seek.maxSpeed = p.speed * (1 + gather * 0.6);
    this.seek.slowRadius = 2;
    swarm.maxSpeed = p.speed * 1.6;

    this.vortex.center.copy(this.#center);
    this.vortex.strength = p.vortex * (1 + gather) * presence;
    this.vortex.radius = p.orbitRadius * 1.5;

    this.stormSwirl.strength = p.vortex * 0.35;
    this.stormSwirl.radius = p.stormRadius;
    this.flow.strength = p.turbulence * (1 - gather * 0.7) + (1 - presence) * 2;
    this.bounds.radius = p.stormRadius;
    this.bounds.strength = 1.5;
  }

  #applyAppearance() {
    const { size, spin, colorBase, colorTip } = this.params;
    this.storm.setAppearance({ size, spin, colorBase, colorTip });
  }
}
