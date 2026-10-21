import { BenihimeShikai } from './BenihimeShikai.js';
import { BenihimeAratameBankai } from './BenihimeAratameBankai.js';
import { THEME } from './palette.js';

export const benihime = {
  id: 'benihime',
  name: 'Benihime',
  kanji: '紅姫',
  wielder: 'Urahara Kisuke',
  theme: THEME,
  releases: [
    {
      id: 'shikai',
      title: 'Shikai',
      command: 'Okiro, Benihime',
      banner: {
        eyebrow: '始解',
        kanji: '起きろ',
        romaji: 'Okiro, Benihime',
        translation: 'Awaken, Crimson Princess',
      },
      hints: ['Move to aim', 'Tap — Nake, Benihime', 'Hold — Chikasumi no Tate', 'Scroll for depth'],
      create: (context) => new BenihimeShikai(context),
    },
    {
      id: 'bankai',
      title: 'Bankai',
      command: 'Kannonbiraki Benihime Aratame',
      banner: {
        eyebrow: '卍解',
        kanji: '観音開紅姫改メ',
        romaji: 'Bankai · Kannonbiraki Benihime Aratame',
        translation: 'Goddess-Opening Crimson Princess, Remodelled',
      },
      hints: ['Move — the needle parts what it touches', 'Tap to restructure', 'Hold to cut · release to sew', 'Scroll for depth'],
      create: (context) => new BenihimeAratameBankai(context),
    },
  ],
};
