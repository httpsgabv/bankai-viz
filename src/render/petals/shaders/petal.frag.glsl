uniform vec3 uColorBase;
uniform vec3 uColorTip;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying float vTip;
varying float vSeed;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  if (!gl_FrontFacing) normal = -normal;

  vec3 viewDir = normalize(-vViewPosition);
  vec3 lightDir = normalize(vec3(0.3, 0.9, 0.5));

  // Petals are thin and translucent: light both faces, brighten at grazing angles.
  float lit = 0.66 + 0.34 * abs(dot(normal, lightDir));
  float rim = 1.0 - abs(dot(normal, viewDir));

  vec3 color = mix(uColorBase, uColorTip, smoothstep(0.0, 0.85, vTip));
  color *= lit;
  color = mix(color, uColorTip * 1.08, rim * 0.35);
  color *= 0.94 + 0.12 * fract(vSeed * 41.3);

  float fog = smoothstep(uFogNear, uFogFar, -vViewPosition.z);
  gl_FragColor = vec4(mix(color, uFogColor, fog), 1.0);
  #include <colorspace_fragment>
}
