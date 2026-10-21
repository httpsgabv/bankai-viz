import * as THREE from 'three';
import lineVertex from './shaders/nerve-line.vert.glsl?raw';
import lineFragment from './shaders/nerve-line.frag.glsl?raw';
import pointVertex from './shaders/nerve-point.vert.glsl?raw';
import pointFragment from './shaders/nerve-point.frag.glsl?raw';
import { premultipliedGlow } from '../shared/blending.js';

/**
 * Draws a NeuralNetwork: faint links, nodes that flash when a signal arrives,
 * and bright travelling pulses. Paralysed parts shift to the paralysis colour.
 */
export class NeuralWebMesh {
  constructor(network, atmosphere, { healthy = '#d9b45a', paralysed = '#a24dff', pulse = '#fff1b8' } = {}) {
    this.network = network;
    const colors = {
      uHealthy: { value: new THREE.Color(healthy) },
      uParalysed: { value: new THREE.Color(paralysed) },
    };

    this.object = new THREE.Group();
    this.lines = this.#createLines(atmosphere, colors);
    this.nodes = this.#createNodes(atmosphere, colors);
    this.pulses = this.#createPulses(atmosphere, colors, pulse);
    this.object.add(this.lines.mesh, this.nodes.mesh, this.pulses.mesh);
  }

  setOpacity(opacity) {
    this.lines.mesh.material.uniforms.uOpacity.value = opacity;
  }

  sync(viewportHeight) {
    const { network } = this;
    const lineParalysis = this.lines.paralysis.array;
    for (let e = 0; e < network.edgeCount; e++) {
      lineParalysis[e * 2] = network.paralysis[network.edges[e * 2]];
      lineParalysis[e * 2 + 1] = network.paralysis[network.edges[e * 2 + 1]];
    }
    this.lines.paralysis.needsUpdate = true;
    this.nodes.mix.needsUpdate = true;
    this.nodes.glow.needsUpdate = true;
    this.pulses.positions.needsUpdate = true;
    this.pulses.alpha.needsUpdate = true;
    this.nodes.mesh.material.uniforms.uViewportHeight.value = viewportHeight;
    this.pulses.mesh.material.uniforms.uViewportHeight.value = viewportHeight;
  }

  dispose() {
    this.object.traverse((child) => {
      child.geometry?.dispose();
      child.material?.dispose();
    });
  }

  #createLines(atmosphere, colors) {
    const { network } = this;
    const positions = new Float32Array(network.edgeCount * 6);
    for (let e = 0; e < network.edgeCount; e++) {
      for (let end = 0; end < 2; end++) {
        const node = network.edges[e * 2 + end];
        positions.set(network.nodes.subarray(node * 3, node * 3 + 3), (e * 2 + end) * 3);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const paralysis = new THREE.BufferAttribute(new Float32Array(network.edgeCount * 2), 1);
    paralysis.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aParalysis', paralysis);

    const material = new THREE.ShaderMaterial({
      vertexShader: lineVertex,
      fragmentShader: lineFragment,
      ...premultipliedGlow,
      uniforms: { ...atmosphere, ...colors, uOpacity: { value: 0.35 } },
    });
    const mesh = new THREE.LineSegments(geometry, material);
    mesh.frustumCulled = false;
    return { mesh, paralysis };
  }

  #createNodes(atmosphere, colors) {
    const { network } = this;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(network.nodes, 3));
    const mix = new THREE.BufferAttribute(network.paralysis, 1).setUsage(THREE.DynamicDrawUsage);
    const glow = new THREE.BufferAttribute(network.flash, 1).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aMix', mix);
    geometry.setAttribute('aGlow', glow);
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(network.count).fill(0.9), 1));
    const mesh = new THREE.Points(geometry, this.#pointMaterial(atmosphere, colors, '#fff1b8', 0.07));
    mesh.frustumCulled = false;
    return { mesh, mix, glow };
  }

  #createPulses(atmosphere, colors, pulseColor) {
    const { network } = this;
    const geometry = new THREE.BufferGeometry();
    const positions = new THREE.BufferAttribute(network.pulsePositions, 3).setUsage(THREE.DynamicDrawUsage);
    const alpha = new THREE.BufferAttribute(network.pulseIntensity, 1).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positions);
    geometry.setAttribute('aAlpha', alpha);
    geometry.setAttribute('aMix', new THREE.BufferAttribute(new Float32Array(network.pulseCount), 1));
    geometry.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array(network.pulseCount).fill(1), 1));
    const mesh = new THREE.Points(geometry, this.#pointMaterial(atmosphere, colors, pulseColor, 0.06));
    mesh.frustumCulled = false;
    return { mesh, positions, alpha };
  }

  #pointMaterial(atmosphere, colors, glowColor, size) {
    return new THREE.ShaderMaterial({
      vertexShader: pointVertex,
      fragmentShader: pointFragment,
      ...premultipliedGlow,
      uniforms: {
        ...atmosphere,
        ...colors,
        uGlowColor: { value: new THREE.Color(glowColor) },
        uSize: { value: size },
        uViewportHeight: { value: 1 },
      },
    });
  }
}
