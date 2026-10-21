import * as THREE from 'three';
import { sampleBladeAnchors, transformAnchors } from '../render/blades/sampleBladeAnchors.js';
import { DissolveEmitter } from '../sim/DissolveEmitter.js';
import { AnchorTargets } from '../sim/targets/AnchorTargets.js';
import { Sequence } from '../utils/Sequence.js';
import { easeInOutCubic } from '../utils/math.js';

const IDENTITY = new THREE.Matrix4();

/**
 * A katana whose blade breaks apart, tip first, into a particle swarm — and can be
 * reformed by calling the particles back. Shared by releases like Senbonzakura and Haineko.
 *
 * While `returning` is true the release should steer particles at `anchorTargets`.
 */
export class DisintegratingBlade {
  returning = false;
  dissolve = new Float32Array(1);

  constructor({ katana, profile }) {
    this.katana = katana;
    this.profile = profile;
  }

  /** Attaches a (new) swarm: every particle gets a home on the blade, hidden until released. */
  bind(swarm) {
    // Anchors live in blade space and are re-projected each frame, so they follow the katana.
    const anchors = sampleBladeAnchors(this.profile, [IDENTITY], swarm.count);
    this.localAnchors = anchors.anchors.slice();
    transformAnchors(this.localAnchors, this.katana.bladeMatrix, anchors.anchors);
    this.emitter = new DissolveEmitter(swarm, anchors);
    this.anchorTargets = new AnchorTargets(anchors.anchors);
  }

  /** Call after moving the katana: updates anchors, the blade's look and which particles are free. */
  sync(ejectSpeed) {
    transformAnchors(this.localAnchors, this.katana.bladeMatrix, this.emitter.anchors);
    this.katana.dissolve = this.dissolve[0];
    this.emitter.sync(this.dissolve, ejectSpeed);
  }

  /** Sealed for a moment, then the blade scatters. */
  releaseSequence({ sealed = 0.9, scatter = 2.4 } = {}) {
    return new Sequence([{ name: 'sealed', duration: sealed }, this.#scatterStep(scatter)]).start();
  }

  /** Particles fly home, the blade reforms, then it scatters again. */
  reformSequence({ gather = 1.3, reform = 1.1, sealed = 0.5, scatter = 2.4 } = {}) {
    return new Sequence([
      { name: 'gather', duration: gather, enter: () => (this.returning = true) },
      { name: 'reform', duration: reform, update: (p) => (this.dissolve[0] = 1 - easeInOutCubic(p)) },
      { name: 'sealed', duration: sealed, enter: () => (this.returning = false) },
      this.#scatterStep(scatter),
    ]).start();
  }

  #scatterStep(duration) {
    return { name: 'scatter', duration, update: (p) => (this.dissolve[0] = easeInOutCubic(p)) };
  }
}
