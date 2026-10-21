import * as THREE from 'three';

const GRAVITY = new THREE.Vector3(0, -9, 0);
const ITERATIONS = 10;

/**
 * Hōzukimaru's three-section staff as Verlet points. The handle's end is held at the grip
 * and sprung towards an "upright" direction, so fast moves make it lag and swing.
 *
 * - joined: the middle and head sections continue the handle in a straight rigid line
 *   (placed kinematically, but keeping momentum so they whip when split).
 * - split: the sections are linked by chains and swing freely (sansetsukon).
 *
 * Points per section: [start, end]. Section 0 starts at the grip.
 */
export class SectionStaff {
  split = false;
  /** How hard the handle is held towards `upright` (1/s). */
  grip = 8;
  damping = 0.992;
  floorY = -Infinity;
  /** 0 → 1 multiplier on section lengths (the "Nobiro" extension). */
  extension = 1;

  #scratch = new THREE.Vector3();
  #direction = new THREE.Vector3();

  constructor({ lengths = [1.2, 1.2, 1.2], chainLength = 0.6 } = {}) {
    this.lengths = lengths;
    this.chainLength = chainLength;
    this.points = Array.from({ length: 6 }, (_, i) => new THREE.Vector3(0, i * 0.6, 0));
    this.previous = this.points.map((point) => point.clone());
  }

  /** [[start, end], ...] for each section. */
  get sections() {
    const p = this.points;
    return [
      [p[0], p[1]],
      [p[2], p[3]],
      [p[4], p[5]],
    ];
  }

  get tip() {
    return this.points[5];
  }

  /** Velocity of point `index` over the last step. */
  velocity(index, dt, out) {
    return out.subVectors(this.points[index], this.previous[index]).divideScalar(Math.max(dt, 1e-4));
  }

  update(dt, grip, upright) {
    const { points, previous } = this;
    const [handle, middle, head] = this.lengths.map((length) => length * this.extension);

    // The grip is pinned to the cursor.
    previous[0].copy(points[0]);
    points[0].copy(grip);

    // Handle end: Verlet step + spring towards the upright pose.
    this.#integrate(1, dt);
    this.#scratch.copy(grip).addScaledVector(upright, handle);
    points[1].lerp(this.#scratch, Math.min(1, this.grip * dt));
    this.#constrain(0, 1, handle, true);

    if (this.split) this.#updateSplit(dt, middle, head);
    else this.#updateJoined(middle, head);

    for (const point of points) point.y = Math.max(point.y, this.floorY);
  }

  #updateJoined(middle, head) {
    const { points, previous } = this;
    this.#direction.subVectors(points[1], points[0]).normalize();
    const place = (index, from, distance) => {
      previous[index].copy(points[index]);
      points[index].copy(points[from]).addScaledVector(this.#direction, distance);
    };
    place(2, 1, 0);
    place(3, 2, middle);
    place(4, 3, 0);
    place(5, 4, head);
  }

  #updateSplit(dt, middle, head) {
    for (let i = 2; i < 6; i++) this.#integrate(i, dt);
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      this.#constrain(0, 1, this.lengths[0] * this.extension, true);
      this.#rope(1, 2, this.chainLength);
      this.#constrain(2, 3, middle);
      this.#rope(3, 4, this.chainLength);
      this.#constrain(4, 5, head);
    }
  }

  #integrate(index, dt) {
    const point = this.points[index];
    const prev = this.previous[index];
    this.#scratch.subVectors(point, prev).multiplyScalar(this.damping);
    prev.copy(point);
    point.add(this.#scratch).addScaledVector(GRAVITY, dt * dt);
  }

  /** Exact distance between two points; `pinFirst` keeps point a fixed. */
  #constrain(a, b, length, pinFirst = false) {
    const pa = this.points[a];
    const pb = this.points[b];
    this.#scratch.subVectors(pb, pa);
    const distance = this.#scratch.length() || 1e-6;
    const error = (distance - length) / distance;
    if (pinFirst) {
      pb.addScaledVector(this.#scratch, -error);
    } else {
      pa.addScaledVector(this.#scratch, error * 0.5);
      pb.addScaledVector(this.#scratch, -error * 0.5);
    }
  }

  /** Like a chain: only pulls when the points drift further apart than `length`. */
  #rope(a, b, length) {
    if (this.points[a].distanceTo(this.points[b]) > length) this.#constrain(a, b, length);
  }
}
