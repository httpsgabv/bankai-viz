import { CREST, LANTERN, STONE } from '../palette.js';

export const bankaiSchema = [
  {
    group: 'Ryūmon',
    controls: [
      { key: 'size', label: 'Weapon size', type: 'range', min: 0.5, max: 1.6, step: 0.05, value: 1 },
      { key: 'baseSpin', label: 'Idle spin', type: 'range', min: 0, max: 6, step: 0.1, value: 1.2 },
      { key: 'momentum', label: 'Motion → spin', type: 'range', min: 0, max: 2, step: 0.05, value: 0.6 },
      { key: 'holdSpin', label: 'Hold spin', type: 'range', min: 0, max: 30, step: 0.5, value: 14 },
      { key: 'follow', label: 'Follow', type: 'range', min: 0.5, max: 12, step: 0.1, value: 4 },
    ],
  },
  {
    group: 'Dragon crest',
    controls: [
      { key: 'chargePerHit', label: 'Charge per hit', type: 'range', min: 0, max: 0.5, step: 0.01, value: 0.07 },
      { key: 'slam', label: 'Slam radius', type: 'range', min: 1, max: 12, step: 0.5, value: 5 },
      { key: 'unleash', label: 'Unleash radius', type: 'range', min: 8, max: 40, step: 1, value: 24 },
    ],
  },
  {
    group: 'Pillars',
    controls: [{ key: 'pillars', label: 'Pillars', type: 'range', min: 2, max: 20, step: 1, value: 10, rebuild: true }],
  },
  {
    group: 'Colour',
    controls: [
      { key: 'crest', label: 'Crest red', type: 'color', value: CREST },
      { key: 'wave', label: 'Shockwave', type: 'color', value: LANTERN },
      { key: 'stone', label: 'Stone', type: 'color', value: STONE },
    ],
  },
];
