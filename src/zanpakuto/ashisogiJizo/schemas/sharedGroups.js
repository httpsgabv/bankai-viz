import { POISON } from '../palette.js';

/** Settings for the nerve web, shared by shikai and bankai. */
export const nerveGroup = ({ nodes, maxNodes }) => ({
  group: 'Nerves',
  controls: [
    { key: 'nodes', label: 'Nerve nodes', type: 'range', min: 80, max: maxNodes, step: 10, value: nodes, rebuild: true },
    { key: 'potency', label: 'Poison potency', type: 'range', min: 0, max: 0.3, step: 0.005, value: 0.05 },
    { key: 'recovery', label: 'Recovery', type: 'range', min: 0, max: 0.3, step: 0.005, value: 0.06 },
    { key: 'pulseSpeed', label: 'Signal speed', type: 'range', min: 0, max: 10, step: 0.1, value: 3 },
    { key: 'webOpacity', label: 'Web visibility', type: 'range', min: 0, max: 1, step: 0.01, value: 0.35 },
  ],
});

/** How the gas looks, shared by shikai and bankai. */
export const gasLookGroup = ({ size, opacity }) => ({
  group: 'Gas look',
  controls: [
    { key: 'gasSize', label: 'Puff size', type: 'range', min: 0.1, max: 2.5, step: 0.05, value: size },
    { key: 'opacity', label: 'Opacity', type: 'range', min: 0.05, max: 1, step: 0.01, value: opacity },
    { key: 'glow', label: 'Glow', type: 'range', min: 0, max: 1, step: 0.01, value: 0.35 },
    { key: 'colorCore', label: 'Fresh gas', type: 'color', value: POISON.core },
    { key: 'colorEdge', label: 'Old gas', type: 'color', value: POISON.edge },
  ],
});
