import * as THREE from 'three';
import { Release } from '../Release.js';
import { shikaiSchema } from './schemas/shikaiSchema.js';
import { BladeProfile } from '../../render/blades/BladeProfile.js';
import { Katana } from '../../render/blades/Katana.js';
import { MoteMesh } from '../../render/motes/MoteMesh.js';
import { DisintegratingBlade } from '../../effects/DisintegratingBlade.js';
import { SliceTargets } from '../../effects/SliceTargets.js';
import { ParticleSwarm } from '../../sim/ParticleSwarm.js';
import { SeekForce } from '../../sim/forces/SeekForce.js';
import { SwirlForce } from '../../sim/forces/SwirlForce.js';
import { FlowForce } from '../../sim/forces/FlowForce.js';
import { BoundsForce } from '../../sim/forces/BoundsForce.js';
import { OrbitTargets } from '../../sim/targets/OrbitTargets.js';
import { damp } from '../../utils/math.js';
import { EMBER } from './palette.js';

const PROFILE = new BladeProfile({ length: 3.4, width: 0.17, thickness: 0.04, curvature: 0.03 });
const KATANA_POSITION = new THREE.Vector3(0, 1.3, 0);
const ROAM_CENTER = new THREE.Vector3(0, 3, 0);
const TAP_SECONDS = 0.2;
const CUT_SPEED = 3;
const DAMAGE_PER_GRAIN = 0.02;
const TARGET_BOUNDS = { min: [-6, 1.4, -4], max: [6, 6, 0.5] };

/**
 * "Unare, Haineko" — the blade crumbles into a cloud of ash that prowls after the cursor.
 * Fast-moving ash glows like embers and slices the floating blocks it passes through.
 * Tap: the ash lashes out along your motion. Hold: it winds into a tight cutting vortex.
 */
export class HainekoShikai extends Release {
  #pressTime = -1;
  #vortex = 0;
  #motion = new THREE.Vector3();
  #lastPointer = new THREE.Vector3();
  #cloudCenter = new THREE.Vector3();

  constructor(context) {
    super(context, shikaiSchema);
    const { atmosphere } = context.stage;

    this.katana = new Katana({ profile: PROFILE, atmosphere, glow: EMBER });
    this.katana.group.position.copy(KATANA_POSITION);
    this.katana.group.rotation.set(0, 0.6, 0.05);
    this.blade = new DisintegratingBlade({ katana: this.katana, profile: PROFILE });
    this.targets = new SliceTargets({ ...TARGET_BOUNDS, color: this.params.block });
    this.root.add(this.katana.group, this.targets.object);

    this.seek = new SeekForce();
    this.swirl = new SwirlForce({ axis: [0, 1, 0] });
    this.flow = new FlowForce();
    this.flow.frequency = 0.35;
    this.bounds = new BoundsForce();
    this.bounds.radius = 4.5;

    this.#lastPointer.copy(context.pointer.world);
    this.#build();
    this.sequence = this.blade.releaseSequence({ sealed: 0.9, scatter: 2.6 });
  }

  get view() {
    return {
      camera: { position: [0, 3.3, 13], target: [0, 3, 0] },
      fog: { near: 12, far: 44 },
      focus: [0, 3, 0],
    };
  }

