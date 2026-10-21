import * as THREE from 'three';
import { SegmentChain } from '../../sim/SegmentChain.js';
import { createIceMaterial } from '../materials/createIceMaterial.js';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * Hyōrinmaru's ice dragon: a long serpentine body of faceted ice crystals with a ridge
 * of dorsal spikes, and a horned head. Its body is a SegmentChain — move `chain.head`.
 */
export class IceDragon {
  #tangent = new THREE.Vector3();
  #side = new THREE.Vector3();
  #up = new THREE.Vector3();
  #lean = new THREE.Vector3();
  #basis = new THREE.Matrix4();
  #matrix = new THREE.Matrix4();
  #quaternion = new THREE.Quaternion();
  #scale = new THREE.Vector3();
  #position = new THREE.Vector3();
  #forward = new THREE.Vector3();

  constructor({ segments = 34, size = 1, start, color, glow }) {
    this.size = size;
    this.segmentCount = segments;
    this.chain = new SegmentChain(segments, size * 0.42, start);
    this.chain.sag = 0;
    this.material = createIceMaterial({ color, glow });
    this.group = new THREE.Group();

    const body = new THREE.OctahedronGeometry(1, 0).scale(0.62, 0.55, 1.25);
    this.body = new THREE.InstancedMesh(body, this.material, segments - 1);
    this.spikes = new THREE.InstancedMesh(new THREE.ConeGeometry(0.16, 0.7, 5), this.material, segments - 1);
    for (const mesh of [this.body, this.spikes]) mesh.frustumCulled = false;

    this.head = this.#createHead();
    this.group.add(this.body, this.spikes, this.head);
  }

  get forward() {
    return this.chain.tangentAt(0, this.#forward);
  }

  setColors({ color, glow }) {
    if (color) this.material.color.set(color);
    if (glow) this.material.emissive.set(glow);
  }

  radiusAt(i) {
    const u = i / (this.segmentCount - 1);
    return this.size * (0.6 - 0.48 * u ** 0.8);
  }

  /** Calls back (position, radius) for every body segment, head included. */
  forEachSegment(callback) {
    this.chain.points.forEach((point, i) => callback(point, i === 0 ? this.size * 0.7 : this.radiusAt(i)));
  }

  update(dt, time) {
    this.chain.update(dt);
    const head = this.chain.head;
    this.head.position.copy(head);
    this.head.lookAt(this.#position.copy(head).add(this.forward));

    const { points } = this.chain;
    for (let i = 1; i < points.length; i++) {
      const r = this.radiusAt(i) * (1 + 0.06 * Math.sin(time * 4 - i * 0.6));
      this.#frame(i);
      this.#quaternion.setFromRotationMatrix(this.#basis);
      this.#scale.setScalar(r);
      this.body.setMatrixAt(i - 1, this.#matrix.compose(points[i], this.#quaternion, this.#scale));

      // Dorsal spike leaning back along the body.
      this.#position.copy(points[i]).addScaledVector(this.#up, r * 0.6);
      this.#quaternion.setFromUnitVectors(WORLD_UP, this.#lean.copy(this.#up).addScaledVector(this.#tangent, -0.8).normalize());
      this.#scale.setScalar(r * 1.25);
      this.spikes.setMatrixAt(i - 1, this.#matrix.compose(this.#position, this.#quaternion, this.#scale));
    }
    this.body.instanceMatrix.needsUpdate = true;
    this.spikes.instanceMatrix.needsUpdate = true;
  }

  /** Side / up / tangent frame for segment i (keeps spikes on the dragon's back). */
  #frame(i) {
    this.chain.tangentAt(i, this.#tangent);
    this.#side.crossVectors(WORLD_UP, this.#tangent);
    if (this.#side.lengthSq() < 1e-6) this.#side.set(1, 0, 0);
    this.#side.normalize();
    this.#up.crossVectors(this.#tangent, this.#side).normalize();
    this.#basis.makeBasis(this.#side, this.#up, this.#tangent);
  }

  #createHead() {
    const s = this.size;
    const head = new THREE.Group();
    const skull = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0).scale(0.6 * s, 0.48 * s, 0.95 * s), this.material);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.34 * s, 1.1 * s, 6).rotateX(Math.PI / 2), this.material);
    snout.position.z = 0.9 * s;
    const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.24 * s, 0.9 * s, 5).rotateX(Math.PI / 2), this.material);
    jaw.position.set(0, -0.26 * s, 0.7 * s);
    jaw.rotation.x = 0.25;
    head.add(skull, snout, jaw);

    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s, 1.3 * s, 5), this.material);
      horn.position.set(side * 0.28 * s, 0.38 * s, -0.35 * s);
      horn.rotation.set(-1.15, 0, side * -0.35);
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.07 * s, 10, 8),
        new THREE.MeshBasicMaterial({ color: '#e8fbff' }),
      );
      eye.position.set(side * 0.3 * s, 0.14 * s, 0.42 * s);
      head.add(horn, eye);
    }
    return head;
  }
}
