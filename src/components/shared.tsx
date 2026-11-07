import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { api } from '../api';
import { CONTRIB_LABEL, type Asset, type Project, type Settings } from '../types';
import { PdfFirstPage } from './pdfCarousel';

export function useFetch<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setLoading(true);
    let finalUrl = url;
    if (
      typeof window !== 'undefined' &&
      url.startsWith('/api/public/projects') &&
      (sessionStorage.getItem('alturix_preview') === '1' ||
        new URLSearchParams(window.location.search).get('preview') === '1')
    ) {
      finalUrl += (url.includes('?') ? '&' : '?') + 'preview=1';
    }
    api<T>('GET', finalUrl)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    /* eslint-disable-next-line */
  }, [url, ...deps]);
  return { data, loading, error, setData };
}

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fallback = setTimeout(() => el.classList.add('in'), 80);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('in');
          io.disconnect();
        }
      },
      { threshold: 0.01 }
    );
    io.observe(el);
    return () => {
      clearTimeout(fallback);
      io.disconnect();
    };
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${Math.min(delay, 120)}ms` }} className={`reveal in ${className}`}>
      {children}
    </div>
  );
}

/** Scroll progress bar. */
export function Effects() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const u = () => {
      const h = document.documentElement;
      const m = h.scrollHeight - h.clientHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${m > 0 ? window.scrollY / m : 0})`;
      raf = requestAnimationFrame(u);
    };
    raf = requestAnimationFrame(u);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={bar} aria-hidden className="fixed left-0 top-0 z-[65] h-[3px] w-full origin-left scale-x-0 bg-sun" style={{ boxShadow: '0 1px 0 #171717' }} />;
}

/** Letter-by-letter rising headline. */
export function Split({ text, delay = 0, step = 45 }: { text: string; delay?: number; step?: number }) {
  return (
    <span aria-label={text}>
      {[...text].map((c, i) => (
        <span key={i} aria-hidden className="ch">
          <span style={{ animationDelay: `${delay + i * step}ms` }}>{c === ' ' ? '\u00A0' : c}</span>
        </span>
      ))}
    </span>
  );
}

/** Highlighter-swipe text — the ALTURIX signature. */
export function Mark({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.classList.add('on'), 350);
    return () => clearTimeout(t);
  }, []);
  return <span ref={ref} className="mark">{children}</span>;
}

/** Cover renderer: image, video poster (or first frame), or PDF cover page. */
export function Cover({ asset, className = '', alt = '' }: { asset: Asset | null; className?: string; alt?: string }) {
  if (!asset) return <div className={`bg-paper ${className}`} />;
  if (asset.kind === 'image') return <img src={asset.url} alt={alt} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
  if (asset.kind === 'video')
    return asset.poster_url ? (
      <img src={asset.poster_url} alt={alt} loading="lazy" className={`object-cover ${className}`} />
    ) : (
      <video src={asset.url + '#t=0.5'} muted preload="metadata" playsInline aria-label={alt} className={`object-cover ${className}`} />
    );
  if (asset.kind === 'pdf')
    return asset.poster_url ? (
      <img src={asset.poster_url} alt={alt} loading="lazy" className={`object-cover ${className}`} />
    ) : (
      <PdfFirstPage url={asset.url} className={className} />
    );
  return <div className={`bg-paper ${className}`} />;
}

