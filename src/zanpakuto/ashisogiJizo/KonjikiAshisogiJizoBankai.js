import * as THREE from 'three';
import { Release } from '../Release.js';
import { bankaiSchema } from './schemas/bankaiSchema.js';
import { ToxicField } from './ToxicField.js';
import { KonjikiCreature } from '../../render/creatures/KonjikiCreature.js';
import { FlowForce } from '../../sim/forces/FlowForce.js';
import { ConstantForce } from '../../sim/forces/ConstantForce.js';
import { BoundsForce } from '../../sim/forces/BoundsForce.js';
import { SlitherSteering } from '../../sim/SlitherSteering.js';
import { Sequence } from '../../utils/Sequence.js';
import { damp } from '../../utils/math.js';

const ARENA_CENTER = new THREE.Vector3(0, 4, -5);
const BURROW_DEPTH = -9;
const TRICKLE_RATE = 120;
const NERVE_BOUNDS = { min: [-16, 0.3, -20], max: [16, 12, 6] };
const GRID_BOUNDS = { min: [-24, -2, -30], max: [24, 18, 12], cellSize: 1.25 };

/**
 * "Bankai — Konjiki Ashisogi Jizō" — the giant golden larva bursts out of the ground and
 * slithers after the cursor. Holding the mouse makes it exhale a poison cloud that
 * paralyses the nerve web; the poison's formula slowly mutates.
 */
export class KonjikiAshisogiJizoBankai extends Release {
  /** 'emerge' | 'hunt' | 'burrow' */
  #mode = 'emerge';
  #breathing = false;
  #hue = 0;
  #floorClamp = BURROW_DEPTH;
  #target = new THREE.Vector3();
  #mouth = new THREE.Vector3();
  #lure = new THREE.Vector3();

  constructor(context) {
    super(context, bankaiSchema);
    this.steering = new SlitherSteering();
    this.flow = new FlowForce();
    this.flow.frequency = 0.22;
    this.buoyancy = new ConstantForce(0, 0.25, 0);
    this.bounds = new BoundsForce();
    this.bounds.center.copy(ARENA_CENTER);
    this.bounds.radius = 18;

    this.#build();
    this.sequence = new Sequence(this.#emergeSteps()).start();
  }

  get view() {
    return {
      camera: { position: [0, 6, 20], target: [0, 3.5, -4] },
      fog: { near: 18, far: 62 },
      focus: [0, 3.5, 0],
    };
  }

  get status() {
    return this.field.status;
  }

  update(dt, time) {
    const p = this.params;
    this.sequence.update(dt);
    this.#steerHead(dt, time);

    const clampGoal = this.#mode === 'hunt' ? this.context.floorY + p.size * 0.5 : BURROW_DEPTH * 3;
    this.#floorClamp = damp(this.#floorClamp, clampGoal, 1.5, dt);
    this.creature.chain.minY = this.#floorClamp;
    this.creature.update(dt, time, { legSpeed: p.legSpeed });

    this.#hue += dt * p.mutation;
    this.field.setHue(this.#hue);
    this.field.lifecycle.rate = this.#mode === 'hunt' ? (this.#breathing ? p.breath : TRICKLE_RATE) : 0;
    this.flow.strength = p.turbulence;
    this.field.update(dt, time, this.context.stage.viewportHeight);

    this.focus.copy(this.creature.chain.head);
  }

  replay() {
    this.sequence = new Sequence([
      { name: 'burrow', duration: 2.2, enter: () => (this.#mode = 'burrow') },
      ...this.#emergeSteps(),
    ]).start();
  }

  onPointerDown() {
    this.#breathing = true;
  }

  onPointerUp() {
    this.#breathing = false;
  }

  onParamsChanged(definitions) {
    if (definitions.some((def) => def.rebuild)) {
      const head = this.creature.chain.head.clone();
      this.#build(head);
      this.#mode = 'hunt';
      this.#floorClamp = this.context.floorY;
    } else {
      this.field.applyParams(this.params);
    }
  }

  dispose() {
    this.field.dispose();
    super.dispose();
  }

  #build(start = new THREE.Vector3(0, BURROW_DEPTH, -2)) {
    const { atmosphere } = this.context.stage;
    if (this.creature) {
      this.creature.group.removeFromParent();
      this.creature.group.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
    }
    this.field?.dispose();

    this.creature = new KonjikiCreature({ segments: this.params.segments, size: this.params.size, atmosphere, start });
    this.field = new ToxicField({
      atmosphere,
      gasCount: this.params.gas,
      nodeCount: this.params.nodes,
      forces: [this.flow, this.buoyancy, this.bounds],
      floorY: this.context.floorY + 0.05,
      nerveBounds: NERVE_BOUNDS,
      gridBounds: GRID_BOUNDS,
    });
    this.root.add(this.creature.group, ...this.field.objects);
    this.field.lifecycle.emit = (i, out) => this.#emitFromMouth(out);
    this.field.applyParams(this.params);
    this.steering.reset();
  }

  #emergeSteps() {
    return [
      {
        name: 'emerge',
        duration: 2.8,
        enter: () => {
          this.#mode = 'emerge';
          this.field.purge();
        },
      },
      { name: 'hunt', duration: 0, enter: () => (this.#mode = 'hunt') },
    ];
  }

  /** Picks where the head wants to go, then steers it there with a speed limit. */
  #steerHead(dt, time) {
    const p = this.params;
    const { pointer } = this.context;
    const head = this.creature.chain.head;

    if (this.#mode === 'emerge') {
      this.#target.set(0, 6, -1);
    } else if (this.#mode === 'burrow') {
      this.#target.set(head.x, BURROW_DEPTH * 2, head.z);
    } else {
      // Circle around the cursor so the body keeps flowing, or roam when the cursor is away.
      const roam = this.#target.set(Math.sin(time * 0.3) * 8, 3.5 + Math.sin(time * 0.5) * 1.5, -6 + Math.cos(time * 0.27) * 6);
      const lure = this.#lure.set(
        Math.cos(time * 0.9) * p.circle,
        Math.sin(time * 1.3) * p.circle * 0.4,
        Math.sin(time * 0.9) * p.circle,
      ).add(pointer.world);
      roam.lerp(lure, pointer.presence);
      roam.y = Math.max(roam.y, this.context.floorY + p.size * 1.6);
    }

    this.steering.slither = p.slither;
    this.steering.steer(dt, time, head, this.#target, this.#mode === 'hunt' ? p.speed : 7);
  }

  #emitFromMouth(out) {
    const p = this.params;
    this.creature.mouthPosition(this.#mouth);
    const forward = this.creature.forward;
    const speed = (this.#breathing ? p.breathSpeed : 1) * (0.6 + Math.random() * 0.6);
    const spread = this.#breathing ? 2.2 : 0.6;
    for (let axis = 0; axis < 3; axis++) {
      out.position[axis] = this.#mouth.getComponent(axis) + (Math.random() - 0.5) * 0.3 * p.size;
      out.velocity[axis] = forward.getComponent(axis) * speed + (Math.random() - 0.5) * spread;
    }
    out.velocity[1] -= this.#breathing ? 0.8 : 0.3;
  }
}
