import { FROST, ICE, ICE_GLOW } from '../palette.js';

/** Frost on the ground, shared by shikai and bankai. */
export const frostGroup = {
  group: 'Frost',
  controls: [
    { key: 'frostRate', label: 'Freezing', type: 'range', min: 0, max: 6, step: 0.1, value: 2.5 },
    { key: 'melt', label: 'Melting', type: 'range', min: 0, max: 0.3, step: 0.005, value: 0.03 },
  ],
};

/** Falling snow, shared by shikai and bankai. */
export const snowGroup = ({ snow }) => ({
  group: 'Snow',
  controls: [
    { key: 'snow', label: 'Snowflakes', type: 'range', min: 0, max: 8000, step: 250, value: snow, rebuild: true },
    { key: 'snowSize', label: 'Flake size', type: 'range', min: 0.02, max: 0.15, step: 0.005, value: 0.05 },
    { key: 'blizzard', label: 'Blizzard', type: 'range', min: 0, max: 20, step: 0.5, value: 9 },
  ],
});

export const iceColourGroup = {
  group: 'Colour',
  controls: [
    { key: 'ice', label: 'Ice', type: 'color', value: ICE },
    { key: 'iceGlow', label: 'Ice glow', type: 'color', value: ICE_GLOW },
    { key: 'frost', label: 'Frost', type: 'color', value: FROST },
  ],
};
