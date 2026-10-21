import { SAKURA } from '../palette.js';

export const bankaiSchema = [
  {
    group: 'Petals',
    controls: [
      { key: 'count', label: 'Petals', type: 'range', min: 2000, max: 40000, step: 500, value: 16000, rebuild: true },
      { key: 'size', label: 'Size', type: 'range', min: 0.03, max: 0.3, step: 0.005, value: 0.1 },
      { key: 'spin', label: 'Spin', type: 'range', min: 0, max: 6, step: 0.1, value: 2 },
    ],
  },
  {
    group: 'Storm',
    controls: [
      { key: 'cohesion', label: 'Cohesion', type: 'range', min: 0, max: 1, step: 0.01, value: 0.5 },
      { key: 'orbitRadius', label: 'Orbit radius', type: 'range', min: 0.5, max: 6, step: 0.1, value: 2.4 },
      { key: 'orbitSpeed', label: 'Orbit speed', type: 'range', min: 0, max: 4, step: 0.05, value: 1.2 },
      { key: 'vortex', label: 'Vortex', type: 'range', min: 0, max: 14, step: 0.1, value: 4 },
      { key: 'turbulence', label: 'Turbulence', type: 'range', min: 0, max: 10, step: 0.1, value: 3 },
      { key: 'stormRadius', label: 'Storm size', type: 'range', min: 6, max: 30, step: 0.5, value: 15 },
      { key: 'speed', label: 'Max speed', type: 'range', min: 4, max: 40, step: 0.5, value: 18 },
    ],
  },
  {
    group: 'Interaction',
    controls: [{ key: 'burst', label: 'Release burst', type: 'range', min: 0, max: 60, step: 1, value: 26 }],
  },
  {
    group: 'Blades',
    controls: [{ key: 'blades', label: 'Blades per row', type: 'range', min: 4, max: 30, step: 1, value: 16, rebuild: true }],
  },
  {
    group: 'Colour',
    controls: [
      { key: 'colorBase', label: 'Petal base', type: 'color', value: SAKURA.base },
      { key: 'colorTip', label: 'Petal tip', type: 'color', value: SAKURA.tip },
    ],
  },
];
