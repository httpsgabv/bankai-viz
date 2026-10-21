import * as THREE from 'three';
import { FrostField } from '../../effects/FrostField.js';
import { Snowfall } from '../../effects/Snowfall.js';
import { IceCrystals } from '../../effects/IceCrystals.js';
import { createIceMaterial } from '../../render/materials/createIceMaterial.js';
import { FlowForce } from '../../sim/forces/FlowForce.js';
import { SwirlForce } from '../../sim/forces/SwirlForce.js';
import { ConstantForce } from '../../sim/forces/ConstantForce.js';
import { SNOW, SNOW_GLOW } from './palette.js';

const SNOW_BOUNDS = { min: [-14, 0, -10], max: [14, 11, 6] };

/**
 * Hyōrinmaru's surroundings, shared by shikai and bankai: falling snow (with a blizzard
 * swirl), frost painted on the ground and ice crystals that erupt from it.
 */
export class IceRealm {
  constructor({ atmosphere, floorY, snow }) {
    this.root = new THREE.Group();
    this.floorY = floorY;
    this.iceMaterial = createIceMaterial();

    this.frost = new FrostField({ atmosphere, floorY });
    this.crystals = new IceCrystals({ material: this.iceMaterial });
    this.blizzard = new SwirlForce({ axis: [0, 1, 0] });
    this.blizzard.inward = 0.05;
    this.drift = new FlowForce();
    this.drift.frequency = 0.2;
    this.drift.speed = 0.4;
    this.gravity = new ConstantForce(0, -1.1, 0);
    this.root.add(this.frost.object, this.crystals.object);
    this.buildSnow(atmosphere, snow);
  }

  buildSnow(atmosphere, count) {
    this.snow?.dispose();
    this.snow = new Snowfall({ count: Math.max(1, count), ...SNOW_BOUNDS, floorY: this.floorY, atmosphere, forces: [this.gravity, this.drift, this.blizzard] });
    this.snow.swarm.drag = 1.8;
    this.snow.object.visible = count > 0;
    this.root.add(this.snow.object);
  }

  /** Applies the shared Frost / Snow / Colour params. */
  applyParams(p) {
    this.frost.setMelt(p.melt);
    this.frost.setColor(p.frost);
    this.snow.setAppearance({ size: p.snowSize, opacity: 0.85, ink: SNOW, hot: SNOW_GLOW });
    this.iceMaterial.color.set(p.ice);
    this.iceMaterial.emissive.set(p.iceGlow);
  }

  /** Whips the snow into a vortex around `center` (strength 0 = calm). */
  setBlizzard(center, strength) {
    this.blizzard.center.copy(center);
    this.blizzard.strength = strength;
    this.blizzard.radius = 4;
    this.drift.strength = 0.6 + strength * 0.1;
  }

  /** Bursts ice crystals out of the ground at `point` and frosts around them. */
  erupt(point, scale) {
    this.crystals.spawn(point, scale);
    this.frost.deposit(point.x, point.z, 2.6 * scale, 1);
    this.snow.disturb(point, 3.5 * scale, 4);
  }

  get coverage() {
    return this.frost.coverage;
  }

  update(dt, time, viewportHeight) {
    this.frost.update(dt, time);
    this.crystals.update(dt);
    this.snow.update(dt, time, viewportHeight);
  }

  reset() {
    this.frost.clear();
    this.crystals.clear();
  }

  dispose() {
    this.snow.dispose();
    this.frost.dispose();
  }
}
