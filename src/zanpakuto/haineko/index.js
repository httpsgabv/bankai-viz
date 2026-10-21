import { HainekoShikai } from './HainekoShikai.js';
import { THEME } from './palette.js';

export const haineko = {
  id: 'haineko',
  name: 'Haineko',
  kanji: '灰猫',
  wielder: 'Matsumoto Rangiku',
  theme: THEME,
  releases: [
    {
      id: 'shikai',
      title: 'Shikai',
      command: 'Unare, Haineko',
      banner: {
        eyebrow: '始解',
        kanji: '唸れ',
        romaji: 'Unare, Haineko',
        translation: 'Growl, Ash Cat',
      },
      hints: ['Move — the ash prowls after you', 'Tap to lash', 'Hold for a cutting vortex', 'Scroll for depth'],
      create: (context) => new HainekoShikai(context),
    },
    {
      // Never shown in the story, so it stays visible but locked.
      id: 'bankai',
      title: 'Bankai',
      command: 'Not revealed',
      locked: true,
      lockedNote: "Haineko's bankai has not been revealed",
    },
  ],
};
