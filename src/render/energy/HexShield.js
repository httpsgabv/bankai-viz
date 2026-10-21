import * as THREE from 'three';
import vertexShader from './shaders/hex.vert.glsl?raw';
import fragmentShader from './shaders/hex.frag.glsl?raw';
import { clamp01, damp } from '../../utils/math.js';

const SHATTER_TIME = 0.7;

/** Axial hex coordinates within `rings` of the centre, with their ring index. */
function hexCells(rings) {
  const cells = [];
  for (let q = -rings; q <= rings; q++) {
    for (let r = Math.max(-rings, -q - rings); r <= Math.min(rings, -q + rings); r++) {
      cells.push({ q, r, ring: Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) });
    }
  }
  return cells;
}

/**
 * "Chikasumi no Tate" — a honeycomb shield of blood mist that assembles ring by ring
 * from its centre while raised, and shatters outwards when dropped. Always faces the camera.
 */
export class HexShield {
  #strength = 0;
  #raised = false;
  #shatterAge = -1;
  #matrix = new THREE.Matrix4();
  #position = new THREE.Vector3();
  #quaternion = new THREE.Quaternion();
  #scale = new THREE.Vector3();

  constructor(atmosphere, { rings = 3, cellSize = 0.32, color = '#c8102e' } = {}) {
    this.rings = rings;
    this.cellSize = cellSize;
    this.cells = hexCells(rings).map((cell) => ({
      ...cell,
      home: new THREE.Vector3(cellSize * Math.sqrt(3) * (cell.q + cell.r / 2), cellSize * 1.5 * cell.r, 0),
      drift: new THREE.Vector3(),
      spin: (Math.random() - 0.5) * 6,
    }));

    const geometry = new THREE.CylinderGeometry(1, 1, 0.04, 6, 1).rotateX(Math.PI / 2);
    this.reveal = new THREE.InstancedBufferAttribute(new Float32Array(this.cells.length), 1);
    this.reveal.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('iReveal', this.reveal);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { ...atmosphere, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 } },
    });

    this.mesh = new THREE.InstancedMesh(geometry, this.material, this.cells.length);
    this.mesh.frustumCulled = false;
    this.object = new THREE.Group();
    this.object.add(this.mesh);
  }

  get isUp() {
    return this.#raised && this.#strength > 0.2;
  }

  get radius() {
    return this.cellSize * (this.rings * 1.75 + 1);
  }

  setColor(color) {
    this.material.uniforms.uColor.value.set(color);
  }

  raise() {
    this.#raised = true;
    this.#shatterAge = -1;
  }

  shatter() {
    if (!this.#raised) return;
    this.#raised = false;
    this.#shatterAge = 0;
    for (const cell of this.cells) {
      cell.drift.copy(cell.home).normalize().multiplyScalar(2 + Math.random() * 3);
      cell.drift.z = (Math.random() - 0.2) * 3;
    }
  }

  /** Keeps the shield at `position`, facing the camera. */
  update(dt, camera, position) {
    if (this.#shatterAge < 0) this.object.position.copy(position);
    this.object.quaternion.copy(camera.quaternion);
    this.#strength = damp(this.#strength, this.#raised ? 1 : 0, 3.5, dt);

    const shattering = this.#shatterAge >= 0;
    if (shattering) this.#shatterAge += dt;
    const shatter = shattering ? clamp01(this.#shatterAge / SHATTER_TIME) : 0;

    this.cells.forEach((cell, i) => {
      const grow = shattering ? 1 - shatter : clamp01(this.#strength * (this.rings + 1.5) - cell.ring);
      this.reveal.array[i] = grow;
      this.#position.copy(cell.home).addScaledVector(cell.drift, shatter);
      this.#quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, cell.spin * shatter);
      this.#scale.setScalar(this.cellSize * 0.94 * (shattering ? 1 : 0.4 + 0.6 * grow));
      this.mesh.setMatrixAt(i, this.#matrix.compose(this.#position, this.#quaternion, this.#scale));
    });
    if (shatter >= 1) this.#shatterAge = -1;

    this.mesh.instanceMatrix.needsUpdate = true;
    this.reveal.needsUpdate = true;
    this.object.visible = this.#raised || shattering || this.#strength > 0.01;
  }
}
