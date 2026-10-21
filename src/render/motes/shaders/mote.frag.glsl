uniform vec3 uInk;
uniform vec3 uHot;
uniform float uOpacity;
uniform float uFogNear;
uniform float uFogFar;

varying float vHeat;
varying float vDepth;

void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r >= 1.0) discard;

  float alpha = pow(1.0 - r, 1.3) * uOpacity * (0.55 + 0.45 * vHeat);
  alpha *= 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
  vec3 color = mix(uInk, uHot, vHeat);

  vec3 outputColor = linearToOutputTexel(vec4(color, 1.0)).rgb;
  gl_FragColor = vec4(outputColor * alpha, alpha);
}
