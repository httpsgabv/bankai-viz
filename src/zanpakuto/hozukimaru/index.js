import { HozukimaruShikai } from './HozukimaruShikai.js';
import { RyumonHozukimaruBankai } from './RyumonHozukimaruBankai.js';
import { THEME } from './palette.js';

export const hozukimaru = {
  id: 'hozukimaru',
  name: 'Hōzukimaru',
  kanji: '鬼灯丸',
  wielder: 'Madarame Ikkaku',
  theme: THEME,
  releases: [
    {
      id: 'shikai',
      title: 'Shikai',
      command: 'Nobiro, Hōzukimaru',
      banner: {
        eyebrow: '始解',
        kanji: '延びろ',
        romaji: 'Nobiro, Hōzukimaru',
        translation: 'Extend, Demon Lantern',
      },
      hints: ['Move to swing the spear', 'Tap — split into three sections', 'Hold to twirl', 'Scroll for depth'],
      create: (context) => new HozukimaruShikai(context),
    },
    {
      id: 'bankai',
      title: 'Bankai',
      command: 'Ryūmon Hōzukimaru',
      banner: {
        eyebrow: '卍解',
        kanji: '龍紋鬼灯丸',
        romaji: 'Bankai · Ryūmon Hōzukimaru',
        translation: 'Dragon-Crest Demon Lantern',
      },
      hints: ['Move fast to spin the weapons', 'Smash pillars to fill the crest', 'Tap to slam · full crest unleashes', 'Hold to spin harder'],
      create: (context) => new RyumonHozukimaruBankai(context),
    },
  ],
};
