import { ASH, BLOCK, EMBER } from '../palette.js';

export const shikaiSchema = [
  {
    group: 'Ash',
    controls: [
      { key: 'count', label: 'Ash particles', type: 'range', min: 1000, max: 20000, step: 500, value: 9000, rebuild: true },
      { key: 'size', label: 'Grain size', type: 'range', min: 0.02, max: 0.25, step: 0.005, value: 0.07 },
      { key: 'opacity', label: 'Opacity', type: 'range', min: 0.1, max: 1, step: 0.01, value: 0.6 },
    ],
  },
  {
    group: 'Prowl',
    controls: [
      { key: 'follow', label: 'Follow', type: 'range', min: 0.2, max: 8, step: 0.1, value: 2.4 },
      { key: 'cloudSize', label: 'Cloud size', type: 'range', min: 0.5, max: 5, step: 0.05, value: 2.2 },
      { key: 'turbulence', label: 'Turbulence', type: 'range', min: 0, max: 10, step: 0.1, value: 3.5 },
      { key: 'speed', label: 'Max speed', type: 'range', min: 2, max: 40, step: 0.5, value: 14 },
    ],
  },
  {
    group: 'Strike',
    controls: [
      { key: 'lash', label: 'Lash (tap)', type: 'range', min: 0, max: 40, step: 0.5, value: 16 },
      { key: 'vortex', label: 'Vortex (hold)', type: 'range', min: 0, max: 30, step: 0.5, value: 14 },
      { key: 'sharpness', label: 'Sharpness', type: 'range', min: 0, max: 4, step: 0.05, value: 1 },
      { key: 'emberSpeed', label: 'Ember threshold', type: 'range', min: 1, max: 20, step: 0.5, value: 4.5 },
    ],
  },
  {
    group: 'Colour',
    controls: [
      { key: 'ash', label: 'Ash', type: 'color', value: ASH },
      { key: 'ember', label: 'Ember', type: 'color', value: EMBER },
      { key: 'block', label: 'Blocks', type: 'color', value: BLOCK },
    ],
  },
];
