import { VERT, FRAG } from './shader';
import { versGL, token } from './couleurs';
import { calm, coarse } from '../motion';

declare global {
  interface Window {
    __dither?: { running: boolean; frames: number };
  }
}

const state = { running: false, frames: 0 };
window.__dither = state;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

/** Rasterise le nom dans un canvas 2D : il sert de masque à la trame. */
function rasteriser(mask: HTMLCanvasElement, w: number, h: number, lignes: string[], dpr: number) {
  mask.width = Math.max(1, Math.round(w / 2));
  mask.height = Math.max(1, Math.round(h / 2));
  const ctx = mask.getContext('2d')!;
  const s = mask.width / w; // échelle masque / canvas
  ctx.fillStyle = token('--ink');
  ctx.fillRect(0, 0, mask.width, mask.height);

  // Même marge que la grille de la page (var(--gutter)).
  const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 24;
  const marge = gutter * dpr * s;
  const largeur = mask.width - marge * 2;
  ctx.fontStretch = 'expanded';
  ctx.textBaseline = 'alphabetic';

  // La ligne la plus longue occupe toute la largeur ; la hauteur plafonne la taille.
  const regler = (t: number) => {
    ctx.font = `500 ${t}px "Mona Sans"`;
    ctx.letterSpacing = `${-0.045 * t}px`;
  };
  regler(100);
  const plusLarge = Math.max(...lignes.map((l) => ctx.measureText(l).width));
  let taille = (100 * largeur) / plusLarge;
  taille = Math.min(taille, (mask.height * 0.86) / (lignes.length * 0.9));
  regler(taille);

  const interligne = taille * 0.9;
  const capitale = taille * 0.72;
  const bloc = interligne * (lignes.length - 1) + capitale;
  const y0 = (mask.height - bloc) / 2 + capitale;
  ctx.fillStyle = token('--paper');
  ctx.shadowColor = token('--paper');
  ctx.shadowBlur = taille * 0.05;
  lignes.forEach((l, i) => ctx.fillText(l, marge, y0 + i * interligne));
}

export function bootHero(): void {
  const el = document.querySelector<HTMLElement>('[data-hero]');
  const canvas = el?.querySelector<HTMLCanvasElement>('canvas');
  if (!el || !canvas) return;

  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) {
    document.documentElement.dataset.dither = 'off';
    return;
  }

  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
  } catch {
    document.documentElement.dataset.dither = 'off';
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = {
    res: u('u_res'), dpr: u('u_dpr'), time: u('u_time'), expo: u('u_expo'), mouse: u('u_mouse'),
    radius: u('u_radius'), cell: u('u_cell'), mask: u('u_mask'), ink: u('u_ink'), paper: u('u_paper'),
  };
  gl.uniform3fv(U.ink, versGL('--ink'));
  gl.uniform3fv(U.paper, versGL('--paper'));

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(U.mask, 0);

  const mask = document.createElement('canvas');
  const lignes = (el.dataset.lignes ?? 'THIBAULT|MORRETTON').split('|');
  const isCalm = calm();
  const isCoarse = coarse();

  let dpr = 1;
  let w = 0;
  let h = 0;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = Math.round(canvas.clientWidth * dpr);
    h = Math.round(canvas.clientHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    rasteriser(mask, w, h, lignes, dpr);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    gl.uniform2f(U.res, w, h);
    gl.uniform1f(U.dpr, dpr);
    gl.uniform1f(U.cell, Math.max(2, Math.round(2 * dpr)));
    gl.uniform1f(U.radius, Math.min(w, h) * 0.16);
  };

  // Souris : position amortie, force qui monte quand on entre, retombe quand on sort.
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, z: 0, tz: 0 };
  if (!isCalm && !isCoarse) {
    el.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) * dpr;
      mouse.ty = (e.clientY - r.top) * dpr;
      if (mouse.z < 0.01) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.tz = 1;
      wake();
    });
    el.addEventListener('pointerleave', () => { mouse.tz = 0; });
  }

  let expo = isCalm ? 1 : 0;
  let start = 0;
  let visible = true;
  let raf = 0;

  const frame = (now: number) => {
    raf = 0;
    if (!start) start = now;
    if (!isCalm) expo = Math.min(1, (now - start) / 1100);
    mouse.x += (mouse.tx - mouse.x) * 0.18;
    mouse.y += (mouse.ty - mouse.y) * 0.18;
    mouse.z += (mouse.tz - mouse.z) * 0.12;
    gl.uniform1f(U.time, isCalm ? 0 : now / 1000);
    gl.uniform1f(U.expo, 1 - Math.pow(1 - expo, 3));
    gl.uniform3f(U.mouse, mouse.x, mouse.y, mouse.z);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    state.frames++;
    if (!isCalm && visible && !document.hidden) raf = requestAnimationFrame(frame);
    state.running = raf !== 0;
  };
  const wake = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    state.running = raf !== 0;
  };

  new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting;
    if (visible) wake();
    else state.running = false;
  }).observe(el);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) wake();
    else state.running = false;
  });

  let width = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === width && Math.abs(canvas.clientHeight * dpr - h) < 2) return;
    width = innerWidth;
    resize();
    wake();
  });

  // Le masque a besoin de Mona Sans : on attend la police avant le premier tirage.
  const go = () => {
    resize();
    canvas.dataset.maskReady = '1';
    wake();
  };
  Promise.race([
    document.fonts.load('500 100px "Mona Sans"').then(() => document.fonts.ready),
    new Promise((r) => setTimeout(r, 1500)),
  ]).then(go);
}
