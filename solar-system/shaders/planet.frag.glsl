// Fragment shader — Phong lighting + Fresnel atmospheric rim glow
uniform vec3  uBaseColor;
uniform vec3  uLightPos;
uniform float uTime;
uniform float uAtmosphere;  // 0 = off, 1 = on

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightPos - vPosition);
  vec3 V = normalize(-vPosition);

  // Diffuse
  float diff = max(dot(N, L), 0.0);

  // Specular
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 32.0) * 0.2;

  // Fresnel rim for atmosphere
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0) * uAtmosphere;
  vec3 atmColor = vec3(0.26, 0.53, 1.0);

  vec3 color = uBaseColor * (0.08 + diff) + vec3(spec);
  color = mix(color, atmColor, fresnel * 0.55);

  gl_FragColor = vec4(color, 1.0);
}