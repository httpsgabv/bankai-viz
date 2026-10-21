import * as THREE from 'three';
import { ParamSource } from '../utils/ParamSource.js';
import { disposeObject } from '../utils/dispose.js';

/**
 * Base class for a zanpakutō release (shikai, bankai, ...).
 * A release owns everything it puts in the scene under `root`, exposes tweakable params
 * through its schema, and tells the app how to frame it via `view`.
 *
 * context: { stage, pointer, cameraRig, floorY }
 */
export class Release extends ParamSource {
  /** Point the floor shadow follows. */
  focus = new THREE.Vector3();

  constructor(context, schema) {
    super(schema);
    this.context = context;
    this.root = new THREE.Group();
  }

  /** { camera: { position, target }, fog: { near, far }, focus: [x, y, z] } */
  get view() {
    throw new Error(`${this.constructor.name} must define a view`);
  }

  mount() {
    this.context.stage.scene.add(this.root);
  }

  /** Optional short live readout shown in the HUD (e.g. "Paralysis 40%"), or null. */
  get status() {
    return null;
  }

  update(_dt, _time) {}

  /** Seal the zanpakutō again and re-run the release. */
  replay() {}

  onPointerDown() {}

  onPointerUp() {}

  dispose() {
    this.root.removeFromParent();
    disposeObject(this.root);
  }
}