  get status() {
    if (this.#vortex > 0.5) return 'Ash vortex';
    return this.targets.sliced ? `Sliced · ${this.targets.sliced}` : null;
  }

  update(dt, time) {
    const { pointer, stage } = this.context;
    this.sequence.update(dt);
    this.#trackMotion(dt);
    this.#updatePress(dt);

    this.katana.group.position.copy(KATANA_POSITION).add(pointer.depthOffset);
    this.blade.sync(2);

    this.#syncForces(dt);
    this.swarm.update(dt, { dt, time });
    this.#updateEmbers(dt);
    this.#cutTargets(dt);
    this.targets.update(dt, time);
    this.mesh.sync(stage.viewportHeight);
    this.focus.copy(this.#cloudCenter);
  }

  replay() {
    this.sequence = this.blade.reformSequence({ scatter: 2.6 });
  }

  onPointerDown() {
    this.#pressTime = 0;
  }

  onPointerUp() {
    if (this.#pressTime >= 0 && this.#pressTime < TAP_SECONDS) this.#lash();
    this.#pressTime = -1;
  }

  onParamsChanged(definitions) {
    if (definitions.some((def) => def.rebuild)) this.#build();
    this.#applyAppearance();
  }

  dispose() {
    this.#disposeAsh();
    super.dispose();
  }

  #build() {
    this.#disposeAsh();
    const { count } = this.params;
    this.swarm = new ParticleSwarm(count);
    this.swarm.forces = [this.seek, this.swirl, this.flow, this.bounds];
    this.swarm.floorY = this.context.floorY + 0.04;
    this.heat = new Float32Array(count);
    this.mesh = new MoteMesh(this.swarm, this.heat, this.context.stage.atmosphere);
    this.root.add(this.mesh.object);

    this.blade.bind(this.swarm);
    this.orbit = new OrbitTargets(count, this.#cloudCenter);
    this.#applyAppearance();
  }

  #disposeAsh() {
    if (!this.mesh) return;
    this.mesh.object.removeFromParent();
    this.mesh.object.geometry.dispose();
    this.mesh.material.dispose();
  }

  /** Smoothed cursor velocity, used to aim the lash. */
  #trackMotion(dt) {
    const world = this.context.pointer.world;
    const velocity = this.#lastPointer.sub(world).multiplyScalar(-1 / Math.max(dt, 1e-3));
    this.#motion.lerp(velocity, 1 - Math.exp(-10 * dt));
    this.#lastPointer.copy(world);
  }

  #updatePress(dt) {
    if (this.#pressTime >= 0) this.#pressTime += dt;
    const holding = this.#pressTime >= TAP_SECONDS;
    this.#vortex = damp(this.#vortex, holding ? 1 : 0, holding ? 5 : 2.5, dt);
  }

  #lash() {
    const direction = this.#motion.lengthSq() > 0.5 ? this.#motion.clone().normalize() : this.#cloudCenter.clone().sub(this.katana.group.position).normalize();
    this.swarm.impulse(this.#cloudCenter, this.params.lash, this.params.cloudSize * 2.4, direction);
  }

  #syncForces(dt) {
    const p = this.params;
    const { pointer } = this.context;
    const swarm = this.swarm;
    swarm.drag = 1.2;

    if (this.blade.returning) {
      Object.assign(this.seek, { targets: this.blade.anchorTargets, strength: 7, maxSpeed: 26, slowRadius: 0.6 });
      swarm.maxSpeed = 26;
      this.swirl.strength = this.bounds.strength = 0;
      this.flow.strength = 0.3;
      return;
    }

    const presence = Math.max(pointer.presence, this.#vortex);
    const roam = 1 - presence;
    this.#cloudCenter.lerp(pointer.world, 1 - Math.exp(-6 * dt));

    // The vortex flattens the cloud into a fast-spinning cutting disc around the cursor.
    Object.assign(this.orbit, {
      radius: p.cloudSize,
      cohesion: 1,
      orbitSpeed: 0.5 + this.#vortex * 3,
      gather: this.#vortex * 0.35,
      flatten: this.#vortex,
    });
    Object.assign(this.seek, { targets: this.orbit, strength: p.follow * presence, maxSpeed: p.speed, slowRadius: 1.5 });
    swarm.maxSpeed = p.speed * (1.4 + this.#vortex);

    this.swirl.center.copy(this.#cloudCenter);
    this.swirl.strength = (1.5 + this.#vortex * p.vortex) * presence;
    this.swirl.radius = p.cloudSize;
    this.flow.strength = p.turbulence * (1 - this.#vortex * 0.6) + roam * 1.5;
    this.bounds.center.copy(ROAM_CENTER).add(pointer.depthOffset);
    this.bounds.strength = roam * 5;
  }

  /** Grains moving faster than the ember threshold glow; they cool as they slow. */
  #updateEmbers(dt) {
    const V = this.swarm.velocities;
    const threshold = this.params.emberSpeed;
    const cool = Math.exp(-3 * dt);
    for (let i = 0; i < this.swarm.count; i++) {
      const k = i * 3;
      const speed = Math.sqrt(V[k] * V[k] + V[k + 1] * V[k + 1] + V[k + 2] * V[k + 2]);
      this.heat[i] = Math.max(this.heat[i] * cool, Math.min(1, (speed - threshold) / 8));
    }
  }

  /** Blocks take damage from every fast grain passing through them. */
  #cutTargets(dt) {
    const P = this.swarm.positions;
    const V = this.swarm.velocities;
    const minSpeedSq = CUT_SPEED * CUT_SPEED;
    for (const target of this.targets.hittable()) {
      const { x, y, z } = target.center;
      const radiusSq = target.radius * target.radius;
      let hits = 0;
      for (let i = 0; i < this.swarm.count; i++) {
        if (!this.swarm.free[i]) continue;
        const k = i * 3;
        const dx = P[k] - x;
        const dy = P[k + 1] - y;
        const dz = P[k + 2] - z;
        if (dx * dx + dy * dy + dz * dz > radiusSq) continue;
        if (V[k] * V[k] + V[k + 1] * V[k + 1] + V[k + 2] * V[k + 2] > minSpeedSq) hits++;
      }
      if (hits) this.targets.damage(target, hits * DAMAGE_PER_GRAIN * this.params.sharpness * dt);
    }
  }

  #applyAppearance() {
    const p = this.params;
    this.mesh.setAppearance({ size: p.size, opacity: p.opacity, ink: p.ash, hot: p.ember });
    this.targets.setColor(p.block);
    this.katana.material.uniforms.uGlow.value.set(p.ember);
  }
}
