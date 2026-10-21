uniform vec3 uTint;
uniform vec3 uShadowColor;
uniform vec3 uFocus;
uniform float uShadowStrength;
uniform float uShadowRadius;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vWorldPosition;
varying vec3 vViewPosition;

void main() {
  // Soft contact shadow under the petal cloud: wider and lighter the higher it floats.
  float height = max(uFocus.y, 0.0);
  float spread = uShadowRadius * (1.0 + height * 0.35);
  float d = distance(vWorldPosition.xz, uFocus.xz);
  float shadow = exp(-(d * d) / (spread * spread)) * uShadowStrength / (1.0 + height * 0.25);

  vec3 color = mix(uTint, uShadowColor, shadow);
  float fog = smoothstep(uFogNear, uFogFar, -vViewPosition.z);
  gl_FragColor = vec4(mix(color, uFogColor, fog), 1.0);
  #include <colorspace_fragment>
}
