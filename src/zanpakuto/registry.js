import { senbonzakura } from './senbonzakura/index.js';
import { ashisogiJizo } from './ashisogiJizo/index.js';
import { benihime } from './benihime/index.js';
import { haineko } from './haineko/index.js';
import { hozukimaru } from './hozukimaru/index.js';

/**
 * Every zanpakutō the app can show. To add one, create a folder next to `senbonzakura/`
 * exporting the same descriptor shape and list it here.
 */
export const zanpakutoRegistry = [senbonzakura, ashisogiJizo, benihime, haineko, hozukimaru];
