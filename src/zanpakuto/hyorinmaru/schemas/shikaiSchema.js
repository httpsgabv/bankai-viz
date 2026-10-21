import { frostGroup, iceColourGroup, snowGroup } from './sharedGroups.js';

export const shikaiSchema = [
  {
    group: 'Ice dragon',
    controls: [
      { key: 'segments', label: 'Body length', type: 'range', min: 12, max: 60, step: 1, value: 34, rebuild: true },
      { key: 'size', label: 'Size', type: 'range', min: 0.5, max: 1.6, step: 0.05, value: 1, rebuild: true },
      { key: 'speed', label: 'Speed', type: 'range', min: 2, max: 24, step: 0.5, value: 9 },
      { key: 'circle', label: 'Circling radius', type: 'range', min: 0, max: 6, step: 0.1, value: 2.4 },
      { key: 'slither', label: 'Slither', type: 'range', min: 0, max: 2, step: 0.05, value: 0.8 },
      { key: 'crystalSize', label: 'Dive crystals', type: 'range', min: 0.4, max: 2, step: 0.05, value: 1 },
    ],
  },
  frostGroup,
  snowGroup({ snow: 3000 }),
  iceColourGroup,
];
