import * as THREE from 'three';
import { Release } from '../Release.js';
import { shikaiSchema } from './schemas/shikaiSchema.js';
import { IceRealm } from './IceRealm.js';
import { BladeProfile } from '../../render/blades/BladeProfile.js';
import { Katana } from '../../render/blades/Katana.js';
import { createCrescentBladeGeometry } from '../../render/blades/createCrescentBladeGeometry.js';
import { ChainLinks } from '../../render/weapons/ChainLinks.js';
import { IceDragon } from '../../render/creatures/IceDragon.js';
import { SlitherSteering } from '../../sim/SlitherSteering.js';
import { Sequence } from '../../utils/Sequence.js';
import { SNOW_GLOW } from './palette.js';

const PROFILE = new BladeProfile({ length: 3.2, width: 0.17, thickness: 0.04, curvature: 0.03 });
const KATANA_POSITION = new THREE.Vector3(-4.2, 1.4, -1);
const TAP_SECONDS = 0.2;
const DIVE_SECONDS = 1.1;
const FROST_HEIGHT = 1.6;

/**
 * "Sōten ni zase, Hyōrinmaru" — an ice dragon bursts from the blade and flies after
 * the cursor through falling snow, freezing the ground it skims.
 * Tap: it dives and ice crystals erupt where it strikes. Hold: it coils around the cursor
 * and whips the snow into a blizzard.
 */
export class HyorinmaruShikai extends Release {
  /** 'emerge' | 'hunt' | 'dive' | 'coil' | 'return' */
  #mode = 'emerge';
  #modeAge = 0;
  #pressTime = -1;
  #target = new THREE.Vector3();
  #tip = new THREE.Vector3();
  #pommel = new THREE.Vector3();
  #scratch = new THREE.Vector3();

