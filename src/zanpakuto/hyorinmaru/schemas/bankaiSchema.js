import { frostGroup, iceColourGroup, snowGroup } from './sharedGroups.js';

export const bankaiSchema = [
  {
    group: 'Daiguren',
    controls: [
      { key: 'wingSpan', label: 'Wing span', type: 'range', min: 0.6, max: 1.6, step: 0.05, value: 1 },
      { key: 'follow', label: 'Follow', type: 'range', min: 0.5, max: 10, step: 0.1, value: 3 },
      { key: 'petalSeconds', label: 'Seconds per petal', type: 'range', min: 3, max: 60, step: 1, value: 15 },
    ],
  },
  {
    group: 'Hyōten Hyakkasō',
    controls: [
      { key: 'flakes', label: 'Flakes per tap', type: 'range', min: 50, max: 800, step: 10, value: 320 },
      { key: 'bloomRadius', label: 'Sky opening', type: 'range', min: 1, max: 8, step: 0.1, value: 3.5 },
    ],
  },
  {
    group: 'Sennen Hyōrō',
    controls: [
      { key: 'prisonRadius', label: 'Prison radius', type: 'range', min: 1.5, max: 5, step: 0.1, value: 2.6 },
      { key: 'prisonHeight', label: 'Pillar height', type: 'range', min: 2, max: 8, step: 0.1, value: 4.5 },
    ],
  },
  frostGroup,
  snowGroup({ snow: 2000 }),
  iceColourGroup,
];
