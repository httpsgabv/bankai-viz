import * as THREE from 'three';
import { damp } from '../utils/math.js';

/**
 * Owns the WebGL renderer, scene, camera, lights and atmosphere (background + fog).
 * `atmosphere` holds shared uniform objects so custom shaders stay in sync with the scene.
 */
export class Stage {
  #fogGoal = { near: 16, far: 70 };

  constructor(container) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvas.classList.add('stage');
    container.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);

    this.atmosphere = {
      uFogColor: { value: new THREE.Color('#ffffff') },
      uFogNear: { value: this.#fogGoal.near },
      uFogFar: { value: this.#fogGoal.far },
    };
    this.scene.background = this.atmosphere.uFogColor.value;
    this.scene.fog = new THREE.Fog(this.atmosphere.uFogColor.value.clone(), this.#fogGoal.near, this.#fogGoal.far);

    this.#addLights();
    this.#observeSize();
  }

  get canvas() {
    return this.renderer.domElement;
  }

  setBackground(color) {
    this.atmosphere.uFogColor.value.set(color);
    this.scene.fog.color.set(color);
  }

  setFog({ near, far }, immediate = false) {
    this.#fogGoal = { near, far };
    if (immediate) this.#applyFog(near, far);
  }

  update(dt) {
    const near = damp(this.atmosphere.uFogNear.value, this.#fogGoal.near, 2, dt);
    const far = damp(this.atmosphere.uFogFar.value, this.#fogGoal.far, 2, dt);
    this.#applyFog(near, far);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  #applyFog(near, far) {
    this.atmosphere.uFogNear.value = near;
    this.atmosphere.uFogFar.value = far;
    this.scene.fog.near = near;
    this.scene.fog.far = far;
  }

  #addLights() {
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#e9e3e5', 1.8));
    const key = new THREE.DirectionalLight('#ffffff', 1.6);
    key.position.set(4, 9, 6);
    this.scene.add(key);
  }

  #observeSize() {
    const resize = () => {
      const { clientWidth: width, clientHeight: height } = this.container;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / Math.max(height, 1);
      this.camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(this.container);
    resize();
  }
}
