import * as THREE from 'three';
import { Release } from '../Release.js';
import { shikaiSchema } from './schemas/shikaiSchema.js';
import { ToxicField } from './ToxicField.js';
import { Trident } from '../../render/blades/Trident.js';
import { SeekForce } from '../../sim/forces/SeekForce.js';
import { FlowForce } from '../../sim/forces/FlowForce.js';
import { ConstantForce } from '../../sim/forces/ConstantForce.js';
import { OrbitTargets } from '../../sim/targets/OrbitTargets.js';
import { Sequence } from '../../utils/Sequence.js';
import { easeOutCubic } from '../../utils/math.js';

const PIVOT = new THREE.Vector3(0, 1.7, 0);
const UP = new THREE.Vector3(0, 1, 0);
const LUNGE_DURATION = 0.4;
const STRIKE_JET = 2.4;
const NERVE_BOUNDS = { min: [-9, 0.3, -5], max: [9, 7.8, 3] };
const GRID_BOUNDS = { min: [-14, -1, -10], max: [14, 12, 8], cellSize: 1 };

/**
 * "Kakimushire, Ashisogi Jizō" — the trident aims at the cursor and jets poison towards it.
 * A nerve web fills the space; where the gas lingers, nerves are paralysed and stop carrying
 * signals. Clicking lunges the trident forward in a poisoned strike.
 */
export class AshisogiJizoShikai extends Release {
  #open = 0;
  #aim = UP.clone();
  #lungeTime = -1;
  #jetBoost = 1;
  #tips = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  #desired = new THREE.Vector3();
  #orbitCenter = new THREE.Vector3();

  constructor(context) {
    super(context, shikaiSchema);

    this.trident = new Trident({ atmosphere: context.stage.atmosphere });
    this.trident.group.position.copy(PIVOT);
    this.root.add(this.trident.group);

    this.seek = new SeekForce();
    this.flow = new FlowForce();
    this.buoyancy = new ConstantForce(0, 0.4, 0);

    this.#build();
    this.sequence = new Sequence(this.#transformSteps()).start();
  }

  get view() {
    return {
      camera: { position: [0, 3.2, 13], target: [0, 2.8, 0] },
      fog: { near: 12, far: 46 },
      focus: [0, 2.8, 0],
    };
  }

  get status() {
    return this.field.status;
  }

  update(dt, time) {
    this.sequence.update(dt);
    this.trident.openness = this.#open;
    this.#updateTrident(dt);

    this.#syncForces();
    this.field.lifecycle.rate = this.params.emission * this.#open;
    this.field.update(dt, time, this.context.stage.viewportHeight);
    this.focus.copy(this.context.pointer.world);
  }

  replay() {
    this.field.purge();
    this.sequence = new Sequence([
      { name: 'close', duration: 0.6, update: (p) => (this.#open = 1 - easeOutCubic(p)) },
      ...this.#transformSteps(),
    ]).start();
  }

  onPointerDown() {
    if (this.#open < 0.5) return;
    this.#lungeTime = 0;
    this.#jetBoost = STRIKE_JET;
    this.field.lifecycle.burst(this.params.burst);
    this.#jetBoost = 1;
    const strikePoint = this.#aim.clone().multiplyScalar(this.trident.reach + this.params.lunge).add(this.trident.group.position);
    this.field.web.network.paralyseSphere(strikePoint, 1.8, 0.9);
  }

  onParamsChanged(definitions) {
    if (definitions.some((def) => def.rebuild)) this.#build();
    else this.field.applyParams(this.params);
  }

  dispose() {
    this.field.dispose();
    super.dispose();
  }

  #build() {
    this.field?.dispose();
    this.field = new ToxicField({
      atmosphere: this.context.stage.atmosphere,
      gasCount: this.params.gas,
      nodeCount: this.params.nodes,
      forces: [this.seek, this.flow, this.buoyancy],
      floorY: this.context.floorY + 0.05,
      nerveBounds: NERVE_BOUNDS,
      gridBounds: GRID_BOUNDS,
    });
    this.root.add(...this.field.objects);
    this.orbit = new OrbitTargets(this.params.gas, this.#orbitCenter);
    this.seek.targets = this.orbit;
    this.field.lifecycle.emit = (i, out) => this.#emitFromTip(i, out);
    this.field.applyParams(this.params);
  }

  #transformSteps() {
    return [
      { name: 'sealed', duration: 0.5, update: () => (this.#open = 0) },
      { name: 'transform', duration: 1.4, update: (p) => (this.#open = easeOutCubic(p)) },
    ];
  }

  /** Aims at the cursor (or straight up when it is away) and plays the lunge. */
  #updateTrident(dt) {
    const { pointer } = this.context;
    const group = this.trident.group;
    const base = PIVOT.clone().add(pointer.depthOffset);

    this.#desired.subVectors(pointer.world, base);
    if (this.#desired.length() < 0.8) this.#desired.copy(this.#aim);
    this.#desired.normalize().lerp(UP, 1 - pointer.presence * this.#open);
    this.#desired.y = Math.max(this.#desired.y, -0.3);
    this.#aim.lerp(this.#desired.normalize(), 1 - Math.exp(-6 * dt)).normalize();
    group.quaternion.setFromUnitVectors(UP, this.#aim);

    let thrust = 0;
    if (this.#lungeTime >= 0) {
      this.#lungeTime += dt;
      const t = Math.min(1, this.#lungeTime / LUNGE_DURATION);
      thrust = Math.sin(Math.PI * t) * this.params.lunge;
      if (t >= 1) this.#lungeTime = -1;
    }
    group.position.copy(base).addScaledVector(this.#aim, thrust);
    group.updateMatrixWorld(true);
    this.trident.tipPositions(this.#tips);
  }

  #emitFromTip(i, out) {
    const tip = this.#tips[i % 3];
    const speed = this.params.jetSpeed * this.#jetBoost * (0.6 + Math.random() * 0.6);
    for (let axis = 0; axis < 3; axis++) {
      out.position[axis] = tip.getComponent(axis) + (Math.random() - 0.5) * 0.12;
      out.velocity[axis] = this.#aim.getComponent(axis) * speed + (Math.random() - 0.5) * 1.2 * this.#jetBoost;
    }
  }

  #syncForces() {
    const p = this.params;
    const { pointer } = this.context;
    const { swarm } = this.field.cloud;
    swarm.drag = 1.4;
    swarm.maxSpeed = Math.max(8, p.jetSpeed * STRIKE_JET);

    this.#orbitCenter.copy(pointer.world);
    Object.assign(this.orbit, { radius: 2.6, cohesion: p.attraction, orbitSpeed: 0.8, gather: 0 });
    this.seek.strength = 1.2 * pointer.presence;
    this.seek.maxSpeed = 6;
    this.seek.slowRadius = 1.5;
    this.flow.strength = p.turbulence;
    this.flow.frequency = 0.4;
  }
}
