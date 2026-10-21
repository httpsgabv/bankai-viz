uniform sampler2D uGlyph;
uniform float uCharge;
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uGold;
uniform vec3 uRed;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec2 vUv;
varying float vDepth;

void main() {
  float r = length(vUv - 0.5) * 2.0;
  float glyph = texture2D(uGlyph, vUv).a;
  float ring = smoothstep(0.82, 0.86, r) * (1.0 - smoothstep(0.93, 0.97, r));

  // The crest fills with red from the bottom as the fight goes on; it throbs when full.
  float filled = step(vUv.y, uCharge * 0.9 + 0.05);
  float ready = step(0.999, uCharge);
  vec3 red = uRed * (1.0 + ready * (0.35 + 0.35 * sin(uTime * 8.0)));
  vec3 glyphColor = mix(uGold * 0.55, red, filled);

  vec3 color = mix(uBase, glyphColor, glyph);
  color = mix(color, mix(uGold, red, ready), ring);
  color = mix(color, uFogColor, smoothstep(uFogNear, uFogFar, vDepth));
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
