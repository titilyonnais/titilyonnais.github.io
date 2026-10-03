import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  NormalBlending,
  OrthographicCamera,
  Points,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  WebGLRenderer,
  type IUniform,
} from 'three';
import { GPUComputationRenderer, type Variable } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { SIM_POSITION, SIM_VITESSE, RENDU_FRAG, RENDU_VERT } from './shaders';
import type { Cible, Etat, Moteur, Reglages } from './types';

/** Tailles des textures de simulation : 131 072, 73 728 puis 32 768 particules. */
const PALIERS: [number, number][] = [
  [512, 256],
  [384, 192],
  [256, 128],
];
const FOCALE = 1200;
const REGLAGES: Reglages = { raideur: 40, amorti: 0.86, bruit: 40, taille: 1.6, additif: true, souffle: 1 };

const hex = (h: string): [number, number, number] => {
  const c = new Color(h);
  return [c.r, c.g, c.b];
};

/** Contexte WebGL2 capable de rendre dans des textures flottantes ; sinon, pas de simulation. */
function contexte(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  return gl && gl.getExtension('EXT_color_buffer_float') ? gl : null;
}

export function creerMoteur(canvas: HTMLCanvasElement, etat: Etat): Moteur | null {
  const gl = contexte(canvas);
  if (!gl) return null;

  const renderer = new WebGLRenderer({ canvas, context: gl, antialias: false, alpha: false });
  const dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  let W = innerWidth;
  let H = innerHeight;
  renderer.setSize(W, H, false);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1); // la projection est faite dans le shader
  const r: Reglages = { ...REGLAGES };

  // Fond : la couleur de clear glisse vers sa cible.
  const fondActuel = new Color(0, 0, 0);
  const fondDepart = new Color(0, 0, 0);
  const fondCible = new Color(0, 0, 0);
  let fondT0 = 0;
  let fondDuree = 1;

  // Souris : position, vitesse lissée, parallaxe.
  const ptr = { x: -9999, y: -9999, v: 0, rx: 0, ry: 0, trx: 0, try: 0, last: 0 };
  const ondes = [0, 1, 2, 3].map(() => ({ x: 0, y: 0, t0: -10, f: 0 }));
  let prochaineOnde = 0;
  let explosion: [number, number, number, number] | null = null;

  let palier = 0;
  let TW = 0;
  let TH = 0;
  let gpu: GPUComputationRenderer;
  let vVit: Variable;
  let vPos: Variable;
  let tCible: DataTexture;
  let tCouleur: DataTexture;
  let tCouleurAvant: DataTexture;
  let points: Points;
  let materiau: ShaderMaterial;
  let derniereCible: { c: Cible; decalage: number } | null = null;
  let decalage = { x: 0, y: 0 };

  const temps = () => performance.now() / 1000;

  function construire(positionsInitiales?: Float32Array) {
    [TW, TH] = PALIERS[palier]!;
    gpu = new GPUComputationRenderer(TW, TH, renderer);
    const pos0 = gpu.createTexture();
    const vit0 = gpu.createTexture();
    const p = pos0.image.data as Float32Array;
    const n = TW * TH;
    for (let i = 0; i < n; i++) {
      if (positionsInitiales) {
        const j = Math.floor((i / n) * (positionsInitiales.length / 4)) * 4;
        p[i * 4] = positionsInitiales[j]!;
        p[i * 4 + 1] = positionsInitiales[j + 1]!;
        p[i * 4 + 2] = positionsInitiales[j + 2]!;
      } else {
        p[i * 4] = Math.random() * W;
        p[i * 4 + 1] = Math.random() * H;
        p[i * 4 + 2] = (Math.random() - 0.5) * 400;
      }
      p[i * 4 + 3] = 1;
    }
    vVit = gpu.addVariable('textureVitesse', SIM_VITESSE, vit0);
    vPos = gpu.addVariable('texturePosition', SIM_POSITION, pos0);
    gpu.setVariableDependencies(vVit, [vVit, vPos]);
    gpu.setVariableDependencies(vPos, [vVit, vPos]);

    tCible = gpu.createTexture();
    const c = tCible.image.data as Float32Array;
    for (let i = 0; i < n; i++) {
      c[i * 4] = p[i * 4]!;
      c[i * 4 + 1] = p[i * 4 + 1]!;
      c[i * 4 + 2] = p[i * 4 + 2]!;
      c[i * 4 + 3] = 0;
    }
    tCible.needsUpdate = true;

    const u = vVit.material.uniforms as Record<string, IUniform>;
    u.tCible = { value: tCible };
    u.uTemps = { value: 0 };
    u.uDt = { value: 1 / 60 };
    u.uRaideur = { value: r.raideur };
    u.uAmorti = { value: r.amorti };
    u.uBruit = { value: r.bruit };
    u.uDecalage = { value: [decalage.x, decalage.y] };
    u.uPointeur = { value: [ptr.x, ptr.y, 140, 0] };
    u.uOndes = { value: ondes.map(() => [0, 0, -10, 0]).flat() };
    u.uExplosion = { value: [0, 0, 0, 0] };
    (vPos.material.uniforms as Record<string, IUniform>).uDt = { value: 1 / 60 };

    const err = gpu.init();
    if (err) throw new Error(err);

    const couleurs = () => {
      const d = new Uint8Array(n * 4).fill(255);
      const t = new DataTexture(d, TW, TH, RGBAFormat, UnsignedByteType);
      t.needsUpdate = true;
      return t;
    };
    tCouleur = couleurs();
    tCouleurAvant = couleurs();

    const ref = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      ref[i * 2] = ((i % TW) + 0.5) / TW;
      ref[i * 2 + 1] = (Math.floor(i / TW) + 0.5) / TH;
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('ref', new BufferAttribute(ref, 2));
    materiau = new ShaderMaterial({
      vertexShader: RENDU_VERT,
      fragmentShader: RENDU_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: r.additif ? AdditiveBlending : NormalBlending,
      uniforms: {
        texturePosition: { value: null },
        textureVitesse: { value: null },
        tCible: { value: tCible },
        tCouleur: { value: tCouleur },
        tCouleurAvant: { value: tCouleurAvant },
        uRes: { value: [W, H] },
        uRot: { value: [0, 0] },
        uFocale: { value: FOCALE },
        uTaille: { value: r.taille },
        uDpr: { value: dpr },
        uTemps: { value: 0 },
        uAdditif: { value: r.additif ? 1 : 0 },
      },
    });
    points = new Points(geo, materiau);
    points.frustumCulled = false;
    scene.add(points);
    etat.palier = palier;
    if (derniereCible) viser(derniereCible.c, {}, 0);
  }

  function demonter() {
    scene.remove(points);
    points.geometry.dispose();
    materiau.dispose();
    tCible.dispose();
    tCouleur.dispose();
    tCouleurAvant.dispose();
    gpu.dispose();
  }

  /** Descend d'un palier en gardant la forme : on relit les positions actuelles. */
  function descendre() {
    if (palier >= PALIERS.length - 1) return;
    const rt = gpu.getCurrentRenderTarget(vPos);
    const lu = new Float32Array(TW * TH * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, TW, TH, lu);
    demonter();
    palier++;
    construire(lu);
  }

  function appliquerReglages() {
    const u = vVit.material.uniforms as Record<string, IUniform>;
    u.uRaideur!.value = r.raideur;
    u.uAmorti!.value = r.amorti;
    u.uBruit!.value = r.bruit;
    materiau.uniforms.uTaille!.value = r.taille;
    materiau.uniforms.uAdditif!.value = r.additif ? 1 : 0;
    materiau.blending = r.additif ? AdditiveBlending : NormalBlending;
  }

  function viser(cible: Cible, reg: Partial<Reglages> = {}, retard = 0, instant = false) {
    derniereCible = { c: cible, decalage: retard };
    Object.assign(r, reg);
    appliquerReglages();
    const n = TW * TH;
    const m = Math.floor(cible.points.length / 3);
    const t = temps();
    const c = tCible.image.data as Float32Array;

    // Couleurs : l'ancienne devient le départ, la nouvelle suit un dégradé gauche → droite.
    (tCouleurAvant.image.data as Uint8Array).set(tCouleur.image.data as Uint8Array);
    tCouleurAvant.needsUpdate = true;
    const col = tCouleur.image.data as Uint8Array;
    const a = hex(cible.teinte[0]);
    const b = hex(cible.teinte[1] ?? cible.teinte[0]);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let j = 0; j < m; j++) {
      const x = cible.points[j * 3]!;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    const largeur = Math.max(1, maxX - minX);
    const eclat = cible.eclat ?? 0.85;

    for (let i = 0; i < n; i++) {
      const surplus = i >= m;
      const j = (surplus ? i % Math.max(1, m) : i) * 3;
      let x = m ? cible.points[j]! : Math.random() * W;
      let y = m ? cible.points[j + 1]! : Math.random() * H;
      let z = m ? cible.points[j + 2]! : 0;
      if (surplus && m) {
        const ang = Math.random() * Math.PI * 2;
        const ray = 20 + Math.random() * 120;
        x += Math.cos(ang) * ray;
        y += Math.sin(ang) * ray;
        z += (Math.random() - 0.5) * 200;
      }
      c[i * 4] = x;
      c[i * 4 + 1] = y;
      c[i * 4 + 2] = z;
      c[i * 4 + 3] = instant ? -1 : t + Math.random() * retard;
      const k = Math.min(1, Math.max(0, (x - minX) / largeur));
      col[i * 4] = Math.round((a[0] + (b[0] - a[0]) * k) * 255);
      col[i * 4 + 1] = Math.round((a[1] + (b[1] - a[1]) * k) * 255);
      col[i * 4 + 2] = Math.round((a[2] + (b[2] - a[2]) * k) * 255);
      col[i * 4 + 3] = Math.round((surplus ? 0.15 : eclat) * 255);
    }
    tCible.needsUpdate = true;
    tCouleur.needsUpdate = true;

    if (instant) {
      const pos = gpu.createTexture();
      const p = pos.image.data as Float32Array;
      for (let i = 0; i < n; i++) {
        p[i * 4] = c[i * 4]! + decalage.x;
        p[i * 4 + 1] = c[i * 4 + 1]! + decalage.y;
        p[i * 4 + 2] = c[i * 4 + 2]!;
        p[i * 4 + 3] = 1;
      }
      gpu.renderTexture(pos, vPos.renderTargets[0]!);
      gpu.renderTexture(pos, vPos.renderTargets[1]!);
      const zero = gpu.createTexture();
      gpu.renderTexture(zero, vVit.renderTargets[0]!);
      gpu.renderTexture(zero, vVit.renderTargets[1]!);
      pos.dispose();
      zero.dispose();
    }
    if (fige) dessiner(temps(), 0);
  }

  // Boucle
  let raf = 0;
  let fige = false;
  let precedent = 0;
  const durees: number[] = [];
  let lentDepuis = 0;

  function dessiner(t: number, dt: number) {
    const u = vVit.material.uniforms as Record<string, IUniform>;
    u.uTemps!.value = t;
    u.uDt!.value = dt;
    (vPos.material.uniforms as Record<string, IUniform>).uDt!.value = dt;
    u.uDecalage!.value = [decalage.x, decalage.y];

    // Souffle : proportionnel à la vitesse du curseur, qui retombe vite.
    ptr.v *= 0.9;
    u.uPointeur!.value = [ptr.x, ptr.y, 140, Math.min(ptr.v * 0.9, 2600) * r.souffle];
    u.uOndes!.value = ondes.flatMap((o) => [o.x, o.y, o.t0, o.f]);
    u.uExplosion!.value = explosion ?? [0, 0, 0, 0];
    explosion = null;

    if (dt > 0) gpu.compute();

    ptr.rx += (ptr.trx - ptr.rx) * 0.05;
    ptr.ry += (ptr.try - ptr.ry) * 0.05;
    const m = materiau.uniforms;
    m.texturePosition!.value = gpu.getCurrentRenderTarget(vPos).texture;
    m.textureVitesse!.value = gpu.getCurrentRenderTarget(vVit).texture;
    m.uTemps!.value = t;
    m.uRot!.value = [ptr.rx, ptr.ry];

    const k = Math.min(1, (performance.now() - fondT0) / fondDuree);
    fondActuel.copy(fondDepart).lerp(fondCible, k * k * (3 - 2 * k));
    renderer.setClearColor(fondActuel, 1);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    etat.frames++;
  }

  function tic(now: number) {
    raf = 0;
    const dt = precedent ? Math.min((now - precedent) / 1000, 1 / 30) : 1 / 60;
    if (precedent) {
      durees.push(now - precedent);
      if (durees.length > 120) durees.shift();
      const moy = durees.reduce((s, d) => s + d, 0) / durees.length;
      // Garde-fou : sous 40 i/s pendant 2 s, on descend d'un palier.
      if (durees.length >= 60 && moy > 25) {
        if (!lentDepuis) lentDepuis = now;
        else if (now - lentDepuis > 2000) {
          descendre();
          durees.length = 0;
          lentDepuis = 0;
        }
      } else lentDepuis = 0;
    }
    precedent = now;
    dessiner(temps(), dt);
    demarrer();
  }

  function demarrer() {
    if (!raf && !fige && !document.hidden && !perdu) raf = requestAnimationFrame(tic);
    etat.running = raf !== 0;
  }
  function arreter() {
    cancelAnimationFrame(raf);
    raf = 0;
    precedent = 0;
    etat.running = false;
  }

  let perdu = false;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    perdu = true;
    arreter();
    document.documentElement.dataset.particules = 'off';
  });

  const onVis = () => (document.hidden ? arreter() : demarrer());
  document.addEventListener('visibilitychange', onVis);

  const onMove = (e: PointerEvent) => {
    const now = performance.now();
    if (ptr.x > -9000 && now > ptr.last) {
      const d = Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y);
      ptr.v = Math.max(ptr.v, (d / Math.max(now - ptr.last, 8)) * 1000);
    }
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.last = now;
    // Parallaxe : ±4° suivant la position du curseur.
    const deg = (4 * Math.PI) / 180;
    ptr.try = ((e.clientX / W) * 2 - 1) * deg;
    ptr.trx = -((e.clientY / H) * 2 - 1) * deg;
  };
  const onDown = (e: PointerEvent) => impulsion(e.clientX, e.clientY, 2200, 0);
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerdown', onDown, { passive: true });

  let largeur = W;
  const onResize = () => {
    W = innerWidth;
    H = innerHeight;
    renderer.setSize(W, H, false);
    materiau.uniforms.uRes!.value = [W, H];
    if (fige) dessiner(temps(), 0);
    if (W !== largeur) largeur = W;
  };
  addEventListener('resize', onResize);

  function impulsion(x: number, y: number, force: number, rayon: number) {
    if (rayon > 0) explosion = [x, y, force, rayon];
    else {
      ondes[prochaineOnde] = { x, y, t0: temps(), f: force };
      prochaineOnde = (prochaineOnde + 1) % ondes.length;
    }
  }

  construire();
  demarrer();

  return {
    get palier() {
      return palier;
    },
    get n() {
      return TW * TH;
    },
    viser,
    reglages(reg) {
      Object.assign(r, reg);
      appliquerReglages();
    },
    decaler(dx, dy) {
      decalage = { x: dx, y: dy };
      if (fige) dessiner(temps(), 0);
    },
    fond(couleur, duree = 450) {
      fondDepart.copy(fondActuel);
      fondCible.set(couleur);
      fondT0 = performance.now();
      fondDuree = Math.max(1, duree);
      if (fige) dessiner(temps(), 0);
    },
    impulsion,
    figer(on) {
      fige = on;
      if (on) {
        arreter();
        fondDuree = 1;
        dessiner(temps(), 0);
      } else demarrer();
    },
    detruire() {
      arreter();
      document.removeEventListener('visibilitychange', onVis);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerdown', onDown);
      removeEventListener('resize', onResize);
      demonter();
      renderer.dispose();
    },
  };
}
