import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HoverIndex, WaveSection, WeightField } from '../components/motion';
import { Empty, FloatingPortrait3D, Mark, ProjectCard, Split, useFetch } from '../components/shared';
import CreativeUniverse from './CreativeUniverse';
import type { Project, Settings } from '../types';

const DEFAULT_WORDS = ['Make', 'Adapt', 'Discover', 'Video Editing', 'Visual Identity', 'Typography', 'Motion Design', 'Editorial'];

const DEFAULT_ECOSYSTEM = [
  { code: 'Pr', name: 'Premiere Pro', sub: 'Narrative & Rhythm Cutting' },
  { code: 'Ae', name: 'After Effects', sub: 'Motion & Visual VFX' },
  { code: 'Dv', name: 'DaVinci Resolve', sub: 'Color Grading & Look Dev' },
  { code: 'Ps', name: 'Photoshop', sub: 'Visual Manipulation & Art' },
  { code: 'Ai', name: 'Illustrator', sub: 'Vector & Type Systems' },
  { code: 'Fg', name: 'Figma', sub: 'Editorial & Carousel Design' },
];

const DEFAULT_PROCESS_STEPS = [
  {
    num: '01',
    title: 'THE IDEA',
    desc: 'Uncovering the core hook, audience tension, and emotional direction before a single frame is cut.',
  },
  {
    num: '02',
    title: 'THE BLUEPRINT',
    desc: 'Scripting the pacing architecture, visual references, and typography hierarchy across every slide or scene.',
  },
  {
    num: '03',
    title: 'THE CRAFT',
    desc: 'Precision video editing, expressive layout design, and kinetic motion built to hold attention.',
  },
  {
    num: '04',
    title: 'THE POLISH',
    desc: 'Unifying color grade, sound design, texture, and micro-transitions so every beat feels intentional.',
  },
  {
    num: '05',
    title: 'THE FINAL FRAME',
    desc: 'Final review and multi-format delivery ready to publish and perform.',
  },
];

const DEFAULT_JOURNEY = [
  {
    period: '2025 — PRESENT',
    role: 'Founder & Creative Director',
    org: 'ALTURIX // A Creative Universe',
    desc: 'Building high-retention video edits, visual essays, startup carousels, and experimental brand storytelling under the MAD philosophy.',
  },
  {
    period: '2024 — 2025',
    role: 'Visual Designer & Editorial Storyteller',
    org: 'MAD Edition Series',
    desc: 'Designed multi-slide business & technology breakdowns (Zerodha, Startup Lexicon, AI Systems) combining bold typography with clean data storytelling.',
  },
  {
    period: '2023 — 2024',
    role: 'Video Editor & Motion Explorer',
    org: 'Independent Studio & Creator Collaborations',
    desc: 'Crafted short-form narrative cuts, kinetic typography reels, and visual experiments focused on pacing and audience retention.',
  },
];

function Badge() {
  return (
    <div className="relative h-28 w-28 md:h-36 md:w-36" aria-hidden>
      <svg viewBox="0 0 200 200" className="absolute inset-0 animate-spin360">
        <defs>
          <path id="c" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text className="fill-ink font-grotesk text-[15px] font-semibold uppercase" style={{ letterSpacing: '0.32em' }}>
          <textPath href="#c">Make · Adapt · Discover · Make · Adapt · Discover ·</textPath>
        </text>
      </svg>
      <div className="absolute inset-[22%] grid place-items-center rounded-full border border-ink bg-sun font-grotesk text-xl font-bold tracking-tighter shadow-[3px_3px_0_#171717] md:text-3xl">
        MAD
      </div>
    </div>
  );
}

