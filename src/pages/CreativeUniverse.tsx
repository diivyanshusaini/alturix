import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Reveal, useFetch } from '../components/shared';
import { AmbientExhibitionStage } from '../components/pdfCarousel';
import { CONTRIB_LABEL, type Asset, type Project } from '../types';

type UniverseFilter = 'all' | 'graphic' | 'video' | 'branding' | 'experiment';

interface UniversePiece {
  uid: string;
  project: Project;
  asset: Asset;
  title: string;
  subtitle: string;
  categoryLabel: string;
  filterGroup: Exclude<UniverseFilter, 'all'>;
  shape: 'portrait' | 'square' | 'landscape' | 'wide';
  rotationDeg: number;
  depthLayer: 1 | 2 | 3; // 1 = background-mid, 2 = midground, 3 = foreground
  floatDuration: string;
  floatDelay: string;
  companionSticker: {
    src: string;
    alt: string;
    posClass: string;
    sizeClass: string;
    rot: string;
  };
}

interface CelestialObject {
  id: string;
  src: string;
  label: string;
  top: string;
  left: string;
  sizeClass: string;
  depth: number; // parallax multiplier (-40 to +45)
  rot: number;
  duration: string;
  delay: string;
  layer: 'bg' | 'mid' | 'fg';
  mobileVisible?: boolean;
}

/**
 * Curated celestial objects extracted from the 4 attached visual references:
 * - Ref 01: Space Sticker Collection (astronaut, saturn, rocket, telescope, satellite, ufo, moon, galaxy, mars, earth, comet)
 * - Ref 02: Vintage Space Collage (vintage astronaut + moon, vintage saturn, vintage comet, crescent cloud, ringed sun, nebula orb)
 * - Ref 04: Illustrated Planet Collection (gold saturn, terra ring, crimson ring, amber ring, orange, blue, ice, gold, cobalt, emerald)
 */
