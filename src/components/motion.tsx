import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import type { Project } from '../types';
import { Cover } from './shared';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Inertial smooth scroll + scroll velocity (--vel) + scroll position (--sy / --prog) for CSS. */
export function SmoothScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (reduced()) return;
    const l = new Lenis({ lerp: 0.085, wheelMultiplier: 0.98 });
    (window as any).__lenis = l;
    let raf = 0, vel = 0;
    const loop = (t: number) => {
      l.raf(t);
      vel += (Math.max(-16, Math.min(16, l.velocity * 0.55)) - vel) * 0.14;
      const h = document.documentElement;
      h.style.setProperty('--vel', vel.toFixed(2));
      h.style.setProperty('--sy', String(l.scroll));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); l.destroy(); (window as any).__lenis = null; };
  }, []);
  useEffect(() => {
    const l = (window as any).__lenis as Lenis | null;
    l ? l.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Interactive full-viewport canvas inspired by haoqi.design's ambient WebGL/canvas layer,
 * tailored to ALTURIX's "Universe as a Contact Sheet" identity:
 * - Responsive grid of micro-crosshairs & elastic nodes that warp around the cursor
 * - Smooth yellow (#F2D34F) kinetic ribbon trail when the pointer moves
 * - Reacts to scroll velocity
 */
export function LiveCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (reduced()) return;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let mx = w * 0.65, my = h * 0.38, tx = mx, ty = my;
    const trail: { x: number; y: number; a: number }[] = [];
    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      trail.push({ x: tx, y: ty, a: 1 });
      if (trail.length > 26) trail.shift();
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // Floating ambient orbs
    const orbs = Array.from({ length: 6 }, (_, i) => ({
      x: (w * (i + 1)) / 7,
      y: (h * ((i * 3) % 5 + 1)) / 6,
      vx: (i % 2 === 0 ? 1 : -1) * (0.25 + i * 0.05),
      vy: (i % 3 === 0 ? 1 : -1) * (0.2 + i * 0.04),
      r: 90 + i * 28,
    }));

    let raf = 0;
    let time = 0;
    const draw = () => {
      time += 0.015;
      mx += (tx - mx) * 0.12;
      my += (ty - my) * 0.12;
      ctx.clearRect(0, 0, w, h);

      // Soft warm sun glow following cursor + ambient orbs
      for (const o of orbs) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -100 || o.x > w + 100) o.vx *= -1;
        if (o.y < -100 || o.y > h + 100) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 1.6);
        g.addColorStop(0, 'rgba(242, 211, 79, 0.11)');
        g.addColorStop(1, 'rgba(242, 211, 79, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      const cg = ctx.createRadialGradient(mx, my, 0, mx, my, 240);
      cg.addColorStop(0, 'rgba(242, 211, 79, 0.24)');
      cg.addColorStop(1, 'rgba(242, 211, 79, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(mx, my, 240, 0, Math.PI * 2);
      ctx.fill();

      // Elastic contact-sheet crosshair grid
      const step = w < 768 ? 84 : 112;
      const sy = parseFloat(document.documentElement.style.getPropertyValue('--sy') || '0');
      const offsetY = -(sy * 0.18) % step;
      ctx.strokeStyle = 'rgba(23, 23, 23, 0.12)';
      ctx.lineWidth = 1;

      for (let gx = step * 0.5; gx < w; gx += step) {
        for (let gy = offsetY - step; gy < h + step; gy += step) {
          const dx = gx - mx;
          const dy = gy - my;
          const dist = Math.hypot(dx, dy);
          const pull = Math.max(0, 1 - dist / 240);
          const px = gx + (dx / (dist || 1)) * pull * 22 + Math.sin(time + gx * 0.01) * 1.8;
          const py = gy + (dy / (dist || 1)) * pull * 22 + Math.cos(time + gy * 0.01) * 1.8;
          const sz = 2.5 + pull * 3.5;

          ctx.beginPath();
          ctx.moveTo(px - sz, py);
          ctx.lineTo(px + sz, py);
          ctx.moveTo(px, py - sz);
          ctx.lineTo(px, py + sz);
          ctx.stroke();

          if (pull > 0.35) {
            ctx.fillStyle = `rgba(242, 211, 79, ${pull * 0.9})`;
            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Smooth kinetic ribbon trail
      if (trail.length > 2) {
        ctx.beginPath();
        for (let i = 0; i < trail.length; i++) {
          const pt = trail[i];
          pt.a *= 0.92;
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = 'rgba(242, 211, 79, 0.55)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      while (trail.length && trail[0].a < 0.08) trail.shift();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0" />;
}

/** Intro: counter 0→100, wordmark, then curtain lifts. Shown once per session. */
export function Preloader() {
  const seen = typeof window !== 'undefined' && (sessionStorage.getItem('alturix_loaded') === '1' || new URLSearchParams(window.location.search).get('nopreload') === '1');
  if (typeof document !== 'undefined') document.documentElement.dataset.ready = '1';
  const [n, setN] = useState(seen ? 100 : 0);
  const [done, setDone] = useState(seen);
  useEffect(() => {
    if (seen) { document.documentElement.dataset.ready = '1'; return; }
    document.body.style.overflow = 'hidden';
    const t0 = Date.now();
    const dur = reduced() ? 180 : 1250;
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p >= 1) {
        clearInterval(iv);
        setTimeout(() => {
          document.documentElement.dataset.ready = '1';
          document.body.style.overflow = '';
          sessionStorage.setItem('alturix_loaded', '1');
          setTimeout(() => setDone(true), 850);
        }, 150);
      }
    }, 16);
    return () => { clearInterval(iv); document.body.style.overflow = ''; };
  }, [seen]);
  if (done) return null;
  const lifting = n === 100;
  return (
    <div aria-hidden className={`fixed inset-0 z-[80] flex flex-col justify-between bg-ink p-6 text-ivory transition-transform duration-[800ms] ease-[cubic-bezier(.76,0,.24,1)] md:p-10 ${lifting ? '-translate-y-full [transition-delay:150ms]' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="label text-sun">ALTURIX — A Creative Universe</p>
        <p className="label text-ivory/50">DIVYANSHU SAINI © 2026</p>
      </div>
      <p className="display text-[34vw] leading-none md:text-[22vw]">{String(n).padStart(3, '0')}</p>
      <div>
        <div className="h-[3px] w-full bg-ivory/20"><div className="h-full bg-sun" style={{ width: `${n}%` }} /></div>
        <p className="label mt-3 flex justify-between text-ivory/60"><span>Make. Adapt. Discover.</span><span>Initializing Studio</span></p>
      </div>
    </div>
  );
}

const ROUTE_SECTORS: Record<string, { sector: string; title: string; sticker: string }> = {
  '/': { sector: 'SECTOR 00 // ORIGIN', title: 'ALTURIX STUDIO', sticker: '/stickers/planet-saturn-gold.png' },
  '/universe': { sector: 'SECTOR 01 // DEEP FIELD', title: 'THE CREATIVE UNIVERSE', sticker: '/stickers/sticker-astronaut.png' },
  '/video-editing': { sector: 'SECTOR 02 // MOTION ORBIT', title: 'VIDEO EDITING & REELS', sticker: '/stickers/sticker-rocket.png' },
  '/graphic-design': { sector: 'SECTOR 03 // VISUAL ARCHIVE', title: 'GRAPHIC DESIGN', sticker: '/stickers/vintage-saturn.png' },
  '/case-studies': { sector: 'SECTOR 04 // MONOGRAPHS', title: 'CASE STUDIES', sticker: '/stickers/sticker-telescope.png' },
  '/experiments': { sector: 'SECTOR 05 // LABS', title: 'EXPERIMENTS', sticker: '/stickers/sticker-ufo.png' },
  '/about': { sector: 'SECTOR 06 // FOUNDER', title: 'DIVYANSHU SAINI', sticker: '/stickers/vintage-astronaut-moon.png' },
  '/contact': { sector: 'SECTOR 07 // TRANSMISSION', title: 'START A CONVERSATION', sticker: '/stickers/sticker-satellite.png' },
};

/** Space-inspired transition curtain that unmounts cleanly after route changes (no protruding curved SVG line). */
export function RouteCurtain() {
  const { pathname } = useLocation();
  const prev = useRef(pathname);
  const [k, setK] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (prev.current === pathname) return;
    prev.current = pathname;
    if (!reduced()) {
      setK((x) => x + 1);
      setActive(true);
      const t = setTimeout(() => setActive(false), 980);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  const meta =
    ROUTE_SECTORS[pathname] ||
    (pathname.startsWith('/work/')
      ? {
          sector: 'EXHIBITION PIECE',
          title: pathname.replace('/work/', '').replace(/-/g, ' ').toUpperCase(),
          sticker: '/stickers/planet-terra-ring.png',
        }
      : ROUTE_SECTORS['/']);

  return active && k ? (
    <div
      key={k}
      aria-hidden
      onAnimationEnd={() => setActive(false)}
      className="curtain fixed inset-0 z-[75] flex items-center justify-center bg-[#0E0E0D] text-ivory"
    >
      <div className="relative flex flex-col items-center justify-center px-6 text-center">
        <div
          className="pointer-events-none absolute h-64 w-64 rounded-full opacity-35 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(242,211,79,0.55) 0%, transparent 70%)',
          }}
        />
        <img
          src={meta.sticker}
          alt=""
          className="mb-4 h-16 w-16 object-contain drop-shadow-[0_10px_24px_rgba(242,211,79,0.3)] md:h-20 md:w-20"
        />
        <p className="label text-sun">{meta.sector}</p>
        <p className="display mt-2 text-3xl tracking-tight text-ivory md:text-5xl">{meta.title}</p>
      </div>
    </div>
  ) : null;
}

/**
 * Clean Section Transition Wrapper (curved SVG overlay removed).
 */
export function WaveSection({
  children,
  id,
  className = '',
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  waveColor?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
        }
      },
      { threshold: 0.04 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`wave-section relative ${entered ? 'wave-entered' : ''} ${className}`}
    >
      {children}
    </section>
  );
}

/** Fixed corner chrome inspired by haoqi.design: live timecode, cursor X/Y, section & scroll %. */
export function Hud() {
  const { pathname } = useLocation();
  const [t, setT] = useState('');
  const xy = useRef<HTMLSpanElement>(null);
  const p = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }));
    f();
    const i = setInterval(f, 1000);
    const onMove = (e: MouseEvent) => {
      if (xy.current) xy.current.textContent = `X:${String(Math.round(e.clientX)).padStart(4, '0')} Y:${String(Math.round(e.clientY)).padStart(4, '0')}`;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    let raf = 0;
    const u = () => {
      const h = document.documentElement;
      const m = h.scrollHeight - h.clientHeight;
      if (p.current) p.current.textContent = String(Math.round(m > 0 ? (window.scrollY / m) * 100 : 0)).padStart(2, '0') + '%';
      raf = requestAnimationFrame(u);
    };
    raf = requestAnimationFrame(u);
    return () => { clearInterval(i); cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); };
  }, []);
  const name = pathname === '/' ? '01 // INDEX' : `// ${pathname.split('/')[1].replace('-', ' ').toUpperCase()}`;
  return (
    <div aria-hidden className="label pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden items-end justify-between px-10 pb-4 text-white mix-blend-difference md:flex">
      <span className="flex items-center gap-3"><span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sun" /> IST {t}</span>
      <span ref={xy} className="tabular-nums opacity-75">X:0000 Y:0000</span>
      <span>{name}</span>
      <span ref={p} className="tabular-nums">00%</span>
    </div>
  );
}

/** Live 24fps NLE editor timecode readout. */
export function Timecode() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduced()) return;
    let f = 0;
    const id = setInterval(() => {
      f = (f + 1) % (24 * 3600);
      const mm = String(Math.floor(f / (24 * 60)) % 60).padStart(2, '0');
      const ss = String(Math.floor(f / 24) % 60).padStart(2, '0');
      const ff = String(f % 24).padStart(2, '0');
      if (ref.current) ref.current.textContent = `00:${mm}:${ss}:${ff}`;
    }, 1000 / 24);
    return () => clearInterval(id);
  }, []);
  return <span ref={ref} className="tabular-nums">00:00:08:14</span>;
}

/** Pointer-driven effects: cursor label, magnetic buttons. Cursor element is owned here. */
export function Pointer() {
  const cur = useRef<HTMLDivElement>(null); const txt = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!fine() || reduced()) return;
    document.body.classList.add('has-cursor');
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; if (cur.current) cur.current.style.transform = `translate(${cx}px,${cy}px)`; raf = requestAnimationFrame(loop); }; loop();
    const move = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY;
      const b = (e.target as HTMLElement).closest('.btn') as HTMLElement | null;
      document.querySelectorAll<HTMLElement>('.btn').forEach((el) => { if (el !== b) el.style.translate = ''; });
      if (b) { const r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.28}px ${(e.clientY - r.top - r.height / 2) * 0.38}px`; }
    };
    const over = (e: MouseEvent) => {
      const el = e.target as HTMLElement; const lab = el.closest('[data-cursor-label]') as HTMLElement | null;
      cur.current?.classList.toggle('big', !!el.closest('a,button,[data-cursor]'));
      cur.current?.classList.toggle('label-on', !!lab);
      if (txt.current) txt.current.textContent = lab?.dataset.cursorLabel || '';
    };
    window.addEventListener('mousemove', move); window.addEventListener('mouseover', over);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', move); window.removeEventListener('mouseover', over); document.body.classList.remove('has-cursor'); };
  }, []);
  return <div ref={cur} aria-hidden className="cursor"><span ref={txt} className="label" /></div>;
}

/** Hero headline whose letters swell in weight and lift near the pointer. */
export function WeightField({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!fine() || reduced()) return; const root = ref.current!; let mx = -999, my = -999, raf = 0, active = false;
    const letters = () => [...root.querySelectorAll<HTMLElement>('.ch > span')];
    const frame = () => {
      letters().forEach((l) => {
        const r = l.getBoundingClientRect();
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        const t = Math.max(0, 1 - d / 360);
        const w = 700 - (1 - t) * 320;
        l.style.fontWeight = String(Math.round(w));
        l.style.transform = `translateY(${(-t * 10).toFixed(1)}px)`;
      });
      raf = active ? requestAnimationFrame(frame) : 0;
    };
    const m = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; if (!active) { active = true; frame(); } };
    const out = () => { mx = my = -999; setTimeout(() => (active = false), 700); };
    window.addEventListener('mousemove', m); root.addEventListener('mouseleave', out);
    return () => { window.removeEventListener('mousemove', m); root.removeEventListener('mouseleave', out); cancelAnimationFrame(raf); };
  }, []);
  return <h1 ref={ref} className={className} aria-label="ALTURIX">{children}</h1>;
}

/** Words light up as you scroll through the paragraph. */
export function ScrollWords({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current!; const w = [...el.querySelectorAll<HTMLElement>('span')]; let raf = 0;
    const u = () => {
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.45)));
      w.forEach((s, i) => {
        const v = Math.max(0, Math.min(1, p * w.length * 1.15 - i));
        s.style.opacity = String(0.16 + 0.84 * v);
        s.style.transform = `translateY(${((1 - v) * 8).toFixed(1)}px)`;
      });
      raf = requestAnimationFrame(u);
    };
    raf = requestAnimationFrame(u); return () => cancelAnimationFrame(raf);
  }, []);
  return <p ref={ref} className={className}>{text.split(' ').map((w, i) => <span key={i} className="inline-block transition-transform duration-150 mr-[0.26em]" style={{ opacity: 0.16 }}>{w}</span>)}</p>;
}

/** Pinned section that scrolls its content sideways as you scroll down. */
export function HRail({ children, count }: { children: ReactNode; count: number }) {
  const outer = useRef<HTMLDivElement>(null); const inner = useRef<HTMLDivElement>(null); const [desk, setDesk] = useState(true);
  useEffect(() => {
    const mq = matchMedia('(min-width: 768px)'); const set = () => setDesk(mq.matches && !reduced()); set(); mq.addEventListener('change', set); return () => mq.removeEventListener('change', set);
  }, []);
  useEffect(() => {
    if (!desk) return; let raf = 0;
    const u = () => { const o = outer.current, i = inner.current; if (o && i) { const r = o.getBoundingClientRect(); const max = o.offsetHeight - innerHeight; const p = Math.max(0, Math.min(1, -r.top / Math.max(1, max))); i.style.transform = `translate3d(${-p * Math.max(0, i.scrollWidth - innerWidth)}px,0,0)`; } raf = requestAnimationFrame(u); };
    raf = requestAnimationFrame(u); return () => cancelAnimationFrame(raf);
  }, [desk, count]);
  if (!desk) return <div className="flex snap-x gap-5 overflow-x-auto px-5 pb-4">{children}</div>;
  return <div ref={outer} style={{ height: `${Math.max(2, count) * 55 + 60}vh` }}><div className="sticky top-0 flex h-screen items-center overflow-hidden"><div ref={inner} className="flex gap-8 px-10 will-change-transform">{children}</div></div></div>;
}

/** Big typographic index; hovering a row floats that project's image after the cursor. */
export function HoverIndex({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<Project | null>(null); const pic = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0; const m = (e: MouseEvent) => { x = e.clientX; y = e.clientY; };
    const loop = () => { cx += (x - cx) * 0.15; cy += (y - cy) * 0.15; if (pic.current) pic.current.style.transform = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%) rotate(${(x - cx) * 0.04}deg)`; raf = requestAnimationFrame(loop); };
    window.addEventListener('mousemove', m); raf = requestAnimationFrame(loop); return () => { window.removeEventListener('mousemove', m); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <ul className="divide-y divide-ink/15 border-y border-ink/15" onMouseLeave={() => setActive(null)}>
        {projects.map((p, i) => (
          <li key={p.id}><Link to={`/work/${p.slug}`} data-cursor-label="OPEN" onMouseEnter={() => setActive(p)} className="group flex items-baseline justify-between gap-3 py-5 transition-all duration-500 hover:bg-sun hover:px-4 md:gap-4 md:py-7 md:hover:px-6">
            <span className="label w-11 shrink-0 text-ink/50 sm:w-12">№ {String(i + 1).padStart(2, '0')}</span>
            <span className="display h-md min-w-0 flex-1 truncate transition-transform duration-500 group-hover:translate-x-2">{p.title}</span>
            <span className="label hidden shrink-0 text-ink/60 md:block">{p.category || p.section}</span>
            <span className="shrink-0 whitespace-nowrap font-grotesk text-xl transition group-hover:translate-x-1 group-hover:-translate-y-1 sm:text-2xl">↗</span></Link></li>))}
      </ul>
      <div ref={pic} aria-hidden className={`pointer-events-none fixed left-0 top-0 z-30 hidden h-[300px] w-[240px] overflow-hidden border-2 border-ink bg-paper shadow-[10px_10px_0_#171717] transition-[opacity,scale] duration-300 md:block ${active ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
        {active && <Cover asset={active.cover} className="h-full w-full" />}
      </div>
    </>
  );
}
