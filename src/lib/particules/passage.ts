/**
 * Le passage entre deux pages : au clic, le nuage éclate ; la page d'arrivée
 * repart de ce nuage (même centre, même graine, rayon grandi du temps écoulé)
 * et le reforme en logo. Le lien reste un vrai lien : sans JS, il marche.
 */
export type Passage = { x: number; y: number; t: number; graine: number; teinte: string; vers: string };

const CLE = 'passage';
const DUREE_VIE = 4000;
const maintenant = () => performance.timeOrigin + performance.now();

export function ecrirePassage(p: Passage): void {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(p));
  } catch {
    /* stockage refusé : on navigue sans passage */
  }
}

/** Le passage vers `chemin`, consommé une fois ; ignoré s'il a plus de 4 s ou vise une autre page. */
export function lirePassage(chemin: string): Passage | null {
  let brut: string | null = null;
  try {
    brut = sessionStorage.getItem(CLE);
    sessionStorage.removeItem(CLE);
  } catch {
    return null;
  }
  if (!brut) return null;
  try {
    const p = JSON.parse(brut) as Passage;
    const vers = new URL(p.vers, location.href).pathname;
    if (vers !== chemin || maintenant() - p.t > DUREE_VIE) return null;
    return p;
  } catch {
    return null;
  }
}

/** Points d'un nuage éclaté : un disque de rayon `rayon` autour de (x, y), tiré de `graine`. */
export function nuage(p: Passage, n: number): Float32Array {
  const rayon = Math.min(Math.hypot(innerWidth, innerHeight), 260 + (maintenant() - p.t) * 1.4);
  let s = p.graine >>> 0 || 1;
  const hasard = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
  const pts = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = hasard() * Math.PI * 2;
    const r = rayon * Math.sqrt(hasard());
    pts[i * 3] = p.x + Math.cos(a) * r;
    pts[i * 3 + 1] = p.y + Math.sin(a) * r;
    pts[i * 3 + 2] = (hasard() - 0.5) * 200;
  }
  return pts;
}

const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Les liens internes vers une autre page du site partent en particules :
 * éclatement au point du clic, passage écrit, puis navigation 260 ms plus tard.
 */
export function bootPassages(): void {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;
    if (!url.pathname.startsWith('/projets/') && url.pathname !== '/') return;
    const chef = window.__chef; // pas d'import du chef : il reste hors du paquet de départ
    if (!chef || calme()) return;
    e.preventDefault();
    const r = a.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2;
    const y = e.clientY || r.top + r.height / 2;
    chef.eclater(x, y, 3200);
    const teinte = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
    ecrirePassage({ x, y, t: maintenant(), graine: Math.floor(Math.random() * 2 ** 31), teinte, vers: url.href });
    setTimeout(() => (location.href = url.href), 260);
  });
}
