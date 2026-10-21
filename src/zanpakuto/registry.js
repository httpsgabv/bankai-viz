import { senbonzakura } from './senbonzakura/index.js';
import { ashisogiJizo } from './ashisogiJizo/index.js';

/**
 * Every zanpakutō the app can show. To add one, create a folder next to `senbonzakura/`
 * exporting the same descriptor shape and list it here.
 */
export const zanpakutoRegistry = [senbonzakura, ashisogiJizo];