  constructor(context) {
    super(context, shikaiSchema);
    const { atmosphere } = context.stage;

    this.katana = new Katana({ profile: PROFILE, atmosphere, glow: SNOW_GLOW });
    this.katana.group.position.copy(KATANA_POSITION);
    this.katana.group.rotation.set(0, 0.5, -0.12);
    this.tipMarker = new THREE.Object3D();
    this.tipMarker.position.set(0, PROFILE.length, 0);
    this.katana.blade.add(this.tipMarker);
    this.katana.group.updateMatrixWorld(true);
    this.tipMarker.getWorldPosition(this.#tip);

    // The chain on Hyōrinmaru's hilt with its crescent blade.
    this.hiltChain = new ChainLinks({ maxLinks: 20, linkLength: 0.1, thickness: 0.014 });
    this.crescent = new THREE.Mesh(
      createCrescentBladeGeometry({ depth: 0.06, bevel: 0.02 }),
      new THREE.MeshStandardMaterial({ color: '#d6dbe2', metalness: 0.4, roughness: 0.3 }),
    );
    this.crescent.scale.setScalar(0.34);

    this.realm = new IceRealm({ atmosphere, floorY: context.floorY, snow: this.params.snow });
    this.steering = new SlitherSteering();
    this.root.add(this.katana.group, this.hiltChain.object, this.crescent, this.realm.root);

    this.#buildDragon();
    this.#applyParams();
    this.sequence = this.#emergeSequence();
  }

  get view() {
    return {
      camera: { position: [0, 4.2, 15], target: [0, 3.4, -1] },
      fog: { near: 14, far: 48 },
      focus: [0, 3.4, 0],
    };
  }

  get status() {
    if (this.#mode === 'coil') return 'Coil · blizzard';
    return `Frost · ${Math.round(this.realm.coverage * 100)}%`;
  }

  update(dt, time) {
    const { pointer, stage } = this.context;
    this.sequence.update(dt);
    this.#modeAge += dt;
    this.#updatePress(dt);

    this.katana.group.position.copy(KATANA_POSITION).add(pointer.depthOffset);
    this.katana.group.updateMatrixWorld(true);
    this.tipMarker.getWorldPosition(this.#tip);
    this.#swingHiltChain(time);

    this.#steer(dt, time);
    this.dragon.update(dt, time);
    this.#freezeBelowDragon(dt);

    const head = this.dragon.chain.head;
    this.realm.setBlizzard(pointer.world, this.#mode === 'coil' ? this.params.blizzard : 0);
    this.realm.snow.disturb(head, this.params.size * 1.8, 0.4);
    this.realm.update(dt, time, stage.viewportHeight);
    this.focus.copy(head);
  }

  replay() {
    this.realm.reset();
    this.sequence = new Sequence([
      { name: 'return', duration: 1.6, enter: () => this.#setMode('return') },
      ...this.#emergeSteps(),
    ]).start();
  }

  onPointerDown() {
    this.#pressTime = 0;
  }

  onPointerUp() {
    const tapped = this.#pressTime >= 0 && this.#pressTime < TAP_SECONDS;
    this.#pressTime = -1;
    if (this.#mode === 'coil') this.#setMode('hunt');
    if (tapped && this.#mode === 'hunt') this.#setMode('dive');
  }

  onParamsChanged(definitions) {
    const keys = definitions.map((def) => def.key);
    if (keys.includes('segments') || keys.includes('size')) this.#buildDragon(this.dragon.chain.head.clone());
    if (keys.includes('snow')) this.realm.buildSnow(this.context.stage.atmosphere, this.params.snow);
    this.#applyParams();
  }

  dispose() {
    this.realm.dispose();
    super.dispose();
  }

  #buildDragon(start = this.#tip.clone()) {
    if (this.dragon) {
      this.dragon.group.removeFromParent();
      this.dragon.group.traverse((o) => o.geometry?.dispose());
      this.dragon.material.dispose();
    }
    this.dragon = new IceDragon({ segments: this.params.segments, size: this.params.size, start });
    this.dragon.chain.minY = this.context.floorY + 0.25 * this.params.size;
    this.steering.reset();
    this.root.add(this.dragon.group);
  }

  #applyParams() {
    const p = this.params;
    this.realm.applyParams(p);
    this.dragon.setColors({ color: p.ice, glow: p.iceGlow });
    this.steering.slither = p.slither;
  }

  #emergeSequence() {
    return new Sequence(this.#emergeSteps()).start();
  }

  /** The dragon rises out of the blade tip, then starts hunting the cursor. */
  #emergeSteps() {
    return [
      {
        name: 'emerge',
        duration: 1.6,
        enter: () => {
          this.#setMode('emerge');
          for (const point of this.dragon.chain.points) point.copy(this.#tip);
        },
      },
      { name: 'hunt', duration: 0, enter: () => this.#setMode('hunt') },
    ];
  }

  #setMode(mode) {
    this.#mode = mode;
    this.#modeAge = 0;
  }

  #updatePress(dt) {
    if (this.#pressTime < 0) return;
    this.#pressTime += dt;
    if (this.#pressTime >= TAP_SECONDS && this.#mode === 'hunt') this.#setMode('coil');
  }

  /** Chooses the head's target for the current mode and steers towards it. */
  #steer(dt, time) {
    const { pointer, floorY } = this.context;
    const p = this.params;
    const head = this.dragon.chain.head;
    let speed = p.speed;

    switch (this.#mode) {
      case 'emerge':
        this.#target.copy(this.#tip).add(this.#scratch.set(1.5, 4.5, 1));
        speed = 8;
        break;
      case 'return':
        this.#target.copy(this.#tip);
        speed = 14;
        break;
      case 'dive':
        this.#target.set(pointer.world.x, floorY + 0.2, pointer.world.z);
        speed = p.speed * 2.2;
        if (head.y < floorY + 0.9 * p.size || this.#modeAge > DIVE_SECONDS) {
          this.realm.erupt(this.#scratch.set(head.x, floorY, head.z), p.crystalSize);
          this.context.cameraRig.shake(0.18);
          this.#setMode('hunt');
        }
        break;
      case 'coil':
        this.#target.set(Math.cos(time * 3) * 1.8, Math.sin(time * 1.5) * 0.6, Math.sin(time * 3) * 1.8).add(pointer.world);
        speed = p.speed * 1.4;
        break;
      default: {
        // Circle the cursor so the body keeps flowing; roam the sky when the cursor is away.
        const roam = this.#scratch.set(Math.sin(time * 0.35) * 7, 4.5 + Math.sin(time * 0.6) * 1.5, -3 + Math.cos(time * 0.3) * 4);
        this.#target
          .set(Math.cos(time * 1.1) * p.circle, Math.sin(time * 1.7) * p.circle * 0.4, Math.sin(time * 1.1) * p.circle)
          .add(pointer.world)
          .lerp(roam, 1 - pointer.presence);
      }
    }
    this.steering.steer(dt, time, head, this.#target, speed);
  }

  /** Body segments skimming low over the ground leave frost behind. */
  #freezeBelowDragon(dt) {
    const { floorY } = this.context;
    const rate = this.params.frostRate * dt;
    this.dragon.forEachSegment((point, radius) => {
      const height = point.y - floorY;
      if (height < FROST_HEIGHT) this.realm.frost.deposit(point.x, point.z, radius * 2.2, rate * (1 - height / FROST_HEIGHT));
    });
  }

  /** The crescent blade hangs from the pommel on its chain and sways. */
  #swingHiltChain(time) {
    this.katana.hilt.localToWorld(this.#pommel.set(0, -1.1, 0));
    this.crescent.position.set(this.#pommel.x + Math.sin(time * 1.3) * 0.25, this.#pommel.y - 1.1, this.#pommel.z + Math.cos(time * 0.9) * 0.15);
    this.crescent.rotation.set(0, time * 0.4, -Math.PI / 2 + Math.sin(time * 1.3) * 0.2);
    this.hiltChain.update([[this.#pommel, this.crescent.position]]);
  }
}
