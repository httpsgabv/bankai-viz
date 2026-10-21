import { HyorinmaruShikai } from './HyorinmaruShikai.js';
import { DaigurenHyorinmaruBankai } from './DaigurenHyorinmaruBankai.js';
import { THEME } from './palette.js';

export const hyorinmaru = {
  id: 'hyorinmaru',
  name: 'Hyōrinmaru',
  kanji: '氷輪丸',
  wielder: 'Hitsugaya Tōshirō',
  theme: THEME,
  releases: [
    {
      id: 'shikai',
      title: 'Shikai',
      command: 'Sōten ni zase, Hyōrinmaru',
      banner: {
        eyebrow: '始解',
        kanji: '霜天に坐せ',
        romaji: 'Sōten ni zase, Hyōrinmaru',
        translation: 'Sit Upon the Frozen Heavens',
      },
      hints: ['Move — the ice dragon follows', 'Tap — it dives and ice erupts', 'Hold — it coils into a blizzard', 'Scroll for depth'],
      create: (context) => new HyorinmaruShikai(context),
    },
    {
      id: 'bankai',
      title: 'Bankai',
      command: 'Daiguren Hyōrinmaru',
      banner: {
        eyebrow: '卍解',
        kanji: '大紅蓮氷輪丸',
        romaji: 'Bankai · Daiguren Hyōrinmaru',
        translation: 'Great Crimson Lotus, Ice Ring',
      },
      hints: ['Move — the wings follow', 'Tap — Hyōten Hyakkasō', 'Hold — Sennen Hyōrō', 'Petals fall as time runs out'],
      create: (context) => new DaigurenHyorinmaruBankai(context),
    },
  ],
};
