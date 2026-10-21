uniform vec3 uColor;
uniform float uOpacity;
uniform float uFogNear;
uniform float uFogFar;

varying float vRim;
varying float vReveal;
varying float vDepth;

void main() {
  float edge = pow(clamp(vRim, 0.0, 1.0), 5.0);
  float alpha = mix(0.14, 0.9, edge) * vReveal * uOpacity;
  alpha *= 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
  vec3 color = mix(uColor * 1.15, uColor, edge);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
