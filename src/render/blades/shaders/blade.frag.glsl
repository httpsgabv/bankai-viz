uniform vec3 uSteel;
uniform vec3 uSteelShadow;
uniform vec3 uGlow;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying float vHeight;
varying float vEdge;
varying float vDissolve;
varying vec3 vNormal;
varying vec3 vViewPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  // Dissolve from the tip down, with a ragged, petal-sized cut line.
  float cut = 1.0 - vDissolve;
  float jag = (hash(floor(vec2(vEdge * 7.0, vHeight * 90.0))) - 0.5) * 0.06;
  float height = vHeight + jag * step(0.001, vDissolve);
  if (height > cut) discard;

  vec3 normal = normalize(vNormal);
  if (!gl_FrontFacing) normal = -normal;
  vec3 viewDir = normalize(-vViewPosition);
  vec3 lightDir = normalize(vec3(0.4, 0.8, 0.6));

  float diffuse = dot(normal, lightDir) * 0.5 + 0.5;
  float specular = pow(max(dot(normal, normalize(lightDir + viewDir)), 0.0), 60.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);

  vec3 color = mix(uSteelShadow, uSteel, diffuse);
  float hamon = smoothstep(0.55, 0.8, vEdge + 0.07 * sin(vHeight * 95.0));
  color = mix(color, vec3(1.0), hamon * 0.5);
  color += specular * 0.9 + fresnel * 0.25;

  // Pink glow where the steel is turning into petals.
  float glow = step(0.001, vDissolve) * (1.0 - smoothstep(0.0, 0.07, cut - height));
  color = mix(color, uGlow, glow);

  float fog = smoothstep(uFogNear, uFogFar, -vViewPosition.z);
  gl_FragColor = vec4(mix(color, uFogColor, fog), 1.0);
  #include <colorspace_fragment>
}