const CELESTIAL_FIELD: CelestialObject[] = [
  // FOREGROUND LAYER (closer to visitor, stronger parallax, placed in open sky corridors)
  {
    id: 'fg-astronaut',
    src: '/stickers/sticker-astronaut.png',
    label: 'EXPLORER // UNIT 01',
    top: '2%',
    left: '60%',
    sizeClass: 'w-20 sm:w-28 md:w-32',
    depth: 38,
    rot: -8,
    duration: '8.5s',
    delay: '0s',
    layer: 'fg',
    mobileVisible: false,
  },
  {
    id: 'fg-vintage-astro',
    src: '/stickers/vintage-astronaut-moon.png',
    label: 'LUNAR VOYAGER // MAD',
    top: '26%',
    left: '88%',
    sizeClass: 'w-20 sm:w-32 md:w-40',
    depth: 42,
    rot: 6,
    duration: '10.2s',
    delay: '1.1s',
    layer: 'fg',
    mobileVisible: false,
  },
  {
    id: 'fg-rocket',
    src: '/stickers/sticker-rocket.png',
    label: 'LAUNCH // THRUST',
    top: '56%',
    left: '91%',
    sizeClass: 'w-16 sm:w-24 md:w-28',
    depth: 36,
    rot: -14,
    duration: '7.8s',
    delay: '0.6s',
    layer: 'fg',
    mobileVisible: false,
  },
  {
    id: 'fg-telescope',
    src: '/stickers/sticker-telescope.png',
    label: 'DEEP FIELD // OPTICS',
    top: '78%',
    left: '1.5%',
    sizeClass: 'w-20 sm:w-24 md:w-28',
    depth: 34,
    rot: 5,
    duration: '9.4s',
    delay: '1.7s',
    layer: 'fg',
    mobileVisible: false,
  },

  // MIDGROUND LAYER (orbital companions & instruments)
  {
    id: 'mid-saturn-gold',
    src: '/stickers/planet-saturn-gold.png',
    label: 'SATURN // GOLDEN RING',
    top: '1.5%',
    left: '84%',
    sizeClass: 'w-20 sm:w-28 md:w-36',
    depth: 22,
    rot: -11,
    duration: '11.5s',
    delay: '0.4s',
    layer: 'mid',
    mobileVisible: true,
  },
  {
    id: 'mid-satellite',
    src: '/stickers/sticker-satellite.png',
    label: 'TELEMETRY RELAY',
    top: '34%',
    left: '1%',
    sizeClass: 'w-20 sm:w-28 md:w-32',
    depth: -24,
    rot: 12,
    duration: '9.8s',
    delay: '2.1s',
    layer: 'mid',
    mobileVisible: false,
  },
  {
    id: 'mid-ufo',
    src: '/stickers/sticker-ufo.png',
    label: 'ANOMALY // CRAFT',
    top: '44%',
    left: '91%',
    sizeClass: 'w-20 sm:w-24 md:w-28',
    depth: 26,
    rot: -7,
    duration: '8.2s',
    delay: '1.3s',
    layer: 'mid',
    mobileVisible: true,
  },
  {
    id: 'mid-vintage-crescent',
    src: '/stickers/vintage-crescent.png',
    label: 'NOCTURNE CRESCENT',
    top: '64%',
    left: '4%',
    sizeClass: 'w-20 sm:w-28 md:w-36',
    depth: -20,
    rot: -6,
    duration: '12.4s',
    delay: '0.9s',
    layer: 'mid',
    mobileVisible: true,
  },
  {
    id: 'mid-terra-ring',
    src: '/stickers/planet-terra-ring.png',
    label: 'TERRA ORBIT',
    top: '86%',
    left: '85%',
    sizeClass: 'w-24 sm:w-32 md:w-36',
    depth: 20,
    rot: 9,
    duration: '10.8s',
    delay: '1.5s',
    layer: 'mid',
    mobileVisible: true,
  },
  {
    id: 'mid-vintage-comet',
    src: '/stickers/vintage-comet.png',
    label: 'HALLEY // ARCHIVE',
    top: '3.5%',
    left: '73%',
    sizeClass: 'w-20 sm:w-28 md:w-32',
    depth: -18,
    rot: -15,
    duration: '9.1s',
    delay: '2.6s',
    layer: 'mid',
    mobileVisible: false,
  },

  // BACKGROUND LAYER (distant galaxies, vintage saturn, deep-space planets)
  {
    id: 'bg-vintage-saturn',
    src: '/stickers/vintage-saturn.png',
    label: 'CHRONICLE RING',
    top: '27%',
    left: '42%',
    sizeClass: 'w-36 sm:w-48 md:w-64 opacity-35',
    depth: -12,
    rot: -5,
    duration: '16s',
    delay: '0.2s',
    layer: 'bg',
    mobileVisible: false,
  },
  {
    id: 'bg-spiral-galaxy',
    src: '/stickers/sticker-galaxy.png',
    label: 'ANDROMEDA SECTOR',
    top: '5%',
    left: '46%',
    sizeClass: 'w-24 sm:w-32 md:w-40 opacity-55',
    depth: -14,
    rot: 14,
    duration: '14.5s',
    delay: '1.8s',
    layer: 'bg',
    mobileVisible: true,
  },
  {
    id: 'bg-crimson-ring',
    src: '/stickers/planet-crimson-ring.png',
    label: 'CRIMSON GIANT',
    top: '52%',
    left: '48%',
    sizeClass: 'w-24 sm:w-32 md:w-36 opacity-45',
    depth: -10,
    rot: -9,
    duration: '13.2s',
    delay: '0.7s',
    layer: 'bg',
    mobileVisible: false,
  },
  {
    id: 'bg-vintage-galaxy',
    src: '/stickers/vintage-galaxy.png',
    label: 'DEEP NEBULA',
    top: '74%',
    left: '44%',
    sizeClass: 'w-28 sm:w-36 md:w-44 opacity-45',
    depth: -15,
    rot: 8,
    duration: '15.4s',
    delay: '2.2s',
    layer: 'bg',
    mobileVisible: false,
  },
  {
    id: 'bg-planet-orange',
    src: '/stickers/planet-orange.png',
    label: 'SOLARIS SPHERE',
    top: '91%',
    left: '18%',
    sizeClass: 'w-16 sm:w-24 md:w-28 opacity-65',
    depth: -11,
    rot: -12,
    duration: '11.9s',
    delay: '1.4s',
    layer: 'bg',
    mobileVisible: true,
  },
  {
    id: 'bg-planet-cobalt',
    src: '/stickers/planet-cobalt.png',
    label: 'NEPTUNE DEEP',
    top: '39%',
    left: '78%',
    sizeClass: 'w-16 sm:w-20 md:w-24 opacity-60',
    depth: -9,
    rot: 18,
    duration: '12.8s',
    delay: '0.5s',
    layer: 'bg',
    mobileVisible: false,
  },
];

