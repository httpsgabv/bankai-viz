uniform sampler2D uFrost;
uniform vec3 uIce;
uniform float uTime;
uniform float uFogNear;
uniform float uFogFar;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vDepth;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// Distance to the nearest Voronoi edge: crystalline cracks in the ice.
float iceCracks(vec2 p, out float cellId) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  float f1 = 8.0;
  float f2 = 8.0;
  cellId = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 point = hash2(cell + offset);
      float d = length(offset + point - local);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        cellId = dot(cell + offset, vec2(7.0, 113.0));
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return f2 - f1;
}

void main() {
  float frost = texture2D(uFrost, vUv).r;
  if (frost < 0.02) discard;

  float cellId;
  float edge = iceCracks(vWorldPosition.xz * 2.4, cellId);
  float cracks = 1.0 - smoothstep(0.0, 0.07, edge);
  float sparkle = step(0.985, fract(sin(cellId) * 4375.85)) * (0.5 + 0.5 * sin(uTime * 3.0 + cellId));

  float cover = smoothstep(0.03, 0.5, frost);
  vec3 color = mix(uIce * 0.8, vec3(1.0), cracks * 0.7 + sparkle * 0.8);
  float alpha = cover * (0.45 + 0.4 * cracks + 0.15 * sparkle);
  alpha *= 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
