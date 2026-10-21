import { AshisogiJizoShikai } from './AshisogiJizoShikai.js';
import { KonjikiAshisogiJizoBankai } from './KonjikiAshisogiJizoBankai.js';
import { THEME } from './palette.js';

export const ashisogiJizo = {
  id: 'ashisogi-jizo',
  name: 'Ashisogi Jizō',
  kanji: '疋殺地蔵',
  wielder: 'Kurotsuchi Mayuri',
  theme: THEME,
  releases: [
    {
      id: 'shikai',
      title: 'Shikai',
      command: 'Kakimushire, Ashisogi Jizō',
      banner: {
        eyebrow: '始解',
        kanji: '掻き毟れ',
        romaji: 'Kakimushire, Ashisogi Jizō',
        translation: 'Rip Apart, Leg-Cutting Jizō',
      },
      hints: ['Move to aim the trident', 'Click to strike', 'Poison paralyses the nerves', 'Scroll for depth'],
      create: (context) => new AshisogiJizoShikai(context),
    },
    {
      id: 'bankai',
      title: 'Bankai',
      command: 'Konjiki Ashisogi Jizō',
      banner: {
        eyebrow: '卍解',
        kanji: '金色疋殺地蔵',
        romaji: 'Bankai · Konjiki Ashisogi Jizō',
        translation: 'Golden Leg-Cutting Jizō',
      },
      hints: ['Move to lure the beast', 'Hold to breathe poison', 'Poison paralyses the nerves', 'Scroll for depth'],
      create: (context) => new KonjikiAshisogiJizoBankai(context),
    },
  ],
};
