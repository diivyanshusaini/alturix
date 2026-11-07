import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { Asset } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/** Extract all pages of a PDF URL into high-resolution JPEG File objects for uploading as carousel slides. */
export async function extractPdfSlides(
  pdfUrl: string,
  baseName: string,
  onStatus?: (msg: string) => void
): Promise<File[]> {
  onStatus?.('Loading PDF document…');
  const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
  const total = pdf.numPages;
  const files: File[] = [];

  for (let p = 1; p <= total; p++) {
    onStatus?.(`Rendering slide ${p} of ${total}…`);
    const page = await pdf.getPage(p);
    const vp0 = page.getViewport({ scale: 1 });
    const scale = Math.min(2.2, 1600 / Math.max(vp0.width, vp0.height));
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport: vp, canvas } as any).promise;
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9));
    const num = String(p).padStart(2, '0');
    files.push(new File([blob], `${baseName}-slide-${num}.jpg`, { type: 'image/jpeg' }));
  }
  return files;
}

/** Renders Page 1 of a PDF onto a canvas as a cover fallback when poster_url is not set. */
export function PdfFirstPage({ url, className = '' }: { url: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    pdfjsLib
      .getDocument({ url })
      .promise.then((pdf) => pdf.getPage(1))
      .then((page) => {
        if (cancelled || !ref.current) return;
        const vp0 = page.getViewport({ scale: 1 });
        const scale = 900 / Math.max(vp0.width, vp0.height);
        const vp = page.getViewport({ scale });
        const c = ref.current;
        c.width = Math.round(vp.width);
        c.height = Math.round(vp.height);
        return page.render({ canvasContext: c.getContext('2d')!, viewport: vp, canvas: c } as any).promise;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);
  return <canvas ref={ref} className={`bg-paper object-cover ${className}`} />;
}

const AmbientParticles = [
  { left: '14%', top: '22%', size: 3, dur: '9s', delay: '0s' },
  { left: '28%', top: '74%', size: 2, dur: '11s', delay: '1.5s' },
  { left: '46%', top: '18%', size: 2.5, dur: '10s', delay: '0.8s' },
  { left: '68%', top: '80%', size: 3, dur: '12s', delay: '2.1s' },
  { left: '83%', top: '28%', size: 2, dur: '9.5s', delay: '1.2s' },
  { left: '74%', top: '52%', size: 2.5, dur: '10.5s', delay: '2.8s' },
  { left: '21%', top: '48%', size: 2, dur: '11.5s', delay: '0.4s' },
];

/**
 * Shared Digital Exhibition Ambient Stage behind Image, PDF, and Video Carousels.
 * Deep charcoal/black environment, moving warm light diffusion, restrained atmospheric particles,
 * and subtle parallax while keeping the foreground media 100% stable and readable.
 */
export function AmbientExhibitionStage({
  children,
  onTouchStart,
  onTouchEnd,
  className = '',
}: {
  children: ReactNode;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  className?: string;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        setOffset({ x: nx * 18, y: ny * 14 });
      }}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`relative flex h-[380px] w-full items-center justify-center overflow-hidden bg-[#0B0B0A] px-4 py-6 sm:h-[490px] md:h-[590px] md:px-10 ${className}`}
    >
      {/* Subtle Exhibition Grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12] transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${offset.x * -0.4}px, ${offset.y * -0.4}px, 0)`,
          backgroundImage:
            'linear-gradient(to right, rgba(245,242,233,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(245,242,233,0.14) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Moving Ambient Light Diffusion Orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full opacity-35 blur-[90px] transition-transform duration-700 ease-out animate-ambientDrift"
        style={{
          background: 'radial-gradient(circle, rgba(242,211,79,0.55) 0%, rgba(242,211,79,0) 70%)',
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-1/4 h-96 w-96 rounded-full opacity-25 blur-[100px] transition-transform duration-700 ease-out animate-ambientDriftSlow"
        style={{
          background: 'radial-gradient(circle, rgba(245,242,233,0.4) 0%, rgba(242,211,79,0.22) 45%, rgba(0,0,0,0) 75%)',
          transform: `translate3d(${offset.x * -0.8}px, ${offset.y * -0.8}px, 0)`,
        }}
      />

      {/* Center Soft Spotlight Behind Artwork */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[75%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[75px]"
        style={{
          background: 'radial-gradient(circle, rgba(242,211,79,0.34) 0%, rgba(245,242,233,0.08) 52%, transparent 78%)',
        }}
      />

      {/* Restrained Atmospheric Micro-Particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {AmbientParticles.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-sun/45 animate-particleFloat"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: p.dur,
              animationDelay: p.delay,
              boxShadow: '0 0 8px rgba(242,211,79,0.45)',
            }}
          />
        ))}
      </div>

      {/* Vignette Framing */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_rgba(0,0,0,0.78)]"
      />

      {/* Foreground Artwork Container — Stable, Centered, Never Stretched */}
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/**
 * Shared Horizontal Carousel Controls + Aligned Pagination Row
 * Fixes vertical separation: Previous and Next always sit in ONE centered horizontal row
 * with identical height, padding, and visual weight, and pagination aligned directly below.
 */
function CarouselControlBar({
  current,
  total,
  onPrev,
  onNext,
  onSelect,
  disablePrev = false,
  disableNext = false,
  thumbnails,
}: {
  current: number; // 0-based index
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  thumbnails?: { id: number | string; url?: string | null; label?: string }[];
}) {
  if (total <= 1) return null;

  return (
    <div className="border-t border-ivory/15 bg-[#111110] px-4 py-4 md:px-6">
      {/* Row 1: Horizontal Previous & Next Controls — Never wraps onto separate lines */}
      <div className="flex flex-nowrap items-center justify-center gap-3 sm:gap-4">
        <button
          type="button"
          aria-label="Previous slide"
          disabled={disablePrev}
          onClick={onPrev}
          className="inline-flex h-11 min-w-[124px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-ink bg-sun px-5 font-grotesk text-xs font-bold uppercase tracking-[0.16em] text-ink shadow-[3px_3px_0_#000] transition duration-200 hover:-translate-y-0.5 hover:bg-ivory active:translate-y-0 disabled:pointer-events-none disabled:opacity-35 sm:min-w-[144px] sm:px-6"
        >
          <span>←</span>
          <span>Previous</span>
        </button>

        <span className="label hidden min-w-[84px] text-center tabular-nums text-ivory/75 sm:inline-block">
          {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>

        <button
          type="button"
          aria-label="Next slide"
          disabled={disableNext}
          onClick={onNext}
          className="inline-flex h-11 min-w-[124px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-ink bg-sun px-5 font-grotesk text-xs font-bold uppercase tracking-[0.16em] text-ink shadow-[3px_3px_0_#000] transition duration-200 hover:-translate-y-0.5 hover:bg-ivory active:translate-y-0 disabled:pointer-events-none disabled:opacity-35 sm:min-w-[144px] sm:px-6"
        >
          <span>Next</span>
          <span>→</span>
        </button>
      </div>

      {/* Row 2: Pagination Indicators Aligned Directly Below Navigation */}
      <div className="mt-3.5 flex items-center justify-center gap-2 overflow-x-auto py-1">
        {thumbnails
          ? thumbnails.map((t, i) => (
              <button
                key={t.id}
                type="button"
                aria-label={`Go to item ${i + 1}`}
                onClick={() => onSelect(i)}
                className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition duration-200 sm:h-14 sm:w-14 ${
                  i === current
                    ? 'border-sun scale-105 shadow-[0_0_12px_rgba(242,211,79,0.45)]'
                    : 'border-ivory/15 opacity-55 hover:opacity-90'
                }`}
              >
                {t.url ? (
                  <img src={t.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-ink text-[10px] font-bold text-sun">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                )}
                <span className="label absolute bottom-0 right-0 bg-ink/85 px-1 text-[9px] text-ivory">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </button>
            ))
          : Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => onSelect(i)}
                className={`h-7 min-w-[28px] rounded-full px-2.5 font-grotesk text-[11px] font-bold transition duration-200 ${
                  i === current
                    ? 'bg-sun text-ink shadow-[2px_2px_0_#000]'
                    : 'bg-ivory/10 text-ivory/70 hover:bg-ivory/20'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
      </div>
    </div>
  );
}

/** Interactive multi-page PDF Carousel Viewer — with Ambient Exhibition Background & Horizontal Controls */
export function PdfInlineCarousel({ url, title }: { url: string; title?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(1);
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    pdfjsLib
      .getDocument({ url })
      .promise.then((doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        setTotal(doc.numPages);
        setPageNum(1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let renderTask: any = null;
    pdfDoc.getPage(pageNum).then((page: any) => {
      const c = canvasRef.current;
      if (!c) return;
      const vp0 = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 1400 / Math.max(vp0.width, vp0.height));
      const vp = page.getViewport({ scale });
      c.width = Math.round(vp.width);
      c.height = Math.round(vp.height);
      renderTask = page.render({ canvasContext: c.getContext('2d')!, viewport: vp, canvas: c });
    });
    return () => {
      if (renderTask?.cancel) renderTask.cancel();
    };
  }, [pdfDoc, pageNum]);

  const prev = () => setPageNum((n) => (n > 1 ? n - 1 : total));
  const next = () => setPageNum((n) => (n < total ? n + 1 : 1));

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
      className="overflow-hidden rounded-2xl border-2 border-ink bg-[#0B0B0A] text-ivory shadow-[10px_10px_0_#171717] outline-none focus-visible:ring-2 focus-visible:ring-sun"
    >
      {/* Top Exhibition Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory/15 bg-[#121210] px-5 py-3.5">
        <span className="label flex items-center gap-2 text-sun">
          <span className="inline-block h-2 w-2 rounded-full bg-sun" />
          INTERACTIVE EXHIBITION DECK {title ? `— ${title}` : ''}
        </span>
        <div className="flex items-center gap-4">
          <span className="label tabular-nums text-ivory/70">
            SLIDE {String(pageNum).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <a href={url} target="_blank" rel="noreferrer" className="label underline hover:text-sun">
            Open Full PDF ↗
          </a>
        </div>
      </div>

      {/* Ambient Exhibition Stage */}
      <AmbientExhibitionStage
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
          if (dx > 45) prev();
          else if (dx < -45) next();
          touchStartX.current = null;
        }}
      >
        {loading && (
          <p className="label absolute z-20 rounded-full border border-sun/40 bg-ink/90 px-4 py-2 text-sun">
            Rendering exhibition frame…
          </p>
        )}
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full rounded-lg object-contain shadow-[0_24px_60px_rgba(0,0,0,0.85)] transition-opacity duration-300"
        />
      </AmbientExhibitionStage>

      {/* Aligned Horizontal Prev / Next Controls + Pagination */}
      <CarouselControlBar
        current={pageNum - 1}
        total={total}
        onPrev={prev}
        onNext={next}
        onSelect={(i) => setPageNum(i + 1)}
      />
    </div>
  );
}

/** Interactive Multi-Slide Image Carousel Deck with Ambient Exhibition Background & Horizontal Controls */
export function SlideDeck({ slides, onOpen }: { slides: Asset[]; onOpen?: (a: Asset) => void }) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const cur = slides[idx] || slides[0];
  if (!cur) return null;

  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
      className="overflow-hidden rounded-2xl border-2 border-ink bg-[#0B0B0A] text-ivory shadow-[10px_10px_0_#171717] outline-none focus-visible:ring-2 focus-visible:ring-sun"
    >
      {/* Top Exhibition Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory/15 bg-[#121210] px-5 py-3.5">
        <span className="label flex items-center gap-2 text-sun">
          <span className="inline-block h-2 w-2 rounded-full bg-sun" />
          EXHIBITION CAROUSEL DECK
        </span>
        <div className="flex items-center gap-4">
          {cur.caption && <span className="label hidden text-ivory/60 md:inline">{cur.caption}</span>}
          <span className="label tabular-nums text-ivory/75">
            FRAME {String(idx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Ambient Exhibition Stage */}
      <AmbientExhibitionStage
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
          if (dx > 45) prev();
          else if (dx < -45) next();
          touchStartX.current = null;
        }}
      >
        <img
          key={cur.id}
          src={cur.url}
          alt={cur.caption || cur.title}
          onClick={() => onOpen?.(cur)}
          className="animate-fade max-h-full max-w-full cursor-zoom-in rounded-lg object-contain shadow-[0_24px_60px_rgba(0,0,0,0.85)]"
        />
      </AmbientExhibitionStage>

      {/* Aligned Horizontal Prev / Next Controls + Thumbnail Strip */}
      <CarouselControlBar
        current={idx}
        total={slides.length}
        onPrev={prev}
        onNext={next}
        onSelect={setIdx}
        thumbnails={slides.map((s) => ({ id: s.id, url: s.url, label: s.title }))}
      />
    </div>
  );
}

/**
 * Interactive Video Collection Carousel Stage —
 * Lets visitors step through portrait (9:16) or landscape (16:9) videos inside the
 * Ambient Exhibition Stage with horizontally aligned Previous/Next buttons,
 * keyboard & touch swipe support, and automatic pause when switching slides.
 */
export function VideoCarouselDeck({
  videos,
  activeIndex,
  onChangeIndex,
  onPlayVideo,
}: {
  videos: Asset[];
  activeIndex: number;
  onChangeIndex: (idx: number) => void;
  onPlayVideo?: (el: HTMLVideoElement) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const cur = videos[activeIndex] || videos[0];
  if (!cur) return null;

  const displayTitle =
    cur.title && !cur.title.startsWith('WhatsApp Video')
      ? cur.title
      : cur.caption || cur.title || `Edit ${String(activeIndex + 1).padStart(2, '0')}`;

  const switchSlide = (nextIdx: number) => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    onChangeIndex(nextIdx);
  };

  const prev = () => switchSlide((activeIndex - 1 + videos.length) % videos.length);
  const next = () => switchSlide((activeIndex + 1) % videos.length);

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
      className="overflow-hidden rounded-2xl border-2 border-ink bg-[#0B0B0A] text-ivory shadow-[10px_10px_0_#171717] outline-none focus-visible:ring-2 focus-visible:ring-sun"
    >
      {/* Top Cinema Stage Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory/15 bg-[#121210] px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="label shrink-0 rounded bg-sun px-2.5 py-1 text-ink">
            EDIT #{String(activeIndex + 1).padStart(2, '0')}
          </span>
          <p className="truncate font-grotesk text-sm font-bold text-ivory md:text-base">
            {displayTitle}
          </p>
        </div>
        <span className="label shrink-0 tabular-nums text-sun">
          VIDEO {String(activeIndex + 1).padStart(2, '0')} OF {String(videos.length).padStart(2, '0')}
        </span>
      </div>

      {/* Ambient Digital Exhibition Stage — Supports Portrait (9:16) & Landscape (16:9) without stretching */}
      <AmbientExhibitionStage
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
          if (dx > 50) prev();
          else if (dx < -50) next();
          touchStartX.current = null;
        }}
      >
        <video
          key={cur.id}
          ref={videoRef}
          src={cur.poster_url ? cur.url : `${cur.url}#t=0.5`}
          poster={cur.poster_url || undefined}
          controls
          playsInline
          preload="metadata"
          onPlay={(e) => onPlayVideo?.(e.currentTarget)}
          className="animate-fade max-h-full max-w-full rounded-xl bg-black/50 object-contain shadow-[0_24px_65px_rgba(0,0,0,0.9)] ring-1 ring-ivory/15"
        />
      </AmbientExhibitionStage>

      {/* Optional Caption Bar */}
      {cur.caption && (
        <div className="border-t border-ivory/10 bg-[#0E0E0D] px-5 py-2.5 text-center text-xs text-ivory/75 md:text-sm">
          {cur.caption}
        </div>
      )}

      {/* Horizontal Previous / Next Control Row + Thumbnail Strip */}
      <CarouselControlBar
        current={activeIndex}
        total={videos.length}
        onPrev={prev}
        onNext={next}
        onSelect={switchSlide}
        thumbnails={videos.map((v) => ({ id: v.id, url: v.poster_url, label: v.title }))}
      />
    </div>
  );
}
