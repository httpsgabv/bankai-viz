import { gasLookGroup, nerveGroup } from './sharedGroups.js';

export const shikaiSchema = [
  {
    group: 'Poison',
    controls: [
      { key: 'gas', label: 'Gas particles', type: 'range', min: 1000, max: 12000, step: 500, value: 6000, rebuild: true },
      { key: 'emission', label: 'Emission', type: 'range', min: 0, max: 4000, step: 50, value: 700 },
      { key: 'jetSpeed', label: 'Jet speed', type: 'range', min: 0, max: 15, step: 0.1, value: 5 },
      { key: 'attraction', label: 'Cursor pull', type: 'range', min: 0, max: 1, step: 0.01, value: 0.2 },
      { key: 'lifetime', label: 'Lifetime', type: 'range', min: 1, max: 8, step: 0.1, value: 3 },
      { key: 'turbulence', label: 'Turbulence', type: 'range', min: 0, max: 6, step: 0.1, value: 1.4 },
    ],
  },
  gasLookGroup({ size: 0.55, opacity: 0.18 }),
  nerveGroup({ nodes: 380, maxNodes: 900 }),
  {
    group: 'Strike',
    controls: [
      { key: 'lunge', label: 'Lunge reach', type: 'range', min: 0, max: 3, step: 0.05, value: 1.2 },
      { key: 'burst', label: 'Strike poison', type: 'range', min: 0, max: 3000, step: 50, value: 900 },
    ],
  },
];
