import { SAKURA } from '../palette.js';

export const shikaiSchema = [
  {
    group: 'Petals',
    controls: [
      { key: 'count', label: 'Petals', type: 'range', min: 300, max: 10000, step: 100, value: 3500, rebuild: true },
      { key: 'size', label: 'Size', type: 'range', min: 0.04, max: 0.35, step: 0.01, value: 0.12 },
      { key: 'spin', label: 'Spin', type: 'range', min: 0, max: 6, step: 0.1, value: 1.6 },
    ],
  },
  {
    group: 'Stream',
    controls: [
      { key: 'follow', label: 'Follow', type: 'range', min: 0.5, max: 10, step: 0.1, value: 4 },
      { key: 'streamLength', label: 'Length', type: 'range', min: 5, max: 220, step: 1, value: 80 },
      { key: 'spread', label: 'Spread', type: 'range', min: 0, max: 2.5, step: 0.05, value: 0.55 },
      { key: 'swirl', label: 'Swirl', type: 'range', min: 0, max: 12, step: 0.1, value: 2.5 },
      { key: 'turbulence', label: 'Turbulence', type: 'range', min: 0, max: 10, step: 0.1, value: 2.5 },
      { key: 'speed', label: 'Max speed', type: 'range', min: 2, max: 40, step: 0.5, value: 16 },
    ],
  },
  {
    group: 'Interaction',
    controls: [{ key: 'burst', label: 'Click burst', type: 'range', min: 0, max: 50, step: 1, value: 18 }],
  },
  {
    group: 'Colour',
    controls: [
      { key: 'colorBase', label: 'Petal base', type: 'color', value: SAKURA.base },
      { key: 'colorTip', label: 'Petal tip', type: 'color', value: SAKURA.tip },
    ],
  },
];
