import * as THREE from 'three';
import { Release } from '../Release.js';
import { shikaiSchema } from './schemas/shikaiSchema.js';
import { BladeProfile } from '../../render/blades/BladeProfile.js';
import { Katana } from '../../render/blades/Katana.js';
import { PetalStorm } from '../../effects/PetalStorm.js';
import { DisintegratingBlade } from '../../effects/DisintegratingBlade.js';
import { PointerTrail } from '../../sim/PointerTrail.js';
import { SeekForce } from '../../sim/forces/SeekForce.js';
import { SwirlForce } from '../../sim/forces/SwirlForce.js';
import { FlowForce } from '../../sim/forces/FlowForce.js';
import { BoundsForce } from '../../sim/forces/BoundsForce.js';
import { TrailTargets } from '../../sim/targets/TrailTargets.js';

const PROFILE = new BladeProfile({ length: 3.6, width: 0.17, thickness: 0.04, curvature: 0.035 });
const KATANA_POSITION = new THREE.Vector3(0, 1.3, 0);
/** Where petals drift when the cursor is away. */
const ROAM_CENTER = new THREE.Vector3(0, 2.8, 0);
const ROAM_RADIUS = 3.5;

/**
 * "Chire, Senbonzakura" — the katana's blade scatters, tip first, into a ribbon of
 * petals that streams after the cursor. The hilt stays behind.
 */
export class SenbonzakuraShikai extends Release {
  constructor(context) {
    super(context, shikaiSchema);

    this.katana = new Katana({ profile: PROFILE, atmosphere: context.stage.atmosphere });
    this.katana.group.position.copy(KATANA_POSITION);
    this.katana.group.rotation.set(0, 0.55, -0.06);
    this.root.add(this.katana.group);
    this.blade = new DisintegratingBlade({ katana: this.katana, profile: PROFILE });

    this.trail = new PointerTrail(256);
    this.seek = new SeekForce();
    this.swirl = new SwirlForce({ axis: [0, 0, 1] });
    this.flow = new FlowForce();
    this.bounds = new BoundsForce();
    this.bounds.radius = ROAM_RADIUS;

    this.#build();
    this.sequence = this.blade.releaseSequence();
  }

  get view() {
    return {
      camera: { position: [0, 3.1, 13], target: [0, 2.8, 0] },
      fog: { near: 14, far: 60 },
      focus: [0, 2.8, 0],
    };
  }

  update(dt, time) {
    const { pointer } = this.context;
    this.trail.update(dt, pointer.world);
    this.sequence.update(dt);
    // Keep the katana on the same depth plane as the petals when the user scrolls.
    this.katana.group.position.copy(KATANA_POSITION).add(pointer.depthOffset);
    this.blade.sync(1.5);

    this.#syncForces();
    this.storm.update(dt, time);
    this.focus.copy(pointer.world);
  }

  replay() {
    this.sequence = this.blade.reformSequence();
  }

  onPointerDown() {
    const { burst, spread } = this.params;
    this.storm.swarm.impulse(this.context.pointer.world, burst, 3 + spread * 2);
  }

  onParamsChanged(definitions) {
    if (definitions.some((def) => def.rebuild)) this.#build();
    else this.#applyAppearance();
  }

  dispose() {
    this.storm.dispose();
    super.dispose();
  }

  #build() {
    this.storm?.dispose();
    const { count } = this.params;
    this.storm = new PetalStorm({
      count,
      atmosphere: this.context.stage.atmosphere,
      forces: [this.seek, this.swirl, this.flow, this.bounds],
      floorY: this.context.floorY + 0.04,
    });
    this.root.add(this.storm.object);

    this.blade.bind(this.storm.swarm);
    this.trailTargets = new TrailTargets(this.trail, count);
    this.#applyAppearance();
  }

  #syncForces() {
    const p = this.params;
    const { swarm } = this.storm;
    swarm.drag = 1.1;

    if (this.blade.returning) {
      this.seek.targets = this.blade.anchorTargets;
      this.seek.strength = 7;
      this.seek.maxSpeed = 24;
      this.seek.slowRadius = 0.6;
      swarm.maxSpeed = 24;
      this.swirl.strength = 0;
      this.flow.strength = 0.3;
      this.bounds.strength = 0;
      return;
    }

    // Follow the cursor while it is on the page; drift freely when it leaves.
    const { pointer } = this.context;
    const presence = pointer.presence;
    const roam = 1 - presence;

    this.trailTargets.length = p.streamLength;
    this.trailTargets.spread = p.spread;
    this.seek.targets = this.trailTargets;
    this.seek.strength = p.follow * presence;
    this.seek.maxSpeed = p.speed;
    this.seek.slowRadius = 1.2;
    swarm.maxSpeed = p.speed * 1.5;

    this.swirl.center.copy(pointer.world);
    this.swirl.strength = p.swirl * presence;
    this.swirl.radius = 1.2 + p.spread;
    this.flow.strength = p.turbulence + roam * 1.5;
    this.bounds.center.copy(ROAM_CENTER).add(pointer.depthOffset);
    this.bounds.strength = roam * 6;
  }

  #applyAppearance() {
    const { size, spin, colorBase, colorTip } = this.params;
    this.storm.setAppearance({ size, spin, colorBase, colorTip });
  }
}
