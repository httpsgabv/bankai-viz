import { CRIMSON, INK } from '../palette.js';

export const shikaiSchema = [
  {
    group: 'Nake, Benihime',
    controls: [
      { key: 'blastSpeed', label: 'Blast speed', type: 'range', min: 4, max: 30, step: 0.5, value: 9 },
      { key: 'blastSize', label: 'Blast size', type: 'range', min: 0.4, max: 3, step: 0.05, value: 1.2 },
      { key: 'blastLife', label: 'Reach', type: 'range', min: 0.4, max: 3, step: 0.05, value: 1.2 },
      { key: 'blastForce', label: 'Force', type: 'range', min: 0, max: 40, step: 0.5, value: 14 },
    ],
  },
  {
    group: 'Chikasumi no Tate',
    controls: [
      { key: 'rings', label: 'Shield rings', type: 'range', min: 1, max: 6, step: 1, value: 3, rebuild: true },
      { key: 'cellSize', label: 'Cell size', type: 'range', min: 0.15, max: 0.6, step: 0.01, value: 0.32, rebuild: true },
    ],
  },
  {
    group: 'Ink',
    controls: [
      { key: 'motes', label: 'Ink motes', type: 'range', min: 500, max: 12000, step: 250, value: 5000, rebuild: true },
      { key: 'moteSize', label: 'Mote size', type: 'range', min: 0.02, max: 0.3, step: 0.005, value: 0.08 },
      { key: 'drift', label: 'Drift', type: 'range', min: 0, max: 3, step: 0.05, value: 0.6 },
      { key: 'moteOpacity', label: 'Opacity', type: 'range', min: 0.1, max: 1, step: 0.01, value: 0.55 },
      { key: 'cooling', label: 'Stain fade', type: 'range', min: 0.1, max: 3, step: 0.05, value: 0.6 },
    ],
  },
  {
    group: 'Colour',
    controls: [
      { key: 'crimson', label: 'Crimson', type: 'color', value: CRIMSON },
      { key: 'ink', label: 'Ink', type: 'color', value: INK },
    ],
  },
];
