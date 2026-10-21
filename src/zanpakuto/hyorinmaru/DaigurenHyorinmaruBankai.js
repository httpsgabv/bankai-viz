import * as THREE from 'three';
import { Release } from '../Release.js';
import { bankaiSchema } from './schemas/bankaiSchema.js';
import { IceRealm } from './IceRealm.js';
import { DaigurenWings } from '../../render/creatures/DaigurenWings.js';
import { IceBloom } from '../../effects/IceBloom.js';
import { IcePrison } from '../../effects/IcePrison.js';
import { DebrisField } from '../../effects/DebrisField.js';
import { Sequence } from '../../utils/Sequence.js';
import { damp, easeOutCubic } from '../../utils/math.js';

const REST_CENTER = new THREE.Vector3(0, 4.4, 0);
const TAP_SECONDS = 0.2;
const TECHNIQUE_SECONDS = 2.2;
const FADE_SECONDS = 3;

/**
 * "Bankai — Daiguren Hyōrinmaru" — great ice wings follow the cursor, with three ice
 * flowers behind them whose petals fall one by one as the bankai's time runs out.
 * Tap: "Hyōten Hyakkasō" — snow falls from the sky and blooms into ice flowers where it lands.
 * Hold: "Sennen Hyōrō" — ice pillars burst up around the cursor and close in; release shatters them.
 */
export class DaigurenHyorinmaruBankai extends Release {
  #center = REST_CENTER.clone();
  #goal = new THREE.Vector3();
  #ground = new THREE.Vector3();
  #lastPointer = new THREE.Vector3();
  #scratch = new THREE.Vector3();
  #velocity = new THREE.Vector3();
  #flap = 0;
  #pressTime = -1;
  #petalClock = 0;
  #technique = null;
  #techniqueAge = 0;
  #fadedAge = -1;

  constructor(context) {
    super(context, bankaiSchema);
    const { atmosphere } = context.stage;
    const { floorY } = context;

    this.realm = new IceRealm({ atmosphere, floorY, snow: this.params.snow });
    const ice = this.realm.iceMaterial;
    this.wings = new DaigurenWings({ material: ice });
    this.bloom = new IceBloom({
      atmosphere,
      material: ice,
      floorY,
      onBloom: (x, z) => this.realm.frost.deposit(x, z, 0.7, 0.5),
    });
    this.prison = new IcePrison({ material: ice, floorY });
    this.shards = new DebrisField({ capacity: 260, geometry: new THREE.OctahedronGeometry(0.5, 0).scale(0.5, 1.3, 0.5), material: ice, floorY, life: 3 });
    this.root.add(this.realm.root, this.wings.object, this.bloom.object, this.prison.object, this.shards.object);

    this.#lastPointer.copy(context.pointer.world);
    this.#applyParams();
    this.sequence = this.#unfoldSequence();
  }

  get view() {
    return {
      camera: { position: [0, 5, 18], target: [0, 3.8, -1] },
      fog: { near: 16, far: 52 },
      focus: [0, 4.4, 0],
    };
  }

