uniform vec3 uHealthy;
uniform vec3 uParalysed;
uniform vec3 uGlowColor;
uniform float uFogNear;
uniform float uFogFar;

varying float vMix;
varying float vGlow;
varying float vAlpha;
varying float vDepth;

void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r >= 1.0) discard;

  float alpha = pow(1.0 - r, 1.5) * vAlpha;
  alpha *= 1.0 - smoothstep(uFogNear, uFogFar, vDepth);

  vec3 color = mix(uHealthy, uParalysed, vMix) + uGlowColor * vGlow * (1.0 - vMix);
  vec3 outputColor = linearToOutputTexel(vec4(color, 1.0)).rgb;
  gl_FragColor = vec4(outputColor * alpha, alpha * 0.35);
}