const COMPANION_STICKERS = [
  { src: '/stickers/sticker-saturn.png', alt: 'Ringed Saturn sticker', posClass: '-right-5 -top-5', sizeClass: 'w-14 sm:w-16', rot: 'rotate-12' },
  { src: '/stickers/planet-orange.png', alt: 'Orange planet sticker', posClass: '-left-4 -top-4', sizeClass: 'w-11 sm:w-13', rot: '-rotate-12' },
  { src: '/stickers/sticker-comet.png', alt: 'Shooting comet sticker', posClass: '-right-4 -bottom-4', sizeClass: 'w-12 sm:w-14', rot: '-rotate-6' },
  { src: '/stickers/planet-amber-ring.png', alt: 'Amber ringed planet', posClass: '-left-5 -bottom-4', sizeClass: 'w-14 sm:w-16', rot: 'rotate-6' },
  { src: '/stickers/vintage-ringed-sun.png', alt: 'Vintage ringed planet', posClass: '-right-5 -top-4', sizeClass: 'w-14 sm:w-16', rot: '-rotate-12' },
  { src: '/stickers/sticker-moon.png', alt: 'Cratered moon sticker', posClass: '-left-4 -top-4', sizeClass: 'w-11 sm:w-12', rot: 'rotate-12' },
  { src: '/stickers/planet-blue.png', alt: 'Ocean planet sticker', posClass: '-right-4 -bottom-4', sizeClass: 'w-11 sm:w-12', rot: '-rotate-12' },
  { src: '/stickers/vintage-stars.png', alt: 'Vintage stars sticker', posClass: '-left-4 -top-5', sizeClass: 'w-10 sm:w-12', rot: 'rotate-6' },
  { src: '/stickers/sticker-earth.png', alt: 'Earth sticker', posClass: '-right-4 -top-4', sizeClass: 'w-11 sm:w-13', rot: 'rotate-12' },
  { src: '/stickers/planet-gold.png', alt: 'Gold planet sticker', posClass: '-left-4 -bottom-4', sizeClass: 'w-11 sm:w-13', rot: '-rotate-6' },
  { src: '/stickers/vintage-nebula-orb.png', alt: 'Celestial nebula orb', posClass: '-right-5 -bottom-4', sizeClass: 'w-13 sm:w-15', rot: 'rotate-8' },
  { src: '/stickers/sticker-mars.png', alt: 'Mars sticker', posClass: '-left-4 -top-4', sizeClass: 'w-10 sm:w-12', rot: '-rotate-12' },
];

/**
 * Derive a deterministic spatial sticker profile for each real CMS piece
 * so the Creative Universe feels like an organic floating galaxy of creative artefacts.
 */
function buildUniversePieces(projects: Project[]): UniversePiece[] {
  const pieces: UniversePiece[] = [];
  const shapes: UniversePiece['shape'][] = [
    'portrait',
    'landscape',
    'square',
    'wide',
    'portrait',
    'landscape',
    'square',
  ];
  const rotations = [-3.2, 2.4, -1.8, 3.1, -2.5, 1.9, -2.8, 2.2, -1.5, 2.9];
  const depths: (1 | 2 | 3)[] = [3, 2, 3, 1, 2, 3, 2, 1, 3];

  projects.forEach((p, pIdx) => {
    const isBranding =
      (p.category || '').toLowerCase().includes('brand') ||
      (p.category || '').toLowerCase().includes('identity') ||
      (p.category || '').toLowerCase().includes('system') ||
      Boolean(p.case_study);

    const filterGroup: Exclude<UniverseFilter, 'all'> =
      p.section === 'video'
        ? 'video'
        : p.section === 'experiment'
        ? 'experiment'
        : isBranding
        ? 'branding'
        : 'graphic';

    const categoryLabel =
      filterGroup === 'video'
        ? 'VIDEO EDITING'
        : filterGroup === 'branding'
        ? 'BRANDING & CASE'
        : filterGroup === 'experiment'
        ? 'EXPERIMENTS'
        : 'GRAPHIC DESIGN';

    const primaryAsset = p.cover || p.assets[0];
    if (primaryAsset) {
      const idx = pieces.length;
      pieces.push({
        uid: `proj-${p.id}-cover`,
        project: p,
        asset: primaryAsset,
        title: p.title,
        subtitle: p.summary || p.category || categoryLabel,
        categoryLabel,
        filterGroup,
        shape:
          p.section === 'video'
            ? pIdx % 2 === 0
              ? 'wide'
              : 'landscape'
            : shapes[pIdx % shapes.length],
        rotationDeg: rotations[idx % rotations.length],
        depthLayer: depths[idx % depths.length],
        floatDuration: `${6.8 + (idx % 5) * 1.1}s`,
        floatDelay: `${(idx % 6) * 0.45}s`,
        companionSticker: COMPANION_STICKERS[idx % COMPANION_STICKERS.length],
      });
    }

    // Also surface selected individual graphic frames or video cuts from multi-asset projects
    const extraAssets = p.assets
      .filter((a) => a.id !== primaryAsset?.id && (a.kind === 'image' || a.kind === 'video'))
      .slice(0, p.section === 'graphic' ? 2 : 1);

    extraAssets.forEach((asset, aIdx) => {
      const idx = pieces.length;
      pieces.push({
        uid: `proj-${p.id}-asset-${asset.id}`,
        project: p,
        asset,
        title: asset.caption || `${p.title} — Frame ${String(aIdx + 2).padStart(2, '0')}`,
        subtitle: p.title,
        categoryLabel,
        filterGroup,
        shape: asset.kind === 'video' ? 'portrait' : shapes[(pIdx + aIdx + 2) % shapes.length],
        rotationDeg: rotations[idx % rotations.length],
        depthLayer: depths[idx % depths.length],
        floatDuration: `${7.2 + (idx % 5) * 0.95}s`,
        floatDelay: `${((idx + 2) % 6) * 0.4}s`,
        companionSticker: COMPANION_STICKERS[idx % COMPANION_STICKERS.length],
      });
    });
  });

  return pieces;
}

