import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AmbientExhibitionStage,
  PdfInlineCarousel,
  SlideDeck,
  VideoCarouselDeck,
} from '../components/pdfCarousel';
import { Cover, Mark, useFetch } from '../components/shared';
import { CONTRIB_LABEL, type Asset, type CaseStudy, type Project } from '../types';

const CHAPTERS: [keyof CaseStudy, string][] = [
  ['brief', 'Brief'],
  ['objective', 'Objective'],
  ['direction', 'Creative direction'],
  ['research', 'Research & references'],
  ['concept', 'Concept & thought process'],
  ['typography', 'Typography & colour'],
  ['execution', 'Execution'],
  ['output', 'Final output'],
];

/** Individual Video Card inside THE VIDEO COLLECTION with ambient dark stage, play controls & auto-pause of other videos */
function VideoCollectionCard({
  asset,
  index,
  isFocused,
  onFocusStage,
  onPlayVideo,
}: {
  asset: Asset;
  index: number;
  isFocused: boolean;
  onFocusStage: () => void;
  onPlayVideo: (el: HTMLVideoElement) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handleTogglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
  };

  const displayTitle =
    asset.title && !asset.title.startsWith('WhatsApp Video')
      ? asset.title
      : asset.caption || asset.title || `Edit ${String(index + 1).padStart(2, '0')}`;

  return (
    <div
      className={`group flex flex-col justify-between overflow-hidden rounded-2xl border-2 bg-paper/55 transition-all duration-300 hover:-translate-y-1.5 hover:bg-ivory ${
        isFocused
          ? 'border-ink ring-2 ring-sun shadow-[8px_8px_0_#171717]'
          : 'border-ink shadow-[5px_5px_0_#171717] hover:shadow-[9px_9px_0_#171717]'
      }`}
    >
      {/* Consistent 16:9 Stage with Ambient Blur Backdrop — Portrait & Landscape videos never stretch */}
      <div className="relative aspect-video w-full overflow-hidden border-b-2 border-ink bg-[#0C0C0B]">
        {/* Subtle blurred ambient backdrop derived from poster so portrait 9:16 videos feel framed in an exhibition */}
        {asset.poster_url && (
          <img
            src={asset.poster_url}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-xl"
          />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(242,211,79,0.14)_0%,rgba(12,12,11,0.75)_80%)]"
        />

        <video
          ref={videoRef}
          src={asset.poster_url ? asset.url : `${asset.url}#t=0.5`}
          poster={asset.poster_url || undefined}
          controls
          playsInline
          preload={asset.poster_url ? 'none' : 'metadata'}
          onPlay={(e) => {
            setPlaying(true);
            onPlayVideo(e.currentTarget);
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          className="relative z-[3] h-full w-full object-contain"
        />

        {/* Crisp Unstretched Thumbnail Overlay when paused */}
        {!playing && asset.poster_url && (
          <img
            src={asset.poster_url}
            alt={displayTitle}
            className="pointer-events-none absolute inset-0 z-[4] h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}

        {/* Index Pill */}
        <span className="label pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-ink bg-sun px-2.5 py-1 text-[10px] font-bold text-ink shadow-[2px_2px_0_#171717]">
          #{String(index + 1).padStart(2, '0')}
        </span>

        {/* Stage Focus Badge */}
        <button
          type="button"
          onClick={onFocusStage}
          className="label absolute right-3 top-3 z-10 rounded-full border border-ivory/30 bg-ink/80 px-2.5 py-1 text-[9px] text-ivory backdrop-blur-sm transition hover:border-sun hover:bg-sun hover:text-ink"
        >
          {isFocused ? '● ON STAGE' : '⤢ THEATRE STAGE'}
        </button>

        {/* Custom Play Button Overlay when Paused */}
        {!playing && (
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={`Play ${displayTitle}`}
            className="absolute inset-0 z-[5] grid place-items-center bg-ink/20 transition duration-300 group-hover:bg-ink/5"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-sun font-grotesk text-lg font-bold text-ink shadow-[4px_4px_0_#171717] transition duration-300 group-hover:scale-110">
              ▶
            </span>
          </button>
        )}
      </div>

      {/* Video Metadata & Optional Caption */}
      <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="label text-ink/55">EDIT {String(index + 1).padStart(2, '0')}</span>
            {asset.category && (
              <span className="label rounded bg-sun/60 px-2 py-0.5 text-[10px] text-ink">
                {asset.category}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 font-grotesk text-base font-bold leading-snug text-ink md:text-lg">
            {displayTitle}
          </h3>
          {asset.caption && asset.caption !== displayTitle && (
            <p className="mt-1.5 text-xs leading-relaxed text-ink/75 md:text-sm">{asset.caption}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { slug } = useParams();
  const { data: p, loading, error } = useFetch<Project>(`/api/public/projects/${slug}`, [slug]);
  const [zoom, setZoom] = useState<Asset | null>(null);
  const [stageVideoIdx, setStageVideoIdx] = useState(0);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  if (loading) return <div className="h-[70vh]" />;
  if (error || !p) {
    return (
      <div className="mx-auto max-w-[1500px] px-5 py-32 md:px-10">
        <h1 className="display h-xl">Not found.</h1>
        <Link to="/" className="btn mt-8">
          ← Back home
        </Link>
      </div>
    );
  }

  // Deduplicate assets by ID so every uploaded item appears at most once
  const uniqueAssets: Asset[] = [];
  const seenIds = new Set<number>();
  for (const a of p.assets) {
    if (!seenIds.has(a.id)) {
      seenIds.add(a.id);
      uniqueAssets.push(a);
    }
  }

  const videoAssets = uniqueAssets.filter((a) => a.kind === 'video');
  const pdfAssets = uniqueAssets.filter((a) => a.kind === 'pdf');
  const imageAssets = uniqueAssets.filter((a) => a.kind === 'image');

  const isVideoCollection = videoAssets.length > 0 || p.section === 'video';
  const chapters = CHAPTERS.filter(([k]) => Boolean(p.case_study[k]?.trim()));

  // Pause any previously playing video when a new video starts playing
  const handlePlayVideo = (el: HTMLVideoElement) => {
    if (activeVideoRef.current && activeVideoRef.current !== el && !activeVideoRef.current.paused) {
      activeVideoRef.current.pause();
    }
    activeVideoRef.current = el;
  };

  // Hero cover asset representing the project/collection at the top
  const coverAsset = p.cover || imageAssets[0] || videoAssets[0] || pdfAssets[0] || null;

  return (
    <article className="relative z-10 mx-auto max-w-[1500px] overflow-x-hidden px-5 pb-24 pt-10 md:px-10 md:pt-16">
      {/* Top Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="label text-ink/60">
          <Link to="/" className="underline hover:text-ink">
            Home
          </Link>{' '}
          /{' '}
          <Link to="/universe" className="underline hover:text-ink">
            Creative Universe
          </Link>{' '}
          /{' '}
          <Link
            to={
              p.section === 'video'
                ? '/video-editing'
                : p.section === 'experiment'
                ? '/experiments'
                : '/graphic-design'
            }
            className="underline hover:text-ink"
          >
            {p.category || p.section}
          </Link>
        </p>
        {videoAssets.length > 0 && (
          <span className="label rounded-full border border-ink bg-sun px-3.5 py-1 text-ink shadow-[2px_2px_0_#171717]">
            ▶ {videoAssets.length} {videoAssets.length === 1 ? 'VIDEO' : 'VIDEOS'} IN COLLECTION
          </span>
        )}
      </div>

      {/* Project Title */}
      <h1 className="display h-xl mt-4 break-words">
        <Mark>{p.title}</Mark>
      </h1>

      {/* Project Introduction & Metadata */}
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <p className="lead break-words">{p.summary}</p>
          {p.contribution === 'speculative' && (
            <p className="label mt-4 inline-block bg-sun px-3 py-1.5">
              Speculative concept — not a commissioned project
            </p>
          )}
          {videoAssets.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#video-collection" className="btn btn-sun shadow-[4px_4px_0_#171717]">
                ▼ Watch All {videoAssets.length} Videos in Collection
              </a>
              <a href="#cinema-stage" className="btn">
                ▶ Theatre Carousel Stage
              </a>
            </div>
          )}
        </div>

        <dl className="label grid min-w-0 grid-cols-2 gap-4 rounded-2xl border-2 border-ink bg-paper/60 p-5 shadow-[4px_4px_0_#171717] sm:grid-cols-3 lg:col-span-4 lg:grid-cols-2">
          {[
            ['Category', p.category],
            ['Type', p.project_type],
            ['Contribution', CONTRIB_LABEL[p.contribution]],
            ['Year', p.year],
            ['Tools', p.tools.join(', ')],
            ['Credits', p.credits],
            videoAssets.length > 0 ? ['Collection', `${videoAssets.length} Video Edits`] : ['', ''],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-ink/50">{k}</dt>
                <dd className="mt-1 break-words font-sans text-sm font-semibold normal-case tracking-normal text-ink">
                  {v}
                </dd>
              </div>
            ))}
        </dl>
      </div>

      {/* Top Cover / Hero Visual (Displays collection cover image, or interactive exhibition carousel for PDF/Slide/Poster projects) */}
      <div className="mt-10">
        {!isVideoCollection && imageAssets.length > 1 ? (
          <SlideDeck slides={imageAssets} onOpen={setZoom} />
        ) : !isVideoCollection && pdfAssets.length > 0 ? (
          <PdfInlineCarousel url={pdfAssets[0].url} title={pdfAssets[0].title || p.title} />
        ) : !isVideoCollection && p.cover?.kind === 'pdf' ? (
          <PdfInlineCarousel url={p.cover.url} title={p.cover.title || p.title} />
        ) : !isVideoCollection && coverAsset ? (
          <div className="overflow-hidden rounded-2xl border-2 border-ink bg-[#0B0B0A] text-ivory shadow-[10px_10px_0_#171717]">
            <div className="flex items-center justify-between border-b border-ivory/15 bg-[#121210] px-5 py-3.5">
              <span className="label flex items-center gap-2 text-sun">
                <span className="inline-block h-2 w-2 rounded-full bg-sun" />
                ORIGINAL ARTWORK EXHIBITION STAGE
              </span>
              <button
                type="button"
                onClick={() => setZoom(coverAsset)}
                className="label underline hover:text-sun"
              >
                Click Artwork to Zoom ⤢
              </button>
            </div>
            <AmbientExhibitionStage>
              <img
                src={coverAsset.url}
                alt={p.title}
                onClick={() => setZoom(coverAsset)}
                className="max-h-full max-w-full cursor-zoom-in rounded-lg object-contain shadow-[0_24px_65px_rgba(0,0,0,0.88)]"
              />
            </AmbientExhibitionStage>
          </div>
        ) : coverAsset ? (
          <div className="relative aspect-[16/9] max-h-[620px] w-full overflow-hidden rounded-2xl border-2 border-ink bg-ink shadow-[8px_8px_0_#171717]">
            <Cover asset={coverAsset} alt={p.title} className="h-full w-full" />
            {videoAssets.length > 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-6 text-ivory md:p-8">
                <div>
                  <span className="label rounded bg-sun px-2.5 py-1 text-ink">
                    FEATURED COLLECTION COVER
                  </span>
                  <p className="mt-2 font-grotesk text-xl font-bold md:text-2xl">{p.title}</p>
                </div>
                <span className="label text-sun">
                  SCROLL DOWN FOR ALL {videoAssets.length} VIDEOS ↓
                </span>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* =====================================================================
          THE VIDEO COLLECTION — INTERACTIVE EXHIBITION CAROUSEL + RESPONSIVE GRID
          (3 columns on desktop, 2 on tablet, 1 on mobile — NO DUPLICATES)
         ===================================================================== */}
      {videoAssets.length > 0 && (
        <section id="video-collection" className="mt-20 scroll-mt-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
            <div>
              <p className="label text-ink/55">COMPLETE PROJECT ARCHIVE</p>
              <h2 className="display mt-2 text-4xl leading-[0.92] sm:text-5xl md:text-6xl">
                THE VIDEO{' '}
                <span className="inline-block bg-sun px-3 py-1 text-ink shadow-[4px_4px_0_#171717]">
                  COLLECTION
                </span>
              </h2>
            </div>
            <span className="label rounded-full border border-ink bg-paper px-4 py-2 text-ink">
              SHOWING ALL {videoAssets.length} {videoAssets.length === 1 ? 'VIDEO' : 'VIDEOS'}
            </span>
          </div>

          {/* Interactive Video Exhibition Carousel Stage (Aligned Prev/Next + Ambient Background) */}
          {videoAssets.length > 1 && (
            <div id="cinema-stage" className="mb-14 scroll-mt-24">
              <VideoCarouselDeck
                videos={videoAssets}
                activeIndex={stageVideoIdx}
                onChangeIndex={setStageVideoIdx}
                onPlayVideo={handlePlayVideo}
              />
            </div>
          )}

          {/* Responsive Video Collection Grid (3 cols desktop, 2 cols tablet, 1 col mobile) */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
            {videoAssets.map((video, idx) => (
              <VideoCollectionCard
                key={video.id}
                asset={video}
                index={idx}
                isFocused={stageVideoIdx === idx}
                onFocusStage={() => {
                  setStageVideoIdx(idx);
                  document.getElementById('cinema-stage')?.scrollIntoView({ behavior: 'smooth' });
                }}
                onPlayVideo={handlePlayVideo}
              />
            ))}
          </div>
        </section>
      )}

      {/* Graphic Collection Complete Slide Overview Grid (for multi-slide graphic projects) */}
      {!isVideoCollection && imageAssets.length > 1 && (
        <section className="mt-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
            <div>
              <p className="label text-ink/55">COMPLETE VISUAL SEQUENCE</p>
              <h2 className="display mt-1 text-3xl sm:text-5xl">ALL FRAMES IN COLLECTION</h2>
            </div>
            <span className="label rounded-full border border-ink bg-paper px-3.5 py-1.5">
              {imageAssets.length} FRAMES · CLICK ANY FRAME TO ENLARGE
            </span>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {imageAssets.map((a, idx) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setZoom(a)}
                className="group overflow-hidden rounded-2xl border-2 border-ink bg-[#0E0E0D] p-3 text-left shadow-[4px_4px_0_#171717] transition duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0_#171717]"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-[#090908]">
                  <img
                    src={a.url}
                    alt={a.caption || a.title}
                    loading="lazy"
                    className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="label absolute left-2 top-2 rounded bg-sun px-2 py-0.5 text-[9px] text-ink">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                {a.caption && <p className="label mt-2.5 truncate text-ivory/80">{a.caption}</p>}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Non-Video Image Gallery (for Video projects that also have supplemental stills) */}
      {isVideoCollection && imageAssets.filter((img) => img.id !== p.cover_asset_id).length > 0 && (
        <section className="mt-20">
          <h2 className="display h-lg mb-8">STILLS &amp; ARTWORK</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {imageAssets
              .filter((img) => img.id !== p.cover_asset_id)
              .map((a) => (
                <div
                  key={a.id}
                  className="overflow-hidden rounded-2xl border-2 border-ink bg-paper/50 p-3 shadow-[4px_4px_0_#171717]"
                >
                  <button
                    type="button"
                    onClick={() => setZoom(a)}
                    className="block aspect-video w-full cursor-zoom-in overflow-hidden rounded-lg bg-ink"
                  >
                    <img
                      src={a.url}
                      alt={a.caption || a.title}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </button>
                  {a.caption && <p className="label mt-2 text-ink/70">{a.caption}</p>}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Optional PDF Document Viewer for multi-slide + PDF projects */}
      {!isVideoCollection && pdfAssets.length > 0 && imageAssets.length > 1 && (
        <section className="mt-20">
          <h2 className="display h-lg mb-8">Carousel PDF Document</h2>
          <div className="space-y-6">
            {pdfAssets.map((a) => (
              <PdfInlineCarousel key={a.id} url={a.url} title={a.title} />
            ))}
          </div>
        </section>
      )}

      {/* Written Case Study Text Chapters (Text-Only — NEVER duplicates video files) */}
      {(chapters.length > 0 || p.case_study.contribution) && (
        <section className="mt-24 border-t-2 border-ink pt-14">
          <p className="label text-ink/55">PROJECT NOTES &amp; PROCESS</p>
          <h2 className="display mt-2 text-3xl sm:text-5xl">BEHIND THE EDIT</h2>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {chapters.map(([k, label], i) => (
              <div
                key={k}
                className="rounded-2xl border border-ink/20 bg-paper/50 p-6 shadow-[4px_4px_0_#171717]"
              >
                <h3 className="label text-ink/60">
                  {String(i + 1).padStart(2, '0')} — {label}
                </h3>
                <p className="body-lg mt-3 whitespace-pre-line text-ink/85">{p.case_study[k]}</p>
              </div>
            ))}
            {p.case_study.contribution && (
              <div className="rounded-2xl border border-ink/20 bg-sun/35 p-6 shadow-[4px_4px_0_#171717]">
                <h3 className="label text-ink">MY CONTRIBUTION</h3>
                <p className="body-lg mt-3 whitespace-pre-line text-ink/90">
                  {p.case_study.contribution}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Lightbox for Enlarged Images */}
      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoom(null)}
          onKeyDown={(e) => e.key === 'Escape' && setZoom(null)}
          tabIndex={0}
          ref={(el) => el?.focus()}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/95 p-4 backdrop-blur-md"
        >
          <div className="mb-4 flex w-full max-w-5xl items-center justify-between text-ivory">
            <span className="label text-sun">{zoom.caption || zoom.title || p.title}</span>
            <button
              type="button"
              onClick={() => setZoom(null)}
              className="inline-flex items-center gap-2 rounded-full border border-ivory/30 bg-ink px-4 py-1.5 font-grotesk text-xs font-bold uppercase tracking-widest text-ivory hover:bg-sun hover:text-ink"
            >
              Close ✕
            </button>
          </div>
          <img
            src={zoom.url}
            alt={zoom.title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </article>
  );
}
