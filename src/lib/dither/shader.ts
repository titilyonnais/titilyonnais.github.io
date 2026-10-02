export const VERT = /* glsl */ `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Trame ordonnée de Bayer 8×8 : chaque pixel est encre ou papier, rien entre les deux.
export const FRAG = /* glsl */ `
precision highp float;

uniform vec2 u_res;      // taille du canvas en pixels physiques
uniform float u_dpr;
uniform float u_time;
uniform float u_expo;    // 0 → 1 : le tirage se développe
uniform vec3 u_mouse;    // x, y (origine en haut à gauche, px physiques), force de la loupe
uniform float u_radius;  // rayon de la loupe, px physiques
uniform float u_cell;    // taille d'un point, px physiques
uniform sampler2D u_mask;
uniform vec3 u_ink;
uniform vec3 u_paper;

float bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);

  // La loupe : des points quatre fois plus gros, et l'image grossie dessous.
  float d = distance(frag, u_mouse.xy);
  float inLens = u_mouse.z > 0.01 ? step(d, u_radius * u_mouse.z) : 0.0;
  float cell = u_cell * mix(1.0, 4.0, inLens);
  vec2 id = floor(frag / cell);
  vec2 p = (id + 0.5) * cell;
  p = mix(p, u_mouse.xy + (p - u_mouse.xy) * 0.5, inLens);

  float m = texture2D(u_mask, clamp(p / u_res, 0.0, 1.0)).r;
  vec2 q = p / u_res.y;
  float t = u_time * 0.045;
  float fg = 0.5 + 0.5 * fbm(q * 5.0 + vec2(t, -0.7 * t));
  float bg = 0.2 * fbm(q * 2.2 - vec2(0.6 * t, t)) * smoothstep(1.15, 0.2, q.y);
  float f = mix(bg, fg, m);

  // Développement : l'image monte du noir, les hautes lumières d'abord.
  f = f * smoothstep(0.0, 1.0, u_expo * 1.25 - (1.0 - f) * 0.25);

  float on = step(bayer8(id) + 0.002, f);

  // Le bord de la loupe, un filet d'un pixel.
  float ring = u_mouse.z > 0.01 ? 1.0 - step(u_dpr, abs(d - u_radius * u_mouse.z)) : 0.0;
  on = max(on, ring);

  gl_FragColor = vec4(mix(u_ink, u_paper, on), 1.0);
}
`;