/**
 * Interactive Artwork Thumbnail inside a Die-Cut Sticker Frame.
 * Preserves 100% original aspect ratio without stretching.
 */
function StickerArtworkMedia({ asset, alt }: { asset: Asset; alt: string }) {
  if (asset.kind === 'image') {
    return (
      <img
        src={asset.url}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="relative z-[2] h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    );
  }
  if (asset.kind === 'video') {
    return asset.poster_url ? (
      <img
        src={asset.poster_url}
        alt={alt}
        loading="lazy"
        className="relative z-[2] h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    ) : (
      <video
        src={asset.url + '#t=0.5'}
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        className="relative z-[2] h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    );
  }
  if (asset.poster_url) {
    return (
      <img
        src={asset.poster_url}
        alt={alt}
        loading="lazy"
        className="relative z-[2] h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    );
  }
  return <div className="h-full w-full bg-ink/80" />;
}

/**
 * THE CREATIVE UNIVERSE — "A SPACE FOR EVERY IDEA."
 * Can be rendered as a full standalone route (`/universe`) or embedded on the Homepage.
 */
export default function CreativeUniverse({ embedded = false }: { embedded?: boolean }) {
  const { data: projects, loading } = useFetch<Project[]>('/api/public/projects');
  const [filter, setFilter] = useState<UniverseFilter>('all');
  const [viewMode, setViewMode] = useState<'stickers' | 'grid'>('stickers');
  const [activePiece, setActivePiece] = useState<UniversePiece | null>(null);
  const [activeAssetIdx, setActiveAssetIdx] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Smooth mouse & touch parallax coordinates (-0.5 .. +0.5)
  const stageRef = useRef<HTMLElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  const allPieces = useMemo(() => buildUniversePieces(projects || []), [projects]);

  const shownPieces = useMemo(() => {
    const filtered =
      filter === 'all' ? allPieces : allPieces.filter((p) => p.filterGroup === filter);
    return embedded ? filtered.slice(0, 9) : filtered;
  }, [allPieces, filter, embedded]);

  // Open piece modal and sync asset index inside its parent project
  const openPieceModal = (piece: UniversePiece) => {
    const idx = piece.project.assets.findIndex((a) => a.id === piece.asset.id);
    setActiveAssetIdx(idx >= 0 ? idx : 0);
    setActivePiece(piece);
  };

  // Keyboard navigation when exhibition modal is open
  useEffect(() => {
    if (!activePiece) return;
    const assets =
      activePiece.project.assets.length > 0
        ? activePiece.project.assets
        : activePiece.project.cover
        ? [activePiece.project.cover]
        : [activePiece.asset];

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePiece(null);
      if (e.key === 'ArrowRight') setActiveAssetIdx((i) => (i + 1) % assets.length);
      if (e.key === 'ArrowLeft') setActiveAssetIdx((i) => (i - 1 + assets.length) % assets.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePiece]);

  const handleStageMove = (clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = Math.max(-0.5, Math.min(0.5, (clientX - r.left) / Math.max(1, r.width) - 0.5));
    const ny = Math.max(-0.5, Math.min(0.5, (clientY - r.top) / Math.max(1, r.height) - 0.5));
    setPointer({ x: nx, y: ny });
  };

  return (
    <section
      ref={stageRef}
      id="creative-universe"
      onMouseMove={(e) => handleStageMove(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        if (e.touches[0]) handleStageMove(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onMouseLeave={() => setPointer({ x: 0, y: 0 })}
      className={`relative overflow-hidden bg-[#0B0B0A] text-ivory ${
        embedded ? 'border-y-2 border-ink py-24 md:py-36' : 'min-h-screen py-16 md:py-28'
      }`}
    >
      {/* =====================================================================
          LAYER 0: DEEP COSMIC ATMOSPHERE, ORBITAL RINGS & SHOOTING STARS
         ===================================================================== */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Warm editorial nebula diffusion (never generic blue-purple template gradients) */}
        <div
          className="absolute -left-32 top-12 h-[540px] w-[540px] rounded-full opacity-25 blur-[130px] animate-ambientDrift"
          style={{
            background:
              'radial-gradient(circle, rgba(242,211,79,0.42) 0%, rgba(242,211,79,0.08) 55%, transparent 75%)',
          }}
        />
        <div
          className="absolute -right-32 bottom-16 h-[600px] w-[600px] rounded-full opacity-20 blur-[140px] animate-ambientDriftSlow"
          style={{
            background:
              'radial-gradient(circle, rgba(245,242,233,0.3) 0%, rgba(242,211,79,0.12) 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-[150px]"
          style={{
            background: 'radial-gradient(circle, rgba(242,211,79,0.28) 0%, transparent 70%)',
          }}
        />

        {/* Delicate Celestial Orbital Trajectory Rings */}
        <svg
          viewBox="0 0 1440 1200"
          fill="none"
          className="absolute inset-0 h-full w-full opacity-[0.14]"
          preserveAspectRatio="xMidYMid slice"
        >
          <ellipse
            cx="720"
            cy="600"
            rx="660"
            ry="340"
            stroke="#F5F2E9"
            strokeWidth="1"
            strokeDasharray="6 10"
            transform="rotate(-11 720 600)"
          />
          <ellipse
            cx="720"
            cy="600"
            rx="480"
            ry="230"
            stroke="#F2D34F"
            strokeWidth="1"
            strokeDasharray="3 8"
            transform="rotate(9 720 600)"
          />
          <circle cx="720" cy="600" r="820" stroke="#F5F2E9" strokeWidth="0.75" strokeOpacity="0.4" />
        </svg>

        {/* Subtle Starfield & Micro-Crosshairs */}
        <div
          className="absolute inset-0 opacity-[0.11]"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(245,242,233,0.85) 1px, transparent 1.5px)',
            backgroundSize: '56px 56px',
            transform: `translate3d(${pointer.x * -14}px, ${pointer.y * -14}px, 0)`,
            transition: 'transform 0.35s ease-out',
          }}
        />

        {/* Occasional Subtle Shooting Stars */}
        <div className="shooting-star shooting-star-1" />
        <div className="shooting-star shooting-star-2" />
      </div>

      {/* =====================================================================
          LAYER 1: MULTI-DEPTH CELESTIAL STICKERS & VINTAGE SPACE COLLAGE
          (Extracted from References 01, 02 & 04 with independent float & parallax)
         ===================================================================== */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {CELESTIAL_FIELD.map((obj) => {
          const tx = pointer.x * obj.depth;
          const ty = pointer.y * obj.depth;
          const zClass =
            obj.layer === 'fg' ? 'z-10' : obj.layer === 'mid' ? 'z-[5]' : 'z-[1]';
          const visibilityClass = obj.mobileVisible ? 'block' : 'hidden md:block';

          return (
            <div
              key={obj.id}
              style={{
                top: obj.top,
                left: obj.left,
                transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${obj.rot}deg)`,
                transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className={`absolute select-none ${zClass} ${visibilityClass}`}
            >
              <div
                style={{
                  animationDuration: obj.duration,
                  animationDelay: obj.delay,
                }}
                className="animate-subtleFloat"
              >
                <img
                  src={obj.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={`${obj.sizeClass} h-auto object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.65)]`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          LAYER 2: FOREGROUND EDITORIAL HEADER & INTERACTIVE CONTROLS
         ===================================================================== */}
      <div className="relative z-30 mx-auto max-w-[1500px] px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-ivory/15 pb-10">
          <div className="min-w-0 max-w-3xl">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-sun/40 bg-sun/10 px-3 py-1.5 backdrop-blur-sm">
              <img
                src="/stickers/sticker-star-gold.png"
                alt=""
                className="h-4 w-4 shrink-0 object-contain"
              />
              <span className="label truncate text-[10px] text-sun sm:text-xs">
                ALTURIX COSMOS // INTERACTIVE EXHIBITION
              </span>
            </div>

            <h1 className="display h-xl mt-4 leading-[0.9] text-ivory">
              THE CREATIVE{' '}
              <span className="display-serif font-normal text-sun">UNIVERSE.</span>
            </h1>

            <p className="mt-4 font-grotesk text-xl font-bold tracking-wide text-sun sm:text-2xl">
              A SPACE FOR EVERY IDEA.
            </p>

            <p className="body-lg mt-3 max-w-2xl text-ivory/75">
              Every uploaded poster, carousel edition, visual experiment, and video cut floats inside
              one living creative galaxy. Move your cursor or touch to shift depth, hover any
              creative sticker to inspect, or click to launch the full project.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            {/* View Mode Switcher: Floating Sticker Field vs Structured Grid */}
            <div
              role="group"
              aria-label="Universe layout mode"
              className="inline-flex max-w-full flex-wrap rounded-full border border-ivory/20 bg-ivory/[0.05] p-1 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => setViewMode('stickers')}
                className={`label rounded-full px-2.5 py-1.5 !text-[10px] !tracking-[0.1em] transition sm:px-3.5 sm:!text-xs sm:!tracking-[0.16em] ${
                  viewMode === 'stickers'
                    ? 'bg-sun text-ink shadow-[2px_2px_0_#000]'
                    : 'text-ivory/70 hover:text-ivory'
                }`}
              >
                ✦ Floating Stickers
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`label rounded-full px-2.5 py-1.5 !text-[10px] !tracking-[0.1em] transition sm:px-3.5 sm:!text-xs sm:!tracking-[0.16em] ${
                  viewMode === 'grid'
                    ? 'bg-sun text-ink shadow-[2px_2px_0_#000]'
                    : 'text-ivory/70 hover:text-ivory'
                }`}
              >
                ▤ Structured Grid
              </button>
            </div>

            {embedded ? (
              <Link
                to="/universe"
                className="btn border-sun bg-sun text-ink shadow-[4px_4px_0_#F5F2E9] hover:bg-ivory hover:text-ink"
              >
                Enter Full Universe ({allPieces.length} Artefacts) ✦
              </Link>
            ) : (
              <Link
                to="/"
                className="btn border-ivory/30 text-ivory hover:border-sun hover:bg-sun hover:text-ink"
              >
                ← Back to Studio Home
              </Link>
            )}
          </div>
        </div>

        {/* Category Filter Pills & Live Telemetry */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter creative universe">
            {(
              [
                ['all', 'ALL'],
                ['graphic', 'GRAPHIC DESIGN'],
                ['video', 'VIDEO EDITING'],
                ['branding', 'BRANDING'],
                ['experiment', 'EXPERIMENTS'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={`label rounded-full border px-4 py-2 transition-all duration-300 ${
                  filter === key
                    ? 'border-sun bg-sun text-ink shadow-[3px_3px_0_#F5F2E9]'
                    : 'border-ivory/20 bg-ivory/[0.04] text-ivory/75 hover:border-sun/60 hover:text-ivory'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="label text-ivory/55">
            SHOWING {shownPieces.length} OF {allPieces.length} REAL PORTFOLIO STICKERS
          </span>
        </div>

        {/* =====================================================================
            LAYER 3: FLOATING PORTFOLIO STICKER GALAXY (ACTUAL CMS DESIGNS)
           ===================================================================== */}
        {loading ? (
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="aspect-[4/5] animate-pulse rounded-2xl bg-ivory/5" />
            ))}
          </div>
        ) : (
          <div className="relative mt-16 grid grid-cols-1 items-center gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-y-16">
            {shownPieces.map((piece, i) => {
              const colSpan =
                viewMode === 'grid'
                  ? 'lg:col-span-4'
                  : piece.shape === 'wide'
                  ? 'lg:col-span-6'
                  : piece.shape === 'landscape'
                  ? 'lg:col-span-5'
                  : 'lg:col-span-4';

              // Spatial vertical offsets so stickers float organically across the cosmos
              const spatialOffset =
                viewMode === 'grid'
                  ? ''
                  : i % 5 === 1
                  ? 'lg:mt-14'
                  : i % 5 === 2
                  ? 'lg:-mt-6'
                  : i % 5 === 3
                  ? 'lg:mt-20'
                  : i % 5 === 4
                  ? 'lg:mt-8'
                  : '';

              const aspectClass =
                piece.shape === 'portrait'
                  ? 'aspect-[4/5]'
                  : piece.shape === 'square'
                  ? 'aspect-square'
                  : 'aspect-video';

              const videoCount = piece.project.assets.filter((a) => a.kind === 'video').length;
              const isVideo =
                piece.asset.kind === 'video' || piece.project.section === 'video' || videoCount > 0;
              const isHovered = hoveredId === piece.uid;

              // Parallax depth multiplier per sticker layer
              const depthFactor = piece.depthLayer === 3 ? 22 : piece.depthLayer === 2 ? 13 : 7;
              const px = viewMode === 'stickers' ? pointer.x * depthFactor : 0;
              const py = viewMode === 'stickers' ? pointer.y * depthFactor : 0;
              const rot = viewMode === 'stickers' ? (isHovered ? 0 : piece.rotationDeg) : 0;

              return (
                <Reveal
                  key={piece.uid}
                  delay={(i % 4) * 55}
                  className={`relative ${colSpan} ${spatialOffset} ${
                    isHovered ? 'z-30' : piece.depthLayer === 3 ? 'z-20' : 'z-10'
                  }`}
                >
                  <div
                    style={{
                      transform: `translate3d(${px}px, ${py}px, 0) rotate(${rot}deg) scale(${
                        isHovered ? 1.045 : 1
                      })`,
                      transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                    onMouseEnter={() => setHoveredId(piece.uid)}
                    onMouseLeave={() => setHoveredId((prev) => (prev === piece.uid ? null : prev))}
                  >
                    {/* Independent slow orbital float wrapper */}
                    <div
                      style={{
                        animationDuration: piece.floatDuration,
                        animationDelay: piece.floatDelay,
                      }}
                      className="group relative animate-subtleFloat"
                    >
                      {/* Companion Space Sticker Badge Overlapping Corner (from attached references) */}
                      {viewMode === 'stickers' && (
                        <img
                          src={piece.companionSticker.src}
                          alt={piece.companionSticker.alt}
                          loading="lazy"
                          aria-hidden
                          className={`pointer-events-none absolute z-30 h-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] transition-transform duration-500 group-hover:scale-125 ${piece.companionSticker.posClass} ${piece.companionSticker.sizeClass} ${piece.companionSticker.rot}`}
                        />
                      )}

                      {/* ===============================================================
                          DIE-CUT CREATIVE STICKER SHELL
                          Warm-cream (#F5F2E9) sticker border + restrained depth shadow
                         =============================================================== */}
                      <div
                        className={`relative rounded-[22px] border-[3px] border-[#F5F2E9] bg-[#F5F2E9] p-2.5 text-ink transition-shadow duration-500 ${
                          isHovered
                            ? 'shadow-[0_28px_70px_rgba(242,211,79,0.34),0_0_0_3px_#F2D34F]'
                            : 'shadow-[0_22px_50px_rgba(0,0,0,0.78),0_4px_12px_rgba(0,0,0,0.5)]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => openPieceModal(piece)}
                          data-cursor-label="INSPECT"
                          className="block w-full text-left focus-visible:outline-none"
                        >
                          {/* Artwork Stage — Preserves Original Aspect Ratio */}
                          <div
                            className={`relative w-full overflow-hidden rounded-[14px] bg-[#0E0E0D] ${aspectClass}`}
                          >
                            {/* Subtle ambient colour wash behind uncropped portrait/landscape art */}
                            {(piece.asset.poster_url || piece.asset.kind === 'image') && (
                              <img
                                src={piece.asset.poster_url || piece.asset.url}
                                alt=""
                                aria-hidden
                                className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-xl"
                              />
                            )}

                            <StickerArtworkMedia asset={piece.asset} alt={piece.title} />

                            {/* Top Sticker Telemetry Badges */}
                            <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
                              <span className="label rounded-full border border-ink bg-sun px-2.5 py-1 text-[10px] font-bold text-ink shadow-[2px_2px_0_#171717]">
                                {isVideo
                                  ? videoCount > 1
                                    ? `▶ ${videoCount} VIDEOS`
                                    : '▶ VIDEO EDIT'
                                  : piece.project.assets.length > 1
                                  ? `▤ ${piece.project.assets.filter((a) => a.kind === 'image').length} FRAMES`
                                  : '✦ DESIGN STICKER'}
                              </span>
                              <span className="label rounded-full border border-ivory/25 bg-ink/85 px-2.5 py-1 text-[10px] text-ivory backdrop-blur-sm">
                                № {String(i + 1).padStart(2, '0')}
                              </span>
                            </div>

                            {/* Hover Reveal Overlay */}
                            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <p className="label text-sun">{piece.categoryLabel}</p>
                              <p className="mt-1 font-grotesk text-lg font-bold leading-snug text-ivory">
                                {piece.title}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="label inline-flex items-center gap-1 rounded-full bg-sun px-3 py-1 text-[10px] font-bold text-ink">
                                  Inspect Sticker ⤢
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Die-Cut Sticker Footer Strip (Warm Cream Label Tab) */}
                        <div className="mt-2.5 flex items-center justify-between gap-3 px-1.5 pb-0.5">
                          <div className="min-w-0 flex-1">
                            <p className="label truncate text-[10px] text-ink/55">
                              {piece.categoryLabel} · {CONTRIB_LABEL[piece.project.contribution]}
                            </p>
                            <h3 className="truncate font-grotesk text-base font-bold text-ink sm:text-lg">
                              {piece.title}
                            </h3>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openPieceModal(piece)}
                              aria-label={`Preview ${piece.title}`}
                              className="grid h-8 w-8 place-items-center rounded-full border border-ink/25 bg-paper text-xs font-bold text-ink transition hover:border-ink hover:bg-sun"
                              title="Quick Lightbox Preview"
                            >
                              ⤢
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/work/${piece.project.slug}`)}
                              aria-label={`Open ${piece.project.title} project page`}
                              className="grid h-8 w-8 place-items-center rounded-full border border-ink bg-sun text-xs font-bold text-ink shadow-[2px_2px_0_#171717] transition hover:bg-ink hover:text-sun"
                              title="Open Full Project Page"
                            >
                              ↗
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          INTERACTIVE EXHIBITION MODAL — INSPECT ORIGINAL ARTWORK & PROJECT MEDIA
         ===================================================================== */}
      {activePiece && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePiece.title}
          onClick={() => setActivePiece(null)}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-3 backdrop-blur-md sm:p-6 md:p-10"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border-2 border-sun/50 bg-[#111110] text-ivory shadow-[0_30px_90px_rgba(0,0,0,0.9)]"
          >
            {/* Modal Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory/15 px-5 py-4 md:px-7">
              <div>
                <p className="label text-sun">
                  {activePiece.categoryLabel} // {CONTRIB_LABEL[activePiece.project.contribution]}
                </p>
                <h2 className="font-grotesk text-xl font-bold text-ivory md:text-2xl">
                  {activePiece.project.title}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/work/${activePiece.project.slug}`}
                  onClick={() => setActivePiece(null)}
                  className="btn border-sun bg-sun !py-2 text-xs font-bold text-ink"
                >
                  Open Full Project Page ↗
                </Link>
                <button
                  type="button"
                  onClick={() => setActivePiece(null)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-ivory/25 bg-ivory/10 text-sm font-bold text-ivory transition hover:border-sun hover:bg-sun hover:text-ink"
                  aria-label="Close exhibition viewer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Media Stage */}
            {(() => {
              const projectAssets =
                activePiece.project.assets.length > 0
                  ? activePiece.project.assets
                  : activePiece.project.cover
                  ? [activePiece.project.cover]
                  : [activePiece.asset];
              const safeIdx = Math.min(activeAssetIdx, projectAssets.length - 1);
              const currentAsset = projectAssets[safeIdx] || activePiece.asset;

              return (
                <div className="overflow-y-auto p-4 md:p-6">
                  <AmbientExhibitionStage className="h-[46vh] sm:h-[54vh] md:h-[60vh]">
                    <div className="flex h-full w-full flex-col items-center justify-center p-4">
                      <span className="label mb-3 rounded-full border border-sun/40 bg-ink/80 px-3 py-1 text-[10px] text-sun">
                        {activePiece.categoryLabel} // FRAME {String(safeIdx + 1).padStart(2, '0')} OF{' '}
                        {String(projectAssets.length).padStart(2, '0')}
                      </span>
                      {currentAsset.kind === 'video' ? (
                        <video
                          key={currentAsset.url}
                          src={currentAsset.url}
                          poster={currentAsset.poster_url || undefined}
                          controls
                          autoPlay
                          playsInline
                          className="max-h-[38vh] w-auto max-w-full rounded-lg object-contain shadow-[0_20px_60px_rgba(0,0,0,0.85)] sm:max-h-[45vh] md:max-h-[50vh]"
                        />
                      ) : (
                        <img
                          key={currentAsset.url}
                          src={currentAsset.poster_url || currentAsset.url}
                          alt={currentAsset.caption || activePiece.project.title}
                          className="max-h-[38vh] w-auto max-w-full rounded-lg object-contain shadow-[0_20px_60px_rgba(0,0,0,0.85)] sm:max-h-[45vh] md:max-h-[50vh]"
                        />
                      )}
                    </div>
                  </AmbientExhibitionStage>

                  {/* Horizontal Navigation Row inside Modal when project has multiple assets */}
                  {projectAssets.length > 1 && (
                    <div className="mt-5 flex flex-col items-center gap-4">
                      <div className="flex flex-nowrap items-center justify-center gap-3 sm:gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveAssetIdx(
                              (safeIdx - 1 + projectAssets.length) % projectAssets.length
                            )
                          }
                          className="label inline-flex h-11 min-w-[124px] items-center justify-center gap-2 rounded-full border-2 border-ivory/30 bg-ivory/10 px-5 text-xs font-bold text-ivory transition hover:border-sun hover:bg-sun hover:text-ink"
                        >
                          ← Previous
                        </button>
                        <div className="label flex h-11 min-w-[88px] items-center justify-center rounded-full border border-ivory/20 bg-ivory/5 px-4 text-xs font-bold text-sun">
                          {String(safeIdx + 1).padStart(2, '0')} /{' '}
                          {String(projectAssets.length).padStart(2, '0')}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveAssetIdx((safeIdx + 1) % projectAssets.length)}
                          className="label inline-flex h-11 min-w-[124px] items-center justify-center gap-2 rounded-full border-2 border-sun bg-sun px-5 text-xs font-bold text-ink transition hover:bg-ivory"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}
