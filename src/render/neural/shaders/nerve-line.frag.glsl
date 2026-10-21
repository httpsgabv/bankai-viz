uniform vec3 uHealthy;
uniform vec3 uParalysed;
uniform float uOpacity;
uniform float uFogNear;
uniform float uFogFar;

varying float vParalysis;
varying float vDepth;

void main() {
  vec3 color = mix(uHealthy, uParalysed, vParalysis);
  float alpha = uOpacity * mix(0.45, 1.0, vParalysis);
  alpha *= 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
  vec3 outputColor = linearToOutputTexel(vec4(color, 1.0)).rgb;
  gl_FragColor = vec4(outputColor * alpha, alpha * 0.4);
}
