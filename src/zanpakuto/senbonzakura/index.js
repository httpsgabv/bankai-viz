import { SenbonzakuraShikai } from './SenbonzakuraShikai.js';
import { SenbonzakuraBankai } from './SenbonzakuraBankai.js';

export const senbonzakura = {
  id: 'senbonzakura',
  name: 'Senbonzakura',
  kanji: '千本桜',
  wielder: 'Kuchiki Byakuya',
  releases: [
    {
      id: 'shikai',
      title: 'Shikai',
      command: 'Chire, Senbonzakura',
      banner: {
        eyebrow: '始解',
        kanji: '散れ',
        romaji: 'Chire, Senbonzakura',
        translation: 'Scatter, Thousand Cherry Blossoms',
      },
      hints: ['Move to guide the petals', 'Click to scatter', 'Scroll for depth'],
      create: (context) => new SenbonzakuraShikai(context),
    },
    {
      id: 'bankai',
      title: 'Bankai',
      command: 'Senbonzakura Kageyoshi',
      banner: {
        eyebrow: '卍解',
        kanji: '千本桜景厳',
        romaji: 'Bankai · Senbonzakura Kageyoshi',
        translation: 'Vibrant Display of a Thousand Cherry Blossoms',
      },
      hints: ['Move to command the storm', 'Hold to gather', 'Release to scatter', 'Scroll for depth'],
      create: (context) => new SenbonzakuraBankai(context),
    },
  ],
};
