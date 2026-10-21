import { CRIMSON, INK } from '../palette.js';

export const bankaiSchema = [
  {
    group: 'Restructure',
    controls: [
      { key: 'voxels', label: 'Voxels', type: 'range', min: 500, max: 6000, step: 100, value: 2600, rebuild: true },
      { key: 'waveSpeed', label: 'Wave speed', type: 'range', min: 1, max: 20, step: 0.5, value: 6 },
      { key: 'duration', label: 'Re-form time', type: 'range', min: 0.3, max: 3, step: 0.05, value: 1.2 },
      { key: 'arc', label: 'Flight arc', type: 'range', min: 0, max: 2, step: 0.05, value: 0.6 },
    ],
  },
  {
    group: 'Needle',
    controls: [
      { key: 'needleRadius', label: 'Touch radius', type: 'range', min: 0.2, max: 3, step: 0.05, value: 1.1 },
      { key: 'needlePush', label: 'Push', type: 'range', min: 0, max: 2, step: 0.05, value: 0.6 },
    ],
  },
  {
    group: 'Kirisaki',
    controls: [{ key: 'gap', label: 'Cut gap', type: 'range', min: 0, max: 4, step: 0.05, value: 1.6 }],
  },
  {
    group: 'Benihime',
    controls: [{ key: 'figure', label: 'Silhouette', type: 'range', min: 0, max: 1, step: 0.01, value: 1 }],
  },
  {
    group: 'Colour',
    controls: [
      { key: 'crimson', label: 'Crimson', type: 'color', value: CRIMSON },
      { key: 'ink', label: 'Ink', type: 'color', value: INK },
    ],
  },
];
