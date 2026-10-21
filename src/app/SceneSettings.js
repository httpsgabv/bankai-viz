import * as THREE from 'three';
import { ParamSource } from '../utils/ParamSource.js';

const createSchema = () => [
  {
    group: 'Scene',
    controls: [
      { key: 'background', label: 'Ambient', type: 'color', value: '#ffffff' },
      { key: 'parallax', label: 'Camera parallax', type: 'range', min: 0, max: 2, step: 0.05, value: 0.6 },
      { key: 'shadow', label: 'Ground shadow', type: 'range', min: 0, max: 1, step: 0.01, value: 0.35 },
    ],
  },
];

/**
 * App-wide settings that apply to every release. Each zanpakutō brings a theme
 * ({ background, shadow, accent }) that becomes the new default for these settings.
 */
export class SceneSettings extends ParamSource {
  constructor({ stage, rig, floor }) {
    super(createSchema());
    Object.assign(this, { stage, rig, floor });
    this.onParamsChanged(this.definitions);
  }

  setTheme({ background, shadow, accent }) {
    this.definition('background').value = background;
    this.floor.setShadowColor(shadow);
    document.documentElement.style.setProperty('--accent', accent);
    this.setParam('background', background);
  }

  onParamsChanged(definitions) {
    for (const { key } of definitions) {
      const value = this.params[key];
      if (key === 'background') this.#applyBackground(value);
      if (key === 'parallax') this.rig.parallax = value;
      if (key === 'shadow') this.floor.setShadowStrength(value);
    }
  }

  #applyBackground(color) {
    this.stage.setBackground(color);
    this.floor.setBaseColor(color);
    document.body.style.background = color;
    // Keep the UI readable when the ambient goes dark.
    const { r, g, b } = new THREE.Color(color);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    document.documentElement.dataset.tone = luminance < 0.2 ? 'dark' : 'light';
  }
}
