import * as THREE from 'three';
import { Release } from '../Release.js';
import { shikaiSchema } from './schemas/shikaiSchema.js';
import { SectionStaff } from '../../sim/SectionStaff.js';
import { SectionStaffMesh } from '../../render/weapons/SectionStaffMesh.js';
import { HozukiLanterns } from '../../effects/HozukiLanterns.js';
import { Sequence } from '../../utils/Sequence.js';
import { closestOnSegment, damp, easeOutCubic } from '../../utils/math.js';

const REST_GRIP = new THREE.Vector3(0, 2.2, 0);
const UPRIGHT = new THREE.Vector3(0.3, 1, 0.08).normalize();
const TAP_SECONDS = 0.2;
const MIN_HIT_SPEED = 1.5;
const HIT_COOLDOWN = 0.25;
const SHAFT_RADIUS = 0.08;
const LANTERN_BOUNDS = { min: [-7, 2.6, -1.4], max: [7, 6.2, 0.8] };
const TURN = Math.PI * 2;

/**
 * "Nobiro, Hōzukimaru" — the spear extends and is held by its end at the cursor, swinging
 * with real momentum through a night of hanging hōzuki lanterns.
 * Tap: split into the three-section staff (sansetsukon) on chains, or join it back.
 * Hold: twirl it.
 */
export class HozukimaruShikai extends Release {
  #pressTime = -1;
  #twirl = 0;
  #twirlAngle = 0;
  #grip = new THREE.Vector3();
  #upright = new THREE.Vector3();
  #axis = new THREE.Vector3();
  #velocityA = new THREE.Vector3();
  #velocityB = new THREE.Vector3();
  #hitVelocity = new THREE.Vector3();
  #closest = new THREE.Vector3();

  constructor(context) {
    super(context, shikaiSchema);
    this.staff = new SectionStaff({ lengths: [1.25, 1.25, 1.25], chainLength: this.params.chain });
    this.staff.floorY = context.floorY + 0.06;
    this.staffMesh = new SectionStaffMesh(this.staff, { atmosphere: context.stage.atmosphere, tuftColor: this.params.tuft });
    this.root.add(this.staffMesh.object);

    this.#buildLanterns();
    this.sequence = this.#extendSequence();
  }

  get view() {
    return {
      camera: { position: [0, 3.8, 14], target: [0, 3.6, 0] },
      fog: { near: 14, far: 46 },
      focus: [0, 3.4, 0],
    };
  }

  get status() {
    const mode = this.#twirl > 0.5 ? 'Twirl' : this.staff.split ? 'Sansetsukon' : null;
    const hits = this.lanterns.hits ? `Hits ${this.lanterns.hits}` : null;
    return [mode, hits].filter(Boolean).join(' · ') || null;
  }

  update(dt, time) {
    const { pointer } = this.context;
    const p = this.params;
    this.sequence.update(dt);
    this.#updateTwirl(dt);

    this.#grip.copy(REST_GRIP).add(pointer.depthOffset).lerp(pointer.world, pointer.presence);
    Object.assign(this.staff, { grip: p.grip, damping: p.damping, chainLength: p.chain });
    this.staff.update(dt, this.#grip, this.#upright);
    this.staffMesh.update(dt);

    this.#strikeLanterns(dt);
    this.lanterns.update(dt, time);
    this.focus.copy(this.staff.tip);
  }

  replay() {
    this.staff.split = false;
    this.sequence = this.#extendSequence();
  }

  onPointerDown() {
    this.#pressTime = 0;
  }

  onPointerUp() {
    if (this.#pressTime >= 0 && this.#pressTime < TAP_SECONDS) this.staff.split = !this.staff.split;
    this.#pressTime = -1;
  }

  onParamsChanged(definitions) {
    if (definitions.some((def) => def.rebuild)) this.#buildLanterns();
    this.lanterns.setColor(this.params.lanternColor);
    this.staffMesh.setTuftColor(this.params.tuft);
  }

  /** Sealed as a short staff, then "Nobiro!" — it extends to full length. */
  #extendSequence() {
    return new Sequence([
      { name: 'sealed', duration: 0.5, update: () => (this.staff.extension = 0.3) },
      { name: 'extend', duration: 0.7, update: (p) => (this.staff.extension = 0.3 + 0.7 * easeOutCubic(p)) },
    ]).start();
  }

  #buildLanterns() {
    if (this.lanterns) {
      this.lanterns.object.removeFromParent();
      this.lanterns.object.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
    }
    const { lanterns, lanternSize, lanternColor } = this.params;
    this.lanterns = new HozukiLanterns({ count: lanterns, ...LANTERN_BOUNDS, size: lanternSize, color: lanternColor });
    this.lanternCooldown = new Float32Array(lanterns);
    this.root.add(this.lanterns.object);
  }

  /** Holding spins the staff around the view axis; letting go eases it back upright. */
  #updateTwirl(dt) {
    if (this.#pressTime >= 0) this.#pressTime += dt;
    const holding = this.#pressTime >= TAP_SECONDS;
    this.#twirl = damp(this.#twirl, holding ? 1 : 0, 4, dt);
    if (holding) this.#twirlAngle += this.params.twirlSpeed * this.#twirl * dt;
    else this.#twirlAngle = damp(this.#twirlAngle, Math.round(this.#twirlAngle / TURN) * TURN, 2.5, dt);

    this.context.stage.camera.getWorldDirection(this.#axis);
    this.#upright.copy(UPRIGHT).applyAxisAngle(this.#axis, this.#twirlAngle);
  }

  /** Any section moving fast enough through a lantern knocks it along. */
  #strikeLanterns(dt) {
    const { staff, lanterns } = this;
    const radius = lanterns.radius + SHAFT_RADIUS;
    for (let i = 0; i < lanterns.sim.count; i++) {
      this.lanternCooldown[i] = Math.max(0, this.lanternCooldown[i] - dt);
      if (this.lanternCooldown[i] > 0) continue;
      const center = lanterns.sim.positions[i];
      for (let s = 0; s < 3; s++) {
        const [a, b] = staff.sections[s];
        const t = closestOnSegment(center, a, b);
        this.#closest.lerpVectors(a, b, t);
        if (this.#closest.distanceTo(center) > radius) continue;
        staff.velocity(s * 2, dt, this.#velocityA);
        staff.velocity(s * 2 + 1, dt, this.#velocityB);
        this.#hitVelocity.lerpVectors(this.#velocityA, this.#velocityB, t);
        if (this.#hitVelocity.length() < MIN_HIT_SPEED) continue;
        lanterns.strike(i, this.#hitVelocity.multiplyScalar(this.params.force), dt);
        this.lanternCooldown[i] = HIT_COOLDOWN;
        break;
      }
    }
  }
}
