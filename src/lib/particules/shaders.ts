// GLSL de la toile. Unités : px CSS et secondes.

// Bruit simplex 3D (Ashima Arts / Stefan Gustavson, licence MIT).
const SIMPLEX = /* glsl */ `
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
// Champ de flux : trois bruits décalés. Pas tout à fait sans divergence, mais trois fois moins cher qu'un vrai curl.
vec3 flux(vec3 p){
  return vec3(snoise(p), snoise(p + vec3(31.4, 0.0, 0.0)), snoise(p + vec3(0.0, 67.1, 0.0)));
}
`;

const HASH = /* glsl */ `
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
`;

/** Vitesse : ressort vers la cible, flux, souffle du curseur, onde de choc, explosion. */
export const SIM_VITESSE = /* glsl */ `
uniform sampler2D tCible;     // xyz : cible, w : instant de départ propre
uniform float uTemps;
uniform float uDt;
uniform float uRaideur;
uniform float uAmorti;
uniform float uBruit;
uniform vec2 uDecalage;
uniform vec4 uPointeur;       // x, y, rayon, force (signée : + repousse, - attire)
uniform vec4 uOndes[4];       // x, y, t0, force
uniform vec4 uExplosion;      // x, y, force, rayon (appliquée une seule image)
${SIMPLEX}
${HASH}
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 p = texture2D(texturePosition, uv).xyz;
  vec3 v = texture2D(textureVitesse, uv).xyz;
  vec4 c = texture2D(tCible, uv);
  vec3 cible = c.xyz + vec3(uDecalage, 0.0);
  float actif = smoothstep(c.w, c.w + 0.35, uTemps);

  vec3 acc = (cible - p) * uRaideur * mix(0.08, 1.0, actif);
  acc += flux(p * 0.0035 + vec3(0.0, 0.0, uTemps * 0.09)) * uBruit * (1.0 + (1.0 - actif) * 1.5);

  vec2 d = p.xy - uPointeur.xy;
  float ld = length(d) + 0.001;
  float f = 1.0 - clamp(ld / uPointeur.z, 0.0, 1.0);
  acc.xy += (d / ld) * uPointeur.w * f * f;

  for (int k = 0; k < 4; k++) {
    vec4 o = uOndes[k];
    float age = uTemps - o.z;
    if (o.w > 0.0 && age > 0.0 && age < 1.6) {
      vec2 e = p.xy - o.xy;
      float le = length(e) + 0.001;
      float front = exp(-pow((le - age * 1400.0) / 70.0, 2.0));
      acc.xy += (e / le) * o.w * 60.0 * exp(-age * 2.5) * front;
      acc.z += o.w * 8.0 * front * (hash(uv) - 0.5);
    }
  }

  if (uExplosion.z > 0.0) {
    vec2 e = p.xy - uExplosion.xy;
    float le = length(e) + 0.001;
    float g = 1.0 - smoothstep(0.0, uExplosion.w, le);
    vec3 dir = normalize(vec3(e / le, (hash(uv * 7.1) - 0.5) * 1.6));
    v += dir * uExplosion.z * g * (0.4 + hash(uv * 3.3));
  }

  v += acc * uDt;
  v *= pow(uAmorti, uDt * 60.0);
  gl_FragColor = vec4(v, 1.0);
}
`;

export const SIM_POSITION = /* glsl */ `
uniform float uDt;
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 p = texture2D(texturePosition, uv).xyz;
  vec3 v = texture2D(textureVitesse, uv).xyz;
  gl_FragColor = vec4(p + v * uDt, 1.0);
}
`;

/** Rendu : projection en perspective (focale en px), rotation de parallaxe, couleur qui passe de l'ancienne à la nouvelle. */
export const RENDU_VERT = /* glsl */ `
uniform sampler2D texturePosition;
uniform sampler2D textureVitesse;
uniform sampler2D tCible;
uniform sampler2D tCouleur;
uniform sampler2D tCouleurAvant;
uniform vec2 uRes;
uniform vec2 uRot;
uniform float uFocale;
uniform float uTaille;
uniform float uDpr;
uniform float uTemps;
attribute vec2 ref;
varying vec3 vCouleur;
varying float vEclat;
${HASH}
void main(){
  vec3 p = texture2D(texturePosition, ref).xyz;
  vec3 v = texture2D(textureVitesse, ref).xyz;
  float depart = texture2D(tCible, ref).w;

  vec3 q = p - vec3(uRes * 0.5, 0.0);
  float cy = cos(uRot.y), sy = sin(uRot.y);
  q = vec3(cy * q.x + sy * q.z, q.y, -sy * q.x + cy * q.z);
  float cx = cos(uRot.x), sx = sin(uRot.x);
  q = vec3(q.x, cx * q.y - sx * q.z, sx * q.y + cx * q.z);

  float s = uFocale / max(uFocale - q.z, 1.0);
  vec2 ecran = uRes * 0.5 + q.xy * s;
  gl_Position = vec4(ecran.x / uRes.x * 2.0 - 1.0, 1.0 - ecran.y / uRes.y * 2.0, 0.0, 1.0);

  float a = smoothstep(depart, depart + 0.5, uTemps);
  vec4 col = mix(texture2D(tCouleurAvant, ref), texture2D(tCouleur, ref), a);
  float vitesse = min(length(v) / 900.0, 0.6);
  vCouleur = col.rgb;
  vEclat = clamp(col.a + vitesse, 0.0, 1.0);
  gl_PointSize = uTaille * uDpr * (0.8 + 0.4 * hash(ref)) * s;
}
`;

export const RENDU_FRAG = /* glsl */ `
uniform float uAdditif;
varying vec3 vCouleur;
varying float vEclat;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = 1.0 - smoothstep(0.32, 0.5, r);
  if (a <= 0.0) discard;
  // Sur noir, l'éclat éclaircit (mélange additif) ; sur papier, il rend l'encre plus légère.
  gl_FragColor = uAdditif > 0.5 ? vec4(vCouleur * vEclat, a) : vec4(vCouleur, a * vEclat);
}
`;
