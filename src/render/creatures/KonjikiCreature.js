import * as THREE from 'three';
import { BladeProfile } from '../blades/BladeProfile.js';
import { createBladeGeometry } from '../blades/createBladeGeometry.js';
import { createBladeMaterial } from '../blades/createBladeMaterial.js';
import { createJizoHead } from './createJizoHead.js';
import { SegmentChain } from '../../sim/SegmentChain.js';

const LEG = new BladeProfile({ length: 1.5, width: 0.13, thickness: 0.04, curvature: 0.2, tipStart: 0.7, taper: 0.3 });
const GOLD = new THREE.Color('#e0b24a');
const GOLD_DARK = new THREE.Color('#b9862b');
const VIOLET = new THREE.Color('#5b2a86');
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);

/**
 * Konjiki Ashisogi Jizō: a giant golden larva with Jizō's haloed baby head and rows of
 * blade legs. Its body is a SegmentChain — move `chain.head` and the body follows.
 */
export class KonjikiCreature {
  #tangent = new THREE.Vector3();
  #side = new THREE.Vector3();
  #down = new THREE.Vector3();
  #legDir = new THREE.Vector3();
  #matrix = new THREE.Matrix4();
  #quaternion = new THREE.Quaternion();
  #scale = new THREE.Vector3();
  #position = new THREE.Vector3();
  #forward = new THREE.Vector3();

  constructor({ segments, size, atmosphere, start }) {
    this.size = size;
    this.segmentCount = segments;
    this.group = new THREE.Group();
    this.chain = new SegmentChain(segments, size * 0.62, start);

    const bodyCount = segments - 1;
    this.body = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 28, 20),
      new THREE.MeshStandardMaterial({ metalness: 0.45, roughness: 0.32, emissive: '#2b1a05' }),
      bodyCount,
    );
    for (let i = 0; i < bodyCount; i++) this.body.setColorAt(i, this.#bandColor(i));

    const legGeometry = createBladeGeometry(LEG, 32);
    legGeometry.setAttribute('iDissolve', new THREE.InstancedBufferAttribute(new Float32Array(bodyCount * 2), 1));
    this.legs = new THREE.InstancedMesh(
      legGeometry,
      createBladeMaterial(atmosphere, { steel: '#8f6bb8', shadow: '#1d1028', glow: '#d4ff5a' }),
      bodyCount * 2,
    );

    const head = createJizoHead();
    this.head = head.group;
    this.halo = head.halo;
    this.mouth = head.mouth;
    this.head.scale.setScalar(size * 1.35);

    for (const mesh of [this.body, this.legs]) mesh.frustumCulled = false;
    this.group.add(this.body, this.legs, this.head);
  }

  radiusAt(i) {
    const u = i / (this.segmentCount - 1);
    return this.size * (1.05 - 0.72 * u ** 1.2);
  }

  /** Direction the head is facing. */
  get forward() {
    return this.chain.tangentAt(0, this.#forward);
  }

  mouthPosition(out) {
    return this.mouth.getWorldPosition(out);
  }

  update(dt, time, { legSpeed }) {
    this.chain.update(dt);
    this.#placeHead(time);
    this.#placeBody(time, legSpeed);
  }

  #placeHead(time) {
    const head = this.chain.head;
    this.head.position.copy(head);
    this.head.lookAt(this.#position.copy(head).add(this.forward));
    this.halo.rotation.z = time * 0.2;
    this.head.updateMatrixWorld(true);
  }

  #placeBody(time, legSpeed) {
    const { points } = this.chain;
    const legScale = this.size * 1.5;

    for (let i = 1; i < points.length; i++) {
      const r = this.radiusAt(i);
      const tangent = this.chain.tangentAt(i, this.#tangent);
      this.#quaternion.setFromUnitVectors(FORWARD, tangent);
      this.#scale.set(r * 1.05, r * 0.92, r * 0.8);
      this.body.setMatrixAt(i - 1, this.#matrix.compose(points[i], this.#quaternion, this.#scale));

      // Legs row along the body like oars, in a travelling wave.
      this.#side.crossVectors(tangent, WORLD_UP);
      if (this.#side.lengthSq() < 1e-6) this.#side.set(1, 0, 0);
      this.#side.normalize();
      this.#down.crossVectors(this.#side, tangent).normalize().negate();
      const phase = time * legSpeed - i * 0.55;
      const swing = Math.sin(phase);
      const lift = Math.max(0, Math.cos(phase)) * 0.35;

      for (const side of [-1, 1]) {
        this.#legDir
          .copy(this.#side)
          .multiplyScalar(side * 0.75)
          .addScaledVector(this.#down, 0.65 - lift)
          .addScaledVector(tangent, swing * 0.55)
          .normalize();
        this.#position.copy(points[i]).addScaledVector(this.#side, side * r * 0.8).addScaledVector(this.#down, r * 0.25);
        this.#quaternion.setFromUnitVectors(WORLD_UP, this.#legDir);
        this.#scale.setScalar(legScale * (0.6 + 0.4 * (r / this.size)));
        const index = (i - 1) * 2 + (side > 0 ? 1 : 0);
        this.legs.setMatrixAt(index, this.#matrix.compose(this.#position, this.#quaternion, this.#scale));
      }
    }
    this.body.instanceMatrix.needsUpdate = true;
    this.legs.instanceMatrix.needsUpdate = true;
  }

  #bandColor(i) {
    if (i % 5 === 4) return VIOLET;
    return i % 2 ? GOLD_DARK : GOLD;
  }
}
