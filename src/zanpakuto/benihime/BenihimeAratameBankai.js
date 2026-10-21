import * as THREE from 'three';
import { Release } from '../Release.js';
import { bankaiSchema } from './schemas/bankaiSchema.js';
import { VoxelSculpture } from '../../sim/VoxelSculpture.js';
import { PointerTrail } from '../../sim/PointerTrail.js';
import { VoxelMesh } from '../../render/voxels/VoxelMesh.js';
import { NeedleThread } from '../../render/energy/NeedleThread.js';
import { StitchSeam } from '../../render/energy/StitchSeam.js';
import { BenihimeFigure } from '../../render/creatures/BenihimeFigure.js';
import { Sequence } from '../../utils/Sequence.js';
import { damp } from '../../utils/math.js';

const CENTER = new THREE.Vector3(0, 3.4, 0);
const RADIUS = 2.1;
const TAP_SECONDS = 0.22;
const FIGURE_POSITION = new THREE.Vector3(0, 0, -13);

/**
 * "Bankai — Kannonbiraki Benihime Aratame" — Benihime restructures whatever she touches.
 * Your cursor is her needle: it parts the voxels it passes through.
 * Tap: the sculpture re-forms into a new shape, in a wave spreading from the touch point.
 * Hold: "Kirisaki Benihime" cuts it in two; release and the halves are sewn back together.
 */
export class BenihimeAratameBankai extends Release {
  #pressTime = -1;
  #cutting = false;
  #needle = new THREE.Vector3();
  #cameraRight = new THREE.Vector3();

  constructor(context) {
    super(context, bankaiSchema);
    const { crimson } = this.params;

    this.trail = new PointerTrail(128);
    this.needle = new NeedleThread({ color: crimson });
    this.stitches = new StitchSeam({ color: crimson });
    this.figure = new BenihimeFigure({ crimson });
    this.figure.object.position.copy(FIGURE_POSITION);
    this.figure.object.scale.setScalar(1.2);
    this.root.add(this.needle.object, this.stitches.object, this.figure.object);

    this.#build();
    this.sequence = new Sequence(this.#assembleSteps()).start();
  }

  get view() {
    return {
      camera: { position: [0, 4.8, 14], target: [0, 4.8, -2] },
      fog: { near: 16, far: 52 },
      focus: [0, 3.6, 0],
    };
  }

  get status() {
    if (this.#cutting) return 'Kirisaki Benihime';
    const verb = this.sculpture.isRestructuring ? 'Restructuring' : 'Form';
    return `${verb} · ${this.sculpture.form.name}`;
  }

  update(dt, time) {
    const { pointer, stage } = this.context;
    const p = this.params;
    this.sequence.update(dt);

    this.trail.update(dt, pointer.world);
    this.#updatePress(dt);

    Object.assign(this.sculpture, {
      waveSpeed: p.waveSpeed,
      duration: p.duration,
      arc: p.arc,
      needleRadius: p.needleRadius,
      needlePush: p.needlePush,
      gap: p.gap,
    });
    this.sculpture.cut = damp(this.sculpture.cut, this.#cutting ? 1 : 0, this.#cutting ? 6 : 3, dt);
    const needleActive = pointer.presence > 0.3 && !this.#cutting;
    this.sculpture.update(dt, needleActive ? this.#needle.copy(pointer.world) : null);
    this.voxels.sync();

    this.needle.update(this.trail, stage.camera, pointer.presence);
    this.stitches.update(dt, {
      origin: this.sculpture.cutOrigin,
      normal: this.sculpture.cutNormal,
      halfGap: this.sculpture.gap * 0.5 * this.sculpture.cut,
      centerY: CENTER.y,
      height: RADIUS * 1.8,
      camera: stage.camera,
      closed: !this.#cutting && this.sculpture.cut < 0.05,
    });
    this.figure.setOpacity(p.figure);
    this.figure.update(dt, time);
    this.focus.copy(CENTER);
  }

  replay() {
    this.sculpture.scatter(14);
    this.figure.rise();
    this.sequence = new Sequence(this.#assembleSteps()).start();
  }

  onPointerDown() {
    this.#pressTime = 0;
  }

  onPointerUp() {
    if (this.#pressTime < 0) return;
    if (this.#cutting) {
      this.#cutting = false;
      this.stitches.sew();
    } else if (this.#pressTime < TAP_SECONDS) {
      this.sculpture.restructure(this.context.pointer.world);
    }
    this.#pressTime = -1;
  }

  onParamsChanged(definitions) {
    if (definitions.some((def) => def.rebuild)) {
      this.#build();
      this.sculpture.restructure(CENTER, this.sculpture.formIndex);
    }
    this.#applyColors();
  }

  #build() {
    this.voxels?.object.removeFromParent();
    this.voxels?.object.geometry.dispose();
    this.voxels?.object.material.dispose();
    const formIndex = this.sculpture?.formIndex ?? 0;
    this.sculpture = new VoxelSculpture(this.params.voxels, { center: CENTER, radius: RADIUS });
    this.sculpture.formIndex = formIndex;
    this.voxels = new VoxelMesh(this.sculpture, { ink: this.params.ink, hot: this.params.crimson });
    this.root.add(this.voxels.object);
  }

  /** Voxels fly in from all around and assemble, starting from the centre. */
  #assembleSteps() {
    return [
      { name: 'gather', duration: 0.5 },
      { name: 'assemble', duration: 0, enter: () => this.sculpture.restructure(CENTER, this.sculpture.formIndex) },
    ];
  }

  #updatePress(dt) {
    if (this.#pressTime < 0) return;
    this.#pressTime += dt;
    if (this.#pressTime >= TAP_SECONDS && !this.#cutting) {
      this.#cutting = true;
      this.#cameraRight.setFromMatrixColumn(this.context.stage.camera.matrixWorld, 0);
      this.sculpture.setCutPlane(this.context.pointer.world, this.#cameraRight);
    }
  }

  #applyColors() {
    const { crimson, ink } = this.params;
    this.voxels.setColors({ ink, hot: crimson });
    this.needle.setColor(crimson);
    this.stitches.setColor(crimson);
    this.figure.setColor(crimson);
  }
}
