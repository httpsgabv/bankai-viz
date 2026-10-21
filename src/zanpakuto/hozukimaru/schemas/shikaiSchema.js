import { LANTERN, TUFT } from '../palette.js';

export const shikaiSchema = [
  {
    group: 'Staff',
    controls: [
      { key: 'grip', label: 'Grip firmness', type: 'range', min: 1, max: 30, step: 0.5, value: 9 },
      { key: 'chain', label: 'Chain length', type: 'range', min: 0.1, max: 2, step: 0.05, value: 0.6 },
      { key: 'damping', label: 'Air drag', type: 'range', min: 0.95, max: 1, step: 0.001, value: 0.992 },
      { key: 'twirlSpeed', label: 'Twirl speed', type: 'range', min: 2, max: 30, step: 0.5, value: 14 },
    ],
  },
  {
    group: 'Lanterns',
    controls: [
      { key: 'lanterns', label: 'Lanterns', type: 'range', min: 2, max: 16, step: 1, value: 8, rebuild: true },
      { key: 'lanternSize', label: 'Size', type: 'range', min: 0.4, max: 1.6, step: 0.05, value: 0.9, rebuild: true },
      { key: 'force', label: 'Hit force', type: 'range', min: 0, max: 2, step: 0.05, value: 0.7 },
    ],
  },
  {
    group: 'Colour',
    controls: [
      { key: 'lanternColor', label: 'Lanterns', type: 'color', value: LANTERN },
      { key: 'tuft', label: 'Tuft', type: 'color', value: TUFT },
    ],
  },
];