export function ProjectCard({ p, index, tall }: { p: Project; index: number; tall?: boolean }) {
  const videoCount = p.assets.filter((a) => a.kind === 'video').length;
  const hasVideo = p.cover?.kind === 'video' || videoCount > 0;
  const hasPdfOrCarousel =
    p.cover?.kind === 'pdf' || p.assets.some((a) => a.kind === 'pdf') || p.assets.filter((a) => a.kind === 'image').length > 1;
  return (
    <Reveal delay={(index % 3) * 80}>
      <Link
        to={`/work/${p.slug}`}
        data-cursor
        data-cursor-label={hasVideo ? 'PLAY' : hasPdfOrCarousel ? 'SWIPE' : 'VIEW'}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5,
            y = (e.clientY - r.top) / r.height - 0.5;
          (e.currentTarget.firstElementChild as HTMLElement).style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) scale(1.015)`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget.firstElementChild as HTMLElement).style.transform = '';
        }}
      >
        <div className={`tilt relative overflow-hidden rounded-[4px] bg-paper shadow-[0_1px_0_rgba(23,23,23,.08)] ${tall ? 'aspect-[4/5]' : hasVideo ? 'aspect-video' : 'aspect-[16/11]'}`}>
          <Cover asset={p.cover || p.assets[0] || null} alt={p.title} className="h-full w-full transition duration-700 group-hover:scale-[1.04]" />
          {hasVideo ? (
            <span className="label absolute left-3 top-3 rounded-full border border-ink bg-sun px-3 py-1 text-ink shadow-[2px_2px_0_#171717]">
              ▶ {videoCount > 1 ? `${videoCount} Videos` : 'Video'}
            </span>
          ) : hasPdfOrCarousel ? (
            <span className="label absolute left-3 top-3 rounded-full border border-ink bg-sun px-3 py-1">▤ Carousel</span>
          ) : null}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="label text-ink/55">
              № {String(index + 1).padStart(2, '0')} — {p.category || p.section} / {CONTRIB_LABEL[p.contribution]}
            </p>
            <h3 className="heading-expressive mt-1.5 text-2xl leading-tight md:text-3xl">
              <span className="mark">{p.title}</span>
            </h3>
            {p.summary && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/75">{p.summary}</p>
            )}
          </div>
          <span className="font-grotesk text-xl transition group-hover:translate-x-1">→</span>
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * Premium 3D-Style Floating Editorial Cutout Portrait of Divyanshu Saini.
 * Uses the actual background-removed studio photograph (`/divyanshu-cutout.png`)
 * with multi-plane depth separation, dynamic parallax shadow, and subtle cosmic accents.
 */
export function FloatingPortrait3D({
  customUrl,
  caption,
  badge,
  variant = 'hero',
}: {
  customUrl?: string;
  caption?: string;
  badge?: ReactNode;
  variant?: 'hero' | 'about';
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });

  // Use the background-removed cutout when using the default portrait
  const isDefaultPortrait = !customUrl || customUrl === '/divyanshu.jpg';
  const portraitSrc = isDefaultPortrait ? '/divyanshu-cutout.png' : customUrl;

  const handleMove = (clientX: number, clientY: number, rect: DOMRect) => {
    const nx = Math.max(-0.5, Math.min(0.5, (clientX - rect.left) / Math.max(1, rect.width) - 0.5));
    const ny = Math.max(-0.5, Math.min(0.5, (clientY - rect.top) / Math.max(1, rect.height) - 0.5));
    setTilt({ x: nx, y: ny, active: true });
  };

  const rotY = tilt.x * 13;
  const rotX = -tilt.y * 11;
  const shadowX = -tilt.x * 22;
  const shadowY = -tilt.y * 16 + 12;

  return (
    <figure
      data-cursor-label="DIVYANSHU"
      onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
      onTouchMove={(e) => {
        if (e.touches[0]) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget.getBoundingClientRect());
        }
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0, active: false })}
      onTouchEnd={() => setTilt({ x: 0, y: 0, active: false })}
      className="group relative mx-auto w-full max-w-[380px] select-none pt-6"
      style={{ perspective: '1150px' }}
    >
      {/* 3D Stage Container */}
      <div
        style={{
          transform: `rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${tilt.active ? 1.02 : 1})`,
          transformStyle: 'preserve-3d',
          transition: tilt.active
            ? 'transform 0.14s ease-out'
            : 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className="relative aspect-[4/5] w-full"
      >
        {/* PLANE 1 (Back Arch Stage): Warm Signature Yellow + Editorial Grid + Celestial Halo */}
        <div
          style={{ transform: 'translateZ(-18px)' }}
          className={`absolute inset-x-0 bottom-0 top-12 overflow-hidden border-2 border-ink bg-sun shadow-[12px_12px_0_#171717] transition-shadow duration-500 group-hover:shadow-[16px_16px_0_#171717] ${
            variant === 'hero' ? 'rounded-t-[999px] rounded-b-2xl' : 'rounded-3xl'
          }`}
        >
          {/* Radial studio rim light */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 28%, rgba(255,253,240,0.92) 0%, rgba(242,211,79,0.85) 54%, rgba(226,186,34,0.95) 100%)',
            }}
          />

          {/* Subtle celestial orbital rings inside the studio backdrop */}
          <svg
            aria-hidden
            viewBox="0 0 400 460"
            fill="none"
            className="absolute inset-0 h-full w-full opacity-25"
          >
            <circle cx="200" cy="185" r="142" stroke="#171717" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="200" cy="185" r="106" stroke="#171717" strokeWidth="0.75" />
            <ellipse
              cx="200"
              cy="195"
              rx="170"
              ry="58"
              stroke="#171717"
              strokeWidth="1"
              transform="rotate(-14 200 195)"
            />
          </svg>
        </div>

        {/* PLANE 2 (Dynamic Soft Parallax Cast Shadow behind cutout subject) */}
        <div
          aria-hidden
          style={{
            transform: `translate3d(${shadowX}px, ${shadowY}px, 2px) scale(0.985)`,
            transition: tilt.active ? 'transform 0.14s ease-out' : 'transform 0.65s ease-out',
          }}
          className="pointer-events-none absolute inset-x-0 bottom-0 -top-2 overflow-hidden rounded-b-2xl"
        >
          <img
            src={portraitSrc}
            alt=""
            className="h-full w-full object-contain object-bottom opacity-30 blur-[10px] brightness-0"
          />
        </div>

        {/* PLANE 3 (Foreground Cutout Subject — Head rises out above the arch frame in 3D space) */}
        <div
          style={{
            transform: `translate3d(${tilt.x * 10}px, ${tilt.y * 8}px, 34px)`,
            transition: tilt.active ? 'transform 0.14s ease-out' : 'transform 0.65s ease-out',
          }}
          className={`pointer-events-none absolute inset-x-0 bottom-0 -top-3 overflow-hidden ${
            variant === 'hero' ? 'rounded-b-2xl' : 'rounded-b-3xl'
          }`}
        >
          <img
            src={portraitSrc}
            alt="Portrait of Divyanshu Saini"
            width={800}
            height={800}
            fetchPriority={variant === 'hero' ? 'high' : 'auto'}
            className="h-full w-full object-contain object-bottom drop-shadow-[0_14px_24px_rgba(23,23,23,0.28)] transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
        </div>

        {/* PLANE 4 (Orbiting Space Stickers in Foreground Depth) */}
        <img
          src="/stickers/planet-saturn-gold.png"
          alt=""
          aria-hidden
          style={{
            transform: `translate3d(${tilt.x * 24}px, ${tilt.y * 20}px, 52px) rotate(-12deg)`,
            transition: tilt.active ? 'transform 0.14s ease-out' : 'transform 0.65s ease-out',
          }}
          className="pointer-events-none absolute -right-5 top-2 z-20 w-16 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] animate-subtleFloat sm:w-20"
        />

        <img
          src="/stickers/sticker-astronaut.png"
          alt=""
          aria-hidden
          style={{
            transform: `translate3d(${tilt.x * -18}px, ${tilt.y * -16}px, 46px) rotate(8deg)`,
            transition: tilt.active ? 'transform 0.14s ease-out' : 'transform 0.65s ease-out',
          }}
          className="pointer-events-none absolute -left-5 top-12 z-20 w-14 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] animate-subtleFloat sm:w-16"
        />
      </div>

      {badge && (
        <div className="absolute -bottom-6 -left-6 z-30 hidden animate-floaty md:block">{badge}</div>
      )}

      {caption && <figcaption className="label mt-5 text-center text-ink/65">{caption}</figcaption>}
    </figure>
  );
}

export function Empty({ title, note }: { title: string; note: string }) {
  return (
    <div className="border border-dashed border-ink/30 px-6 py-20 text-center">
      <p className="display-serif text-4xl">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">{note}</p>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { data: s } = useFetch<Settings>('/api/public/settings');
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();
  if (new URLSearchParams(search).get('preview') === '1') sessionStorage.setItem('alturix_preview', '1');
  if (new URLSearchParams(search).get('preview') === '0') sessionStorage.removeItem('alturix_preview');
  const preview = !!sessionStorage.getItem('alturix_preview');
  useEffect(() => setOpen(false), [pathname]);
  const links = [
    ['/', 'Home'],
    ['/universe', 'Creative Universe'],
    ['/video-editing', 'Video Editing'],
    ['/graphic-design', 'Graphic Design'],
    ['/case-studies', 'Case Studies'],
    ['/experiments', 'Experiments'],
    ['/about', 'About'],
    ['/contact', 'Contact'],
  ];
  const cls = ({ isActive }: { isActive: boolean }) => `nav-font py-1 ${isActive ? 'border-b-2 border-sun' : 'opacity-70 hover:opacity-100'}`;

  return (
    <>
      <Effects />
      {preview && (
        <div className="label relative z-50 flex items-center justify-center gap-4 bg-ink px-4 py-2 text-sun">
          Preview mode — drafts visible only to you (admin) <a className="underline" href="/?preview=0">Exit</a>
        </div>
      )}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-sun focus:p-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 w-full max-w-[100vw] overflow-x-hidden border-b border-ink/10 bg-ivory/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 md:px-10">
          <Link to="/" data-cursor aria-label="ALTURIX Home" className="inline-flex items-center py-0.5 transition-transform duration-300 hover:scale-[1.03]">
            <img src="/alturix-logo.png" alt="ALTURIX" className="h-5 w-auto sm:h-6 md:h-7" />
          </Link>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            {links.map(([to, l]) => (
              <NavLink key={to} to={to} end={to === '/'} className={cls}>
                {l}
              </NavLink>
            ))}
          </nav>
          <button className="btn !py-1.5 lg:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
            {open ? 'Close ✕' : 'Menu ＋'}
          </button>
        </div>
        {open && (
          <nav id="mobile-nav" className="page flex flex-col gap-3 border-t border-ink/10 px-5 pb-8 pt-5 lg:hidden" aria-label="Mobile">
            {links.map(([to, l]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `display text-3xl tracking-tight ${
                    isActive ? 'text-ink underline decoration-sun decoration-[6px] underline-offset-4' : 'text-ink/80'
                  }`
                }
              >
                {l}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main id="main" key={pathname} className="page w-full max-w-[100vw] overflow-x-hidden">
        {children}
      </main>
      <footer className="mt-32 w-full max-w-[100vw] overflow-x-hidden bg-ink text-ivory">
        <div className="mx-auto max-w-[1500px] px-5 py-16 md:px-10">
          <Link to="/" className="mb-8 inline-block">
            <img src="/alturix-logo-light.png" alt="ALTURIX" className="h-7 w-auto md:h-10" />
          </Link>
          <p className="display text-[26vw] text-ivory md:text-[16vw]">
            MAD<span className="text-sun">.</span>
          </p>
          <p className="display-serif text-3xl text-sun md:text-5xl">Make. Adapt. Discover.</p>
          <div className="label mt-12 flex flex-wrap justify-between gap-4 text-ivory/60">
            <span>© {new Date().getFullYear()} Divyanshu Saini — ALTURIX</span>
            <span className="flex flex-wrap gap-6">
              {s?.instagram && (
                <a
                  className="hover:text-sun"
                  href={s.instagram.startsWith('http') ? s.instagram : `https://instagram.com/${s.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              )}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