/** "FROM RAW. TO REAL." Interactive Multi-Project Before/After Split-Frame Comparison */
function RawToRealSection({ s, projects }: { s: Settings | null; projects: Project[] }) {
  const [split, setSplit] = useState(52);
  const [projIdx, setProjIdx] = useState(0);

  const deck = projects.length > 0 ? projects : [];
  const activeProject = deck[projIdx % Math.max(1, deck.length)];

  const imageAssets = (activeProject?.assets || []).filter((a) => a.kind === 'image');
  const videoPoster = (activeProject?.assets || []).find((a) => a.kind === 'video' && a.poster_url)?.poster_url;

  const afterUrl =
    (projIdx === 0 && s?.raw_after_image) ||
    activeProject?.cover?.url ||
    imageAssets[0]?.url ||
    videoPoster ||
    '/divyanshu.jpg';

  const beforeUrl =
    (projIdx === 0 && s?.raw_before_image) ||
    (imageAssets.length > 1 ? imageAssets[1].url : afterUrl);

  const hasDistinctBeforeImage =
    Boolean(projIdx === 0 && s?.raw_before_image) || imageAssets.length > 1;

  const selectProject = (nextIdx: number) => {
    if (!deck.length) return;
    setProjIdx((nextIdx + deck.length) % deck.length);
  };

  return (
    <section className="relative z-10 border-y border-ink bg-paper/70">
      <div className="mx-auto max-w-[1500px] px-5 py-20 md:px-10 md:py-32">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Narrative & Interactive Controls Column */}
          <div className="lg:col-span-5">
            <p className="label text-ink/60">02 // A LOOK UNDER THE SURFACE</p>
            <h2 className="display mt-3 text-4xl leading-[0.92] sm:text-6xl md:text-7xl">
              {s?.raw_heading_1 || 'FROM IDEA.'}
              <br />
              <span className="mt-1 inline-block bg-sun px-3 py-1 text-ink shadow-[5px_5px_0_#171717]">
                {s?.raw_heading_2 || 'TO IMPACT.'}
              </span>
            </h2>
            <p className="body-lg mt-6 text-ink/80">
              {s?.raw_description ||
                'One concept. Layered execution. Switch across projects below and drag the split-frame to inspect how rough wireframes, ungraded frames, and raw scripts transform into a finished ALTURIX edition.'}
            </p>

            {/* Interactive Project Switcher so visitor can check multiple projects */}
            {deck.length > 1 && (
              <div className="mt-7 rounded-2xl border-2 border-ink bg-ivory p-4 shadow-[4px_4px_0_#171717]">
                <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-2.5">
                  <span className="label text-ink/60">
                    SELECT PROJECT ({String((projIdx % deck.length) + 1).padStart(2, '0')} /{' '}
                    {String(deck.length).padStart(2, '0')})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => selectProject(projIdx - 1)}
                      className="label rounded-full border border-ink bg-paper px-2.5 py-1 text-[10px] text-ink transition hover:bg-sun"
                      aria-label="Previous project"
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => selectProject(projIdx + 1)}
                      className="label rounded-full border border-ink bg-sun px-2.5 py-1 text-[10px] text-ink transition hover:bg-ink hover:text-sun"
                      aria-label="Next project"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {deck.slice(0, 7).map((p, idx) => {
                    const isSelected = idx === projIdx % deck.length;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectProject(idx)}
                        className={`label rounded-full border px-3 py-1 text-[10px] transition ${
                          isSelected
                            ? 'border-ink bg-ink text-sun shadow-[2px_2px_0_#F2D34F]'
                            : 'border-ink/25 bg-paper/70 text-ink/75 hover:border-ink hover:bg-sun/40 hover:text-ink'
                        }`}
                      >
                        {p.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Slider Controls */}
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="label shrink-0 rounded-full border border-ink bg-ivory px-3.5 py-1.5">
                  SPLIT: {split}%
                </span>
                <button
                  type="button"
                  onClick={() => setSplit((v) => (v > 50 ? 18 : 84))}
                  className="btn text-xs"
                >
                  Toggle Raw / Real ⇄
                </button>
                {activeProject && (
                  <Link
                    to={`/work/${activeProject.slug}`}
                    className="label inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-ink/30 bg-paper px-3.5 py-2 text-[10px] text-ink transition hover:border-ink hover:bg-sun"
                  >
                    Open Project ↗
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="label shrink-0 text-[10px] text-ink/55">RAW</span>
                <input
                  type="range"
                  min={8}
                  max={92}
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  aria-label="Compare Raw Blueprint and Final Edition"
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-lg border border-ink bg-ivory accent-ink"
                />
                <span className="label shrink-0 text-[10px] text-ink/55">FINAL</span>
              </div>
            </div>
          </div>

          {/* Right Interactive Split-Screen Stage */}
          <div className="lg:col-span-7">
            <div
              data-cursor-label="DRAG"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setSplit(Math.max(8, Math.min(92, Math.round(((e.clientX - r.left) / r.width) * 100))));
              }}
              onTouchMove={(e) => {
                if (!e.touches[0]) return;
                const r = e.currentTarget.getBoundingClientRect();
                setSplit(Math.max(8, Math.min(92, Math.round(((e.touches[0].clientX - r.left) / r.width) * 100))));
              }}
              className="relative aspect-[16/10] w-full cursor-ew-resize overflow-hidden rounded-2xl border-2 border-ink bg-ink shadow-[6px_6px_0_#171717] md:shadow-[10px_10px_0_#171717] select-none"
            >
              {/* AFTER (FINAL REAL LAYER) */}
              <div className="absolute inset-0">
                <img
                  src={afterUrl}
                  alt={activeProject?.title || 'Final Graded Edition'}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
              </div>

              {/* BEFORE (RAW BLUEPRINT / WIREFRAME LAYER — 1:1 locked via clipPath so nothing stretches or clips badges) */}
              <div
                className="absolute inset-0 bg-[#141413]"
                style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
              >
                <img
                  src={beforeUrl}
                  alt="Raw Wireframe Blueprint"
                  className={`h-full w-full object-cover ${
                    hasDistinctBeforeImage ? 'contrast-110 brightness-90' : 'grayscale contrast-125 brightness-75'
                  }`}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-45"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(242,211,79,0.26) 1px, transparent 1px), linear-gradient(to bottom, rgba(242,211,79,0.26) 1px, transparent 1px)',
                    backgroundSize: '36px 36px',
                  }}
                />
              </div>

              {/* Top-left & Top-right floating HUD pills (outside clipPath so text never gets sliced in half) */}
              <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2 sm:inset-x-4 sm:top-4">
                <span
                  className={`label whitespace-nowrap rounded-full border border-sun/60 bg-ink/90 px-3 py-1 text-[10px] text-sun backdrop-blur-sm transition-opacity duration-200 ${
                    split < 18 ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  01 // RAW BLUEPRINT
                </span>
                {activeProject && (
                  <span className="label truncate rounded-full border border-ivory/25 bg-ink/85 px-3 py-1 text-[10px] text-ivory backdrop-blur-sm">
                    {activeProject.title}
                  </span>
                )}
              </div>

              {/* Bottom status pills */}
              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-2 sm:inset-x-4 sm:bottom-4">
                <span className="label hidden whitespace-nowrap rounded-full border border-ivory/30 bg-ink/85 px-3 py-1 text-[10px] text-ivory/80 sm:inline-block">
                  {activeProject?.category || 'WIREFRAME & ROUGH CUT'}
                </span>
                <span
                  className={`label ml-auto whitespace-nowrap rounded-full border border-ink bg-sun px-3 py-1 text-[10px] text-ink shadow-[2px_2px_0_#171717] transition-opacity duration-200 ${
                    split > 86 ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  02 // FINAL REAL EDITION
                </span>
              </div>

              {/* Split Divider Handle */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 z-20 w-[3px] bg-sun shadow-[0_0_15px_rgba(242,211,79,0.9)]"
                style={{ left: `${split}%` }}
              >
                <div className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-sun font-grotesk text-xs font-bold text-ink shadow-[3px_3px_0_#171717] sm:h-11 sm:w-11">
                  ↔
                </div>
              </div>
            </div>
            <p className="label mt-3 text-center text-ink/55">
              DRAG ACROSS FRAME OR SWITCH PROJECTS ABOVE TO COMPARE RAW BLUEPRINT VS. FINAL EDITION
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Interactive NLE Timeline Scrubber + Horizontal Video Slider showcasing Video Editing craft */
function InteractiveReelDeck({ s, videos }: { s: Settings | null; videos: Project[] }) {
  const [scrub, setScrub] = useState(38);
  const [activeTrack, setActiveTrack] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const tracks =
    s?.reel_tracks && s.reel_tracks.length > 0
      ? s.reel_tracks
      : [
          { code: 'V1 // RHYTHM CUT', name: 'High-Retention Reels & Short-Form Storytelling', fps: '60 FPS', dur: '00:45:12', tag: 'Pacing · Hook Architecture · Sound Sync' },
          { code: 'V2 // MOTION & TYPE', name: 'Kinetic Typography & Visual Explainer Edits', fps: '24 FPS', dur: '01:18:04', tag: 'Motion Graphics · Keyframe Curves · Visual Hierarchy' },
          { code: 'V3 // PROMO & EVENT', name: 'Brand Launches, Event Aftermovies & Narrative Cuts', fps: '24 FPS', dur: '02:05:19', tag: 'Colour Grade · Audio Design · Story Arc' },
        ];

  const scrollToVideo = (targetIdx: number) => {
    if (!videos.length) return;
    const clamped = (targetIdx + videos.length) % videos.length;
    setSlideIdx(clamped);
    const el = sliderRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>('[data-video-slide]');
    const card = cards[clamped];
    if (card) {
      el.scrollTo({
        left: card.offsetLeft - el.offsetLeft,
        behavior: 'smooth',
      });
    }
  };

  const handleTrackScroll = () => {
    const el = sliderRef.current;
    if (!el || !videos.length) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    const ratio = el.scrollLeft / maxScroll;
    const idx = Math.round(ratio * (videos.length - 1));
    if (idx !== slideIdx) setSlideIdx(Math.max(0, Math.min(videos.length - 1, idx)));
  };

  return (
    <section className="relative z-10 border-y border-ink bg-ink text-ivory">
      <div className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label flex items-center gap-2 text-sun">
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-sun" />
              THE CUTTING ROOM
            </p>
            <h2 className="display h-lg mt-3">
              {s?.reel_heading_1 || 'Cut to'}{' '}
              <span className="display-serif text-sun">{s?.reel_heading_2 || 'rhythm.'}</span>
            </h2>
          </div>
          <div className="label flex items-center gap-6 text-ivory/60">
            <Link to="/video-editing" className="btn border-ivory text-ivory hover:bg-sun hover:text-ink">
              Open Video Editing →
            </Link>
          </div>
        </div>

        <div
          data-cursor-label="SCRUB"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setScrub(Math.max(2, Math.min(98, Math.round(((e.clientX - r.left) / r.width) * 100))));
          }}
          className="relative mt-12 overflow-hidden rounded-xl border border-ivory/20 bg-ivory/[0.04] p-6 backdrop-blur-sm md:p-8"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-20 w-[2px] bg-sun transition-[left] duration-75"
            style={{ left: `${scrub}%` }}
          >
            <div className="label -ml-7 mt-2 rounded bg-sun px-2 py-0.5 text-[10px] font-bold text-ink">
              {String(Math.floor(scrub * 0.6)).padStart(2, '0')}:{String((scrub * 7) % 24).padStart(2, '0')}f
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between border-b border-ivory/15 pb-3">
            <span className="label text-ivory/50">ALTURIX MASTER REEL</span>
            <span className="label text-sun">{scrub}%</span>
          </div>

          <div className="space-y-3">
            {tracks.map((t, idx) => (
              <div
                key={t.code + idx}
                onMouseEnter={() => setActiveTrack(idx)}
                className={`group relative cursor-pointer rounded-lg border p-4 transition-all duration-300 md:p-5 ${
                  activeTrack === idx ? 'border-sun bg-sun/15' : 'border-ivory/10 bg-ivory/[0.02] hover:border-ivory/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <span className="label rounded bg-sun px-2.5 py-1 text-ink">{t.code}</span>
                    <h3 className="font-grotesk text-lg font-medium md:text-2xl">{t.name}</h3>
                  </div>
                  <div className="label flex items-center gap-4 text-ivory/60">
                    <span>{t.fps}</span>
                    <span>{t.dur}</span>
                  </div>
                </div>
                <p className="label mt-2 text-ivory/50">{t.tag}</p>

                <div aria-hidden className="mt-4 flex h-6 items-end gap-[3px] overflow-hidden opacity-75">
                  {Array.from({ length: 64 }, (_, i) => {
                    const h = 20 + ((i * 19 + idx * 31 + scrub) % 80);
                    const passed = (i / 64) * 100 <= scrub;
                    return (
                      <span
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-150 ${passed ? 'bg-sun' : 'bg-ivory/25'}`}
                        style={{ height: `${h}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Horizontal Video Slider under "Cut to rhythm." */}
        {videos.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="label text-sun">VIDEO COLLECTIONS</p>
                <p className="mt-1 text-sm text-ivory/65">
                  Slide through the curated video collections or click any edition to watch all cuts.
                </p>
              </div>

              {/* Centered Horizontal Slider Controls */}
              <div className="flex flex-nowrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => scrollToVideo(slideIdx - 1)}
                  aria-label="Previous video collection"
                  className="label inline-flex h-10 min-w-[94px] items-center justify-center gap-1.5 rounded-full border-2 border-ivory/30 bg-ivory/10 px-3.5 text-[11px] font-bold text-ivory transition hover:border-sun hover:bg-sun hover:text-ink active:scale-95 sm:h-11 sm:min-w-[120px] sm:px-5 sm:text-xs"
                >
                  ← Previous
                </button>
                <div className="label flex h-10 min-w-[66px] items-center justify-center rounded-full border border-ivory/20 bg-ivory/5 px-2.5 text-[11px] font-bold text-sun sm:h-11 sm:min-w-[80px] sm:px-3.5 sm:text-xs">
                  {String(slideIdx + 1).padStart(2, '0')} / {String(videos.length).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={() => scrollToVideo(slideIdx + 1)}
                  aria-label="Next video collection"
                  className="label inline-flex h-10 min-w-[94px] items-center justify-center gap-1.5 rounded-full border-2 border-sun bg-sun px-3.5 text-[11px] font-bold text-ink transition hover:bg-ivory active:scale-95 sm:h-11 sm:min-w-[120px] sm:px-5 sm:text-xs"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable & Snap Slider Track */}
            <div
              ref={sliderRef}
              onScroll={handleTrackScroll}
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-8"
            >
              {videos.map((p, i) => (
                <div
                  key={p.id}
                  data-video-slide
                  className={`w-[85vw] shrink-0 snap-start rounded-2xl border-2 p-4 transition-all duration-300 sm:w-[62vw] md:w-[44vw] lg:w-[40vw] [&_h3]:text-ivory [&_p]:text-ivory/65 ${
                    i === slideIdx
                      ? 'border-sun bg-ivory/[0.06] shadow-[0_20px_50px_rgba(242,211,79,0.14)]'
                      : 'border-ivory/15 bg-ivory/[0.02] hover:border-ivory/35'
                  }`}
                >
                  <ProjectCard p={p} index={i} />
                </div>
              ))}
            </div>

            {/* Interactive Slider Scrub Bar & Pagination Dots */}
            {videos.length > 1 && (
              <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2">
                  {videos.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => scrollToVideo(i)}
                      aria-label={`Slide to ${v.title}`}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        i === slideIdx ? 'w-9 bg-sun' : 'w-2.5 bg-ivory/25 hover:bg-ivory/50'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex w-full max-w-xs items-center gap-3">
                  <span className="label text-[10px] text-ivory/50">SLIDE</span>
                  <input
                    type="range"
                    min={0}
                    max={videos.length - 1}
                    step={1}
                    value={slideIdx}
                    onChange={(e) => scrollToVideo(Number(e.target.value))}
                    aria-label="Slide through video collections"
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-ivory/20 accent-sun"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const { data: s } = useFetch<Settings>('/api/public/settings');
  const { data: projects, loading } = useFetch<Project[]>('/api/public/projects');
  const [filter, setFilter] = useState<'all' | 'video' | 'graphic' | 'case' | 'experiment'>('all');
  const [query, setQuery] = useState('');

  const allProjects = projects || [];
  const filteredProjects = allProjects.filter((p) => {
    const matchSec =
      filter === 'all'
        ? true
        : filter === 'case'
        ? Boolean(p.case_study)
        : p.section === filter;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.summary || '').toLowerCase().includes(q);
    return matchSec && matchQuery;
  });

  const videos = allProjects.filter((p) => p.section === 'video').slice(0, 4);
  const words = s?.marquee_words && s.marquee_words.length > 0 ? s.marquee_words : DEFAULT_WORDS;
  const ecosystemTools = s?.ecosystem_tools && s.ecosystem_tools.length > 0 ? s.ecosystem_tools : DEFAULT_ECOSYSTEM;
  const processSteps = s?.process_steps && s.process_steps.length > 0 ? s.process_steps : DEFAULT_PROCESS_STEPS;
  const journeyItems = s?.journey_items && s.journey_items.length > 0 ? s.journey_items : DEFAULT_JOURNEY;
  const heroStats =
    s?.hero_stats && s.hero_stats.length > 0
      ? s.hero_stats
      : [
          { value: `${String(Math.max(4, allProjects.length)).padStart(2, '0')}.`, label: 'CURATED MAD EDITIONS LIVE' },
          { value: '03.', label: 'CORE DISCIPLINES · VIDEO · DESIGN · CASE' },
          { value: '100%', label: 'STORY-FIRST VISUAL CRAFT' },
        ];

  const wordmark = s?.hero_wordmark || 'ALTURIX';
  const half = Math.ceil(wordmark.length / 2);
  const wordPart1 = wordmark.slice(0, half);
  const wordPart2 = wordmark.slice(half);

  const par = (k: number) => ({ transform: `translate3d(0, calc(var(--sy) * ${k}px), 0)` });

  return (
    <>
      {/* =====================================================================
          HERO SECTION — CLEAN LAYERED STAGE (TELEMETRY STRIP & PILL REMOVED)
         ===================================================================== */}
      <section className="relative z-10 mx-auto max-w-[1500px] overflow-hidden px-5 pb-16 pt-6 md:px-10 md:pb-24 md:pt-8">
        <div className="relative">
          <WeightField className="display h-hero relative z-0 whitespace-nowrap select-none text-ink">
            <Split text={wordPart1} delay={100} />
            <br className="md:hidden" />
            <span className="ml-[8vw] md:ml-0">
              <Split text={wordPart2} delay={360} />
              <span className="text-sun [-webkit-text-stroke:2px_#171717]">
                <Split text="*" delay={620} />
              </span>
            </span>
          </WeightField>

          {/* 3-Column Layered Hero Stage (Left Bio & CTA / Center Portrait / Right Stats) */}
          <div className="relative z-10 mt-6 grid items-center gap-10 lg:grid-cols-12">
            {/* LEFT COLUMN: Identity, Narrative & Primary Actions */}
            <div className="lg:col-span-5">
              {s?.hero_badge !== '' && (
                <div className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-ink bg-sun px-3.5 py-1.5 shadow-[3px_3px_0_#171717] sm:rounded-full sm:py-1">
                  <span className="label break-words text-ink">{s?.hero_badge || 'EDITOR & VISUAL DESIGNER'}</span>
                </div>
              )}

              <h1 className="lead mt-5">
                <Mark>{s?.hero_title || 'A Creative Universe.'}</Mark>
              </h1>

              <p className="body-lg mt-4 max-w-lg text-ink/80">
                {s?.hero_intro ||
                  'Crafting stories. Shaping reality. I turn raw concepts into high-retention video edits, bold graphic systems, and narrative case studies.'}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <a href="#selected-work" className="btn btn-sun shadow-[4px_4px_0_#171717]">
                  Explore My Work ↓
                </a>
                <Link to="/universe" className="btn">
                  Creative Universe ✦
                </Link>
                <Link to="/video-editing" className="btn">
                  Watch the edits →
                </Link>
              </div>

              {s?.hero_location !== '' && (
                <p className="label mt-6 flex items-center gap-2 text-ink/60">
                  <span className="inline-block h-2 w-2 rounded-full bg-sun ring-2 ring-ink" />
                  {s?.hero_location || 'JAIPUR, INDIA · AVAILABLE FOR SELECT PROJECTS WORLDWIDE'}
                </p>
              )}
            </div>

            {/* CENTER COLUMN: 3D Floating Editorial Cutout Portrait */}
            <div
              className="relative mx-auto w-[78vw] max-w-[370px] lg:col-span-4 lg:w-full"
              style={par(-0.03)}
            >
              <FloatingPortrait3D
                customUrl={s?.hero_portrait_url}
                variant="hero"
                badge={<Badge />}
              />
            </div>

            {/* RIGHT COLUMN: Editable Studio Metrics */}
            <div className="flex flex-col justify-between gap-6 border-t border-ink/15 pt-6 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div className="rounded-xl border border-ink/20 bg-paper/70 p-4">
                <p className="label text-ink/55">STUDIO ETHOS</p>
                <p className="mt-1 font-grotesk text-base font-bold text-ink">
                  {s?.hero_ethos_quote || '“Every frame. A different feeling.”'}
                </p>
              </div>

              <div className="space-y-5">
                {heroStats.map((st, idx) => (
                  <div
                    key={st.value + idx}
                    className="flex items-baseline justify-between border-b border-ink/15 pb-3 last:border-b-0 last:pb-1"
                  >
                    <span
                      className={`display text-4xl md:text-5xl ${
                        idx === heroStats.length - 1
                          ? 'text-sun [-webkit-text-stroke:1.5px_#171717]'
                          : 'text-ink'
                      }`}
                    >
                      {st.value}
                    </span>
                    <span className="label max-w-[170px] text-right text-ink/65">{st.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual kinetic ticker */}
      <div className="relative z-10 group overflow-hidden border-y border-ink bg-sun py-3.5" aria-hidden>
        <div className="skewy">
          <div className="flex w-max animate-marq gap-10 font-grotesk text-xl font-bold uppercase tracking-[0.12em] group-hover:[animation-play-state:paused]">
            {[0, 1, 2, 3].flatMap((k) =>
              words.map((w) => (
                <span key={k + w}>
                  {w} <span className="text-ivory [-webkit-text-stroke:1px_#171717]">✺</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          01 / SELECTED WORK — "WORKS THAT SPEAK." (WITH FILTER TABS & SEARCH)
         ===================================================================== */}
      <section id="selected-work" className="relative z-10 mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label text-ink/55">01 // SELECTED WORK</p>
            <h2 className="display mt-2 text-4xl leading-[0.92] sm:text-6xl md:text-7xl">
              {s?.work_heading_1 || 'WORKS THAT'}{' '}
              <span className="inline-block bg-sun px-3 py-1 text-ink shadow-[5px_5px_0_#171717]">
                {s?.work_heading_2 || 'SPEAK.'}
              </span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/graphic-design" className="btn">
              Graphic Design →
            </Link>
            <Link to="/case-studies" className="btn btn-sun">
              All Case Studies →
            </Link>
          </div>
        </div>

        {/* Category Filter Tabs + Search Input */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-ink/15 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['all', 'All Work'],
                ['graphic', 'Graphic Design'],
                ['case', 'Case Studies'],
                ['video', 'Video Editing'],
                ['experiment', 'Experiments'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`label rounded-full border px-4 py-2 transition ${
                  filter === key
                    ? 'border-ink bg-ink text-sun shadow-[3px_3px_0_#F2D34F]'
                    : 'border-ink/20 bg-paper/60 text-ink/75 hover:border-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or category..."
              className="field !rounded-full !border-ink/30 !bg-white/80 !px-4 !py-2 text-xs"
            />
          </div>
        </div>

        {/* Framed Project Cards Grid */}
        <div className="mt-12">
          {loading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-[16/11] animate-pulse rounded-2xl bg-paper" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <Empty
              title="No matching projects in this filter yet."
              note="Switch tabs above to explore other categories."
            />
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((p, i) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between rounded-2xl border-2 border-ink bg-paper/45 p-4 shadow-[6px_6px_0_#171717] transition duration-300 hover:-translate-y-1 hover:bg-ivory hover:shadow-[10px_10px_0_#171717]"
                >
                  <ProjectCard p={p} index={i} />
                  <div className="mt-4 flex items-center justify-between border-t border-ink/15 pt-3">
                    <div className="flex items-baseline gap-3">
                      <span className="display text-2xl text-ink md:text-3xl">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="label text-ink/65">
                        {p.category || p.section} // {p.year || '2026'}
                      </span>
                    </div>
                    <Link
                      to={`/work/${p.slug}`}
                      className="grid h-8 w-8 place-items-center rounded-full border border-ink bg-sun font-grotesk text-sm font-bold text-ink transition group-hover:bg-ink group-hover:text-sun"
                    >
                      ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creative Ecosystem & Tools Strip */}
        <div className="mt-20 rounded-2xl border-2 border-ink bg-paper/70 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-4">
            <p className="label text-ink">
              {s?.ecosystem_title || 'BUILT WITH INDUSTRY-STANDARD TOOLS // PART OF THE BIGGER PICTURE'}
            </p>
            <span className="label text-ink/55">POST-PRODUCTION &amp; DESIGN STACK</span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {ecosystemTools.map((tool, idx) => (
              <div
                key={tool.code + idx}
                className="flex items-center gap-3 rounded-xl border border-ink/20 bg-ivory p-3.5 transition hover:border-ink hover:bg-sun/35"
              >
                <span className="display grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-ink bg-sun text-lg text-ink shadow-[2px_2px_0_#171717]">
                  {tool.code}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-grotesk text-sm font-bold text-ink">{tool.name}</p>
                  <p className="truncate text-[11px] text-ink/60">{tool.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          02 / FROM RAW. TO REAL. (INTERACTIVE BEFORE / AFTER SPLIT SLIDER)
         ===================================================================== */}
      <WaveSection waveColor="#EDE9DC">
        <RawToRealSection s={s} projects={allProjects} />
      </WaveSection>

      {/* =====================================================================
          03 / THE CUTTING ROOM (INTERACTIVE TIMELINE)
         ===================================================================== */}
      <WaveSection waveColor="#171717">
        <InteractiveReelDeck s={s} videos={videos} />
      </WaveSection>

      {/* =====================================================================
          03.5 / THE CREATIVE UNIVERSE — "A SPACE FOR EVERY IDEA."
         ===================================================================== */}
      <WaveSection waveColor="#0E0E0D">
        <CreativeUniverse embedded />
      </WaveSection>

      {/* =====================================================================
          04 / BEHIND THE FRAMES — "NOT JUST VISUALS. HOW WE TELL THE STORY."
         ===================================================================== */}
      <WaveSection waveColor="#F5F2E9" className="relative z-10 mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
        <div className="grid items-end gap-8 border-b border-ink/15 pb-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label text-ink/55">04 // BEHIND THE FRAMES</p>
            <h2 className="display mt-3 text-4xl leading-[0.92] sm:text-6xl">
              {s?.behind_heading_1 || 'NOT JUST VISUALS.'}
              <br />
              <span className="inline-block bg-sun px-3 py-1 text-ink shadow-[5px_5px_0_#171717]">
                {s?.behind_heading_2 || 'HOW WE TELL THE STORY.'}
              </span>
            </h2>
          </div>
          <p className="body-lg text-ink/75 lg:col-span-5">
            {s?.behind_intro ||
              'I work across video editing, visual design, and narrative case studies—combining creative instinct with structured pacing to build work that feels alive.'}
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-12">
          {/* Col 1: Creative Toolkit & Capabilities */}
          <div className="space-y-8 lg:col-span-4">
            <div>
              <h3 className="label text-ink">DISCIPLINES &amp; FOCUS</h3>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-ink/20 bg-paper/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-grotesk font-bold">Video Editing &amp; Motion</p>
                    <span className="label rounded bg-sun px-2 py-0.5 text-ink">24 / 60 FPS</span>
                  </div>
                  <p className="mt-1 text-sm text-ink/70">
                    High-retention cuts, sound-synced transitions, kinetic typography, and visual storytelling.
                  </p>
                </div>

                <div className="rounded-xl border border-ink/20 bg-paper/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-grotesk font-bold">Graphic Design &amp; Carousels</p>
                    <span className="label rounded bg-sun px-2 py-0.5 text-ink">EDITORIAL</span>
                  </div>
                  <p className="mt-1 text-sm text-ink/70">
                    Poster systems, brand identities, and multi-slide interactive PDF carousels.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="label text-ink">CREATIVE TOOLKIT</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  s?.capabilities || [
                    'Video Editing',
                    'Motion Graphics',
                    'Graphic Design',
                    'Carousel Architecture',
                    'Brand Identity',
                    'Color Grading',
                    'Storytelling',
                  ]
                ).map((cap) => (
                  <span
                    key={cap}
                    className="label rounded-full border border-ink bg-ivory px-3.5 py-1.5 text-ink shadow-[2px_2px_0_#171717]"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Col 2: "FROM IDEA TO FINAL FRAME" 5-Step Vertical Timeline */}
          <div className="lg:col-span-5">
            <h3 className="label text-ink">FROM IDEA TO FINAL FRAME</h3>
            <ol className="relative mt-6 space-y-6 border-l-2 border-ink pl-6">
              {processSteps.map((st, idx) => (
                <li key={st.num + idx} className="group relative">
                  <span className="absolute -left-[33px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-ink bg-sun transition group-hover:scale-125" />
                  <div className="flex items-baseline gap-3">
                    <span className="display text-xl text-ink">{st.num}</span>
                    <h4 className="font-grotesk text-lg font-bold tracking-tight text-ink">
                      {st.title}
                    </h4>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink/75">{st.desc}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Col 3: Director's Quote Card */}
          <div className="lg:col-span-3">
            <div className="flex h-full flex-col justify-between rounded-2xl border-2 border-ink bg-sun p-6 text-ink shadow-[8px_8px_0_#171717] md:p-8">
              <span className="display text-5xl leading-none">“</span>
              <p className="font-grotesk text-xl font-bold leading-snug md:text-2xl">
                {s?.director_quote ||
                  'From raw concept and storytelling to visuals that feel cinematic, intentional, and impossible to scroll past.'}
              </p>
              <div className="mt-8 border-t border-ink/25 pt-4">
                <p className="display text-xl">{s?.director_name || 'Divyanshu Saini'}</p>
                <p className="label mt-1 text-ink/70">
                  {s?.director_sub || 'THE NEXT FRAME COUNTS // ALTURIX'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </WaveSection>

      {/* =====================================================================
          05 / THE JOURNEY & MILESTONES — "KEEP MOVING. KEEP CREATING."
         ===================================================================== */}
      <WaveSection waveColor="#EDE9DC" className="relative z-10 border-t border-ink/15 bg-paper/50">
        <div className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink/15 pb-8">
            <div>
              <p className="label text-ink/55">05 // THE JOURNEY</p>
              <h2 className="display mt-2 text-4xl leading-[0.92] sm:text-6xl">
                {s?.journey_heading_1 || 'KEEP MOVING.'}{' '}
                <span className="inline-block bg-sun px-3 py-1 text-ink shadow-[5px_5px_0_#171717]">
                  {s?.journey_heading_2 || 'KEEP CREATING.'}
                </span>
              </h2>
            </div>
            <Link to="/about" className="btn">
              Full Story &amp; Ethos →
            </Link>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-12">
            {/* Left Timeline */}
            <div className="space-y-8 border-l-2 border-ink pl-6 lg:col-span-7">
              {journeyItems.map((item, idx) => (
                <div
                  key={item.role + idx}
                  className="relative rounded-2xl border border-ink/20 bg-ivory p-6 shadow-[4px_4px_0_#171717]"
                >
                  <span className="absolute -left-[33px] top-7 h-4 w-4 rounded-full border-2 border-ink bg-sun" />
                  <span className="label rounded bg-sun px-2.5 py-1 text-ink">{item.period}</span>
                  <h3 className="mt-3 font-grotesk text-2xl font-bold text-ink">{item.role}</h3>
                  <p className="label mt-1 text-ink/60">{item.org}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink/80">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Right Recognition & Milestones Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border-2 border-ink bg-ink p-6 text-ivory shadow-[8px_8px_0_#F2D34F] md:p-8">
                <p className="label text-sun">A FEW MILESTONES</p>
                <h3 className="display mt-2 text-3xl sm:text-4xl">
                  {s?.milestones_heading_1 || 'LITTLE WINS.'}
                  <br />
                  <span className="text-sun">{s?.milestones_heading_2 || 'BIG MEANING.'}</span>
                </h3>
                <p className="mt-3 text-sm text-ivory/70">
                  {s?.milestones_desc ||
                    'Selected creative editions, deep-dive business case studies, and visual experiments published under ALTURIX.'}
                </p>

                <div className="mt-6 divide-y divide-ivory/15 border-y border-ivory/15">
                  {allProjects.slice(0, 4).map((p, idx) => (
                    <Link
                      key={p.id}
                      to={`/work/${p.slug}`}
                      className="group flex items-center justify-between gap-4 py-4 transition hover:px-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="label text-sun">0{idx + 1} // {p.category || 'MAD EDITION'}</span>
                        <p className="mt-0.5 font-grotesk text-base font-bold leading-snug text-ivory group-hover:text-sun">
                          {p.title}
                        </p>
                      </div>
                      <span className="display inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-lg text-sun sm:text-xl">
                        <span>{p.year || '2026'}</span>
                        <span>↗</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </WaveSection>

      {/* Complete Interactive Hover Index */}
      {allProjects.length > 0 && (
        <section className="relative z-10 mx-auto max-w-[1500px] px-5 py-20 md:px-10 md:py-28">
          <div className="mb-6 flex items-center justify-between">
            <p className="label text-ink/60">06 // COMPLETE ARCHIVE INDEX — HOVER TO PREVIEW</p>
            <span className="label text-ink/45">{allProjects.length} CURATED PIECES</span>
          </div>
          <HoverIndex projects={allProjects} />
        </section>
      )}

      {/* =====================================================================
          07 / YOUR NEXT STORY — "LET'S WORK TOGETHER." + "MAKE IT FEEL REAL."
         ===================================================================== */}
      <WaveSection waveColor="#171717" className="relative z-10 border-t-2 border-ink bg-ink text-ivory">
        <div className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Headline & CTA */}
            <div className="lg:col-span-5">
              <p className="label text-sun">07 // YOUR NEXT STORY</p>
              <h2 className="display mt-3 text-5xl leading-[0.9] sm:text-6xl md:text-7xl">
                {s?.cta_heading_1 || "LET'S WORK"}
                <br />
                <span className="text-sun">{s?.cta_heading_2 || 'TOGETHER.'}</span>
              </h2>
              <p className="body-lg mt-5 text-ivory/75">
                {s?.cta_intro ||
                  "Have a story, brand, or video project ready to bring to life? Let's build something worth watching."}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/contact"
                  className="btn btn-sun text-ink shadow-[4px_4px_0_#F5F2E9]"
                >
                  ↗ Start a Conversation
                </Link>
              </div>
            </div>

            {/* Center Direct Channels */}
            <div className="space-y-4 lg:col-span-3">
              <div className="rounded-xl border border-ivory/15 bg-ivory/[0.04] p-4">
                <p className="label text-sun">DISCIPLINES</p>
                <p className="mt-1 font-grotesk text-base font-bold text-ivory">
                  Video Editing · Graphic Design · Case Studies
                </p>
              </div>
              <div className="rounded-xl border border-ivory/15 bg-ivory/[0.04] p-4">
                <p className="label text-sun">BASED IN</p>
                <p className="mt-1 font-grotesk text-base font-bold text-ivory">
                  {s?.location_text || 'Jaipur, India · Available Worldwide'}
                </p>
              </div>
            </div>

            {/* Right "MAKE IT FEEL REAL." Interactive Card */}
            <div className="lg:col-span-4">
              <Link
                to="/contact"
                className="group relative block overflow-hidden rounded-2xl border-2 border-sun bg-gradient-to-br from-sun/20 via-ink to-ink p-8 shadow-[8px_8px_0_#F2D34F]"
              >
                <p className="label text-sun">ALTURIX STUDIO</p>
                <h3 className="display mt-6 text-4xl leading-[0.95] text-ivory sm:text-5xl">
                  {s?.cta_card_title_1 || 'MAKE IT'}
                  <br />
                  <span className="text-sun">{s?.cta_card_title_2 || 'FEEL REAL.'}</span>
                </h3>
                <p className="mt-3 text-sm text-ivory/70">
                  {s?.cta_card_sub ||
                    "Pitch your project brief and let's craft the next edition together."}
                </p>
                <div className="mt-8 flex items-center justify-between">
                  <span className="label text-ivory/60">OPEN INQUIRY FORM</span>
                  <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink bg-sun font-grotesk text-lg font-bold text-ink transition group-hover:scale-110">
                    ▶
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </WaveSection>
    </>
  );
}