  get status() {
    if (this.#fadedAge >= 0) return 'The last petal has fallen';
    if (this.#technique) return this.#technique;
    return `Petals · ${this.wings.petalsLeft} / ${this.wings.totalPetals}`;
  }

  update(dt, time) {
    const { pointer, stage } = this.context;
    const p = this.params;
    this.sequence.update(dt);
    this.#updatePress(dt);
    this.#updateTechnique(dt);

    // Wings glide after the cursor and beat harder the faster they move.
    const speed = this.#lastPointer.distanceTo(pointer.world) / Math.max(dt, 1e-3);
    this.#lastPointer.copy(pointer.world);
    this.#flap = damp(this.#flap, Math.min(1, speed / 12), 3, dt);
    this.#goal.copy(REST_CENTER).add(pointer.depthOffset).lerp(pointer.world, pointer.presence);
    this.#goal.y = Math.max(this.#goal.y, 3.4);
    this.#center.lerp(this.#goal, 1 - Math.exp(-p.follow * dt));

    const wings = this.wings.object;
    wings.position.copy(this.#center);
    wings.rotation.y = Math.atan2(stage.camera.position.x - this.#center.x, stage.camera.position.z - this.#center.z);
    wings.scale.setScalar(p.wingSpan);
    wings.updateMatrixWorld(true);
    this.wings.update(time, this.#flap);
    this.#countDownPetals(dt);

    this.realm.setBlizzard(this.#center, this.#flap * 4);
    this.realm.update(dt, time, stage.viewportHeight);
    this.bloom.update(dt, time, stage.viewportHeight);
    this.prison.update(dt);
    this.shards.update(dt);
    this.focus.copy(this.#center);
  }

  replay() {
    this.realm.reset();
    this.bloom.clear();
    this.sequence = this.#unfoldSequence();
  }

  onPointerDown() {
    this.#pressTime = 0;
  }

  onPointerUp() {
    if (this.#pressTime < 0) return;
    if (this.prison.isRaised) this.#releasePrison();
    else if (this.#pressTime < TAP_SECONDS) this.#openSky();
    this.#pressTime = -1;
  }

  onParamsChanged(definitions) {
    if (definitions.some((def) => def.key === 'snow')) this.realm.buildSnow(this.context.stage.atmosphere, this.params.snow);
    this.#applyParams();
  }

  dispose() {
    this.realm.dispose();
    this.bloom.dispose();
    super.dispose();
  }

  #applyParams() {
    const p = this.params;
    this.realm.applyParams(p);
    this.prison.radius = p.prisonRadius;
    this.prison.height = p.prisonHeight;
  }

  /** Wings and flowers spread open from nothing; all petals restored. */
  #unfoldSequence() {
    return new Sequence([
      {
        name: 'unfold',
        duration: 1.6,
        enter: () => {
          this.wings.restorePetals();
          this.wings.object.visible = true;
          this.#petalClock = 0;
          this.#fadedAge = -1;
        },
        update: (progress) => (this.wings.unfold = Math.max(0.001, easeOutCubic(progress))),
      },
    ]).start();
  }

  /** The ground point straight below the cursor. */
  #groundUnderCursor() {
    const { pointer, floorY } = this.context;
    return this.#ground.set(pointer.world.x, floorY, pointer.world.z);
  }

  #updatePress(dt) {
    if (this.#pressTime < 0) return;
    this.#pressTime += dt;
    if (this.#pressTime >= TAP_SECONDS && !this.prison.isRaised) {
      this.prison.raise(this.#groundUnderCursor());
      this.context.cameraRig.shake(0.2);
      this.#announce('Sennen Hyōrō', Infinity);
    }
  }

  #openSky() {
    this.bloom.openSky(this.#groundUnderCursor(), this.params.bloomRadius, this.params.flakes);
    this.#announce('Hyōten Hyakkasō');
  }

  #releasePrison() {
    const { center, radius } = this.prison;
    this.prison.shatter();
    this.realm.frost.deposit(center.x, center.z, radius * 1.6, 1);
    this.context.cameraRig.shake(0.35);
    this.#announce(null, 0);
  }

  #announce(technique, seconds = TECHNIQUE_SECONDS) {
    this.#technique = technique;
    this.#techniqueAge = -seconds;
  }

  #updateTechnique(dt) {
    this.#techniqueAge += dt;
    if (this.#techniqueAge > 0 && !this.prison.isRaised) this.#technique = null;
  }

  /** One petal falls every few seconds; when the last one goes, the wings shatter and re-form. */
  #countDownPetals(dt) {
    if (this.#fadedAge >= 0) {
      this.#fadedAge += dt;
      if (this.#fadedAge >= FADE_SECONDS) this.replay();
      return;
    }
    this.#petalClock += dt;
    if (this.#petalClock < this.params.petalSeconds) return;
    this.#petalClock = 0;

    const petal = this.wings.dropPetal(this.#scratch);
    if (petal) this.#burst(petal, 6, 0.25);
    if (this.wings.petalsLeft > 0) return;

    this.wings.forEachShard((point) => this.#burst(point, 1, 0.35));
    this.wings.object.visible = false;
    this.#fadedAge = 0;
  }

  #burst(point, count, size) {
    for (let i = 0; i < count; i++) {
      this.#velocity.set((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3);
      this.shards.spawn(point, this.#velocity, size * (0.6 + Math.random() * 0.8));
    }
  }
}
