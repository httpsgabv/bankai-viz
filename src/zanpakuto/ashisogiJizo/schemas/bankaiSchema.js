import { gasLookGroup, nerveGroup } from './sharedGroups.js';

export const bankaiSchema = [
  {
    group: 'Creature',
    controls: [
      { key: 'segments', label: 'Body segments', type: 'range', min: 10, max: 60, step: 1, value: 30, rebuild: true },
      { key: 'size', label: 'Size', type: 'range', min: 0.6, max: 1.8, step: 0.05, value: 1, rebuild: true },
      { key: 'speed', label: 'Speed', type: 'range', min: 1, max: 20, step: 0.5, value: 6 },
      { key: 'circle', label: 'Circling radius', type: 'range', min: 0, max: 6, step: 0.1, value: 2.6 },
      { key: 'slither', label: 'Slither', type: 'range', min: 0, max: 2, step: 0.05, value: 0.6 },
      { key: 'legSpeed', label: 'Leg speed', type: 'range', min: 0, max: 12, step: 0.1, value: 5 },
    ],
  },
  {
    group: 'Poison breath',
    controls: [
      { key: 'gas', label: 'Gas particles', type: 'range', min: 2000, max: 20000, step: 500, value: 10000, rebuild: true },
      { key: 'breath', label: 'Breath strength', type: 'range', min: 500, max: 8000, step: 100, value: 3500 },
      { key: 'breathSpeed', label: 'Breath speed', type: 'range', min: 1, max: 20, step: 0.5, value: 8 },
      { key: 'lifetime', label: 'Lifetime', type: 'range', min: 1, max: 10, step: 0.1, value: 5 },
      { key: 'turbulence', label: 'Turbulence', type: 'range', min: 0, max: 6, step: 0.1, value: 1.6 },
      { key: 'mutation', label: 'Formula mutation', type: 'range', min: 0, max: 2, step: 0.01, value: 0.25 },
    ],
  },
  gasLookGroup({ size: 0.9, opacity: 0.14 }),
  nerveGroup({ nodes: 600, maxNodes: 1200 }),
];
