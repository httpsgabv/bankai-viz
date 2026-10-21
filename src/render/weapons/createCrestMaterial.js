import * as THREE from 'three';
import vertexShader from './shaders/crest.vert.glsl?raw';
import fragmentShader from './shaders/crest.frag.glsl?raw';

const GLYPH = '龍';
const FONT = '600 190px "Shippori Mincho", "Yu Mincho", serif';

/** Draws the dragon glyph into a canvas texture (redrawn once the web font is ready). */
function createGlyphTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const texture = new THREE.CanvasTexture(canvas);
  const draw = () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#ffffff';
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(GLYPH, 128, 140);
    texture.needsUpdate = true;
  };
  draw();
  document.fonts?.load(FONT, GLYPH).then(draw).catch(() => {});
  return texture;
}

/** The Ryūmon dragon crest: a dark disc whose 龍 glyph fills with red as `uCharge` rises. */
export function createCrestMaterial(atmosphere, { red = '#e0302a' } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      ...atmosphere,
      uGlyph: { value: createGlyphTexture() },
      uCharge: { value: 0 },
      uTime: { value: 0 },
      uBase: { value: new THREE.Color('#1d1c22') },
      uGold: { value: new THREE.Color('#d6aa55') },
      uRed: { value: new THREE.Color(red) },
    },
  });
}
