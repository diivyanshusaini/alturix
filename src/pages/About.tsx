import { Link } from 'react-router-dom';
import { FloatingPortrait3D, Mark, Reveal, useFetch } from '../components/shared';
import type { Settings } from '../types';

export default function About() {
  const { data: s } = useFetch<Settings>('/api/public/settings');

  return (
    <section className="relative mx-auto max-w-[1500px] overflow-hidden px-5 pb-20 pt-14 md:px-10 md:pt-24">
      {/* Subtle floating cosmic stickers connecting About to the ALTURIX Creative Universe */}
      <img
        src="/stickers/vintage-saturn.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-12 top-10 hidden w-44 rotate-[-8deg] object-contain opacity-30 animate-subtleFloat lg:block"
      />
      <img
        src="/stickers/vintage-comet.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-[28%] top-8 hidden w-28 rotate-[-14deg] object-contain opacity-45 animate-subtleFloat md:block"
      />

      {/* Header */}
      <div className="relative z-10 max-w-4xl">
        <p className="label text-ink/60">About</p>

        <h1 className="display h-xl mt-3">
          <Mark>Divyanshu Saini.</Mark>
        </h1>

        <p className="mt-4 font-grotesk text-xl font-medium text-ink/75 sm:text-2xl">
          Building a space where every visual idea has gravity, rhythm, and meaning.
        </p>
      </div>

      {/* Main 3-Column Editorial Profile Grid */}
      <div className="relative z-10 mt-14 grid items-start gap-12 lg:grid-cols-12">
        {/* Column 1: 3D-Style Floating Editorial Cutout Portrait */}
        <div className="lg:col-span-4">
          <FloatingPortrait3D
            customUrl={s?.hero_portrait_url}
            variant="about"
            caption="Divyanshu Saini — Video Editor · Visual Designer · Creative Explorer"
          />
        </div>

        {/* Column 2: Narrative Bio & Creative Ethos */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border-2 border-ink bg-paper/70 p-6 shadow-[6px_6px_0_#171717] md:p-8">
            <p className="label text-ink/55">01 // THE STORY</p>
            <p className="body-lg mt-4 whitespace-pre-line text-ink/90">
              {s?.about ||
                'I am Divyanshu Saini, a video editor, visual designer, and creative explorer based in Jaipur, India. Through ALTURIX, I craft retention-first video edits, editorial graphic systems, and narrative case studies.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-ink/15 pt-5">
              <Link to="/universe" className="btn btn-sun shadow-[3px_3px_0_#171717]">
                Explore Creative Universe ✦
              </Link>
              <Link to="/contact" className="btn">
                Start a Project →
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-ink p-6 text-ivory shadow-[6px_6px_0_#F2D34F]">
            <img
              src="/stickers/planet-terra-ring.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute -bottom-4 -right-4 w-24 object-contain opacity-65 animate-subtleFloat"
            />
            <p className="label text-sun">02 // CREATIVE POSITIONING</p>
            <h2 className="mt-2 font-grotesk text-2xl font-bold text-ivory">
              ALTURIX — <span className="display-serif font-normal text-sun">A Creative Universe.</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ivory/75">
              From short-form rhythm cuts and event chronicles (BITMELA 2026, SONGSCAPE9, Universe
              Series) to multi-slide startup carousels and graphic posters, every piece is built to
              hold attention from the first frame to the last.
            </p>
          </div>
        </div>

        {/* Column 3: Capabilities & Core Stack */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border-2 border-ink bg-ivory p-6 shadow-[6px_6px_0_#171717] md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="label text-ink/60">03 // CAPABILITIES &amp; CRAFT</h2>
              <img
                src="/stickers/sticker-rocket.png"
                alt=""
                aria-hidden
                className="h-9 w-9 object-contain"
              />
            </div>

            <ul className="mt-4 divide-y divide-ink/15 border-y border-ink/15 font-grotesk text-lg font-bold md:text-xl">
              {(
                s?.capabilities || [
                  'Video Editing & Rhythm Cutting',
                  'Motion Graphics & Kinetic Type',
                  'Editorial Carousel Design',
                  'Brand & Visual Identity',
                  'Poster & Social Media Systems',
                  'Narrative Case Studies',
                ]
              ).map((c, idx) => (
                <li key={c} className="flex items-center justify-between py-3.5">
                  <span>{c}</span>
                  <span className="label rounded-full bg-sun px-2.5 py-0.5 text-[10px] text-ink">
                    0{idx + 1}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* MAD Philosophy Triad: Make · Adapt · Discover */}
      <div className="relative z-10 mt-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-ink/55">04 // CREATIVE PHILOSOPHY</p>
            <h2 className="display h-lg mt-2">
              THE <span className="display-serif font-normal underline decoration-sun">MAD</span>{' '}
              DOCTRINE.
            </h2>
          </div>
          <p className="label text-ink/60">MAKE · ADAPT · DISCOVER</p>
        </div>

        <div className="grid gap-px border-2 border-ink bg-ink shadow-[10px_10px_0_#171717] md:grid-cols-3">
          {(
            [
              [
                'M',
                'Make',
                'Start before it feels ready. Ship the rough version, test the rhythm, and refine every frame through real execution.',
                '/stickers/planet-orange.png',
              ],
              [
                'A',
                'Adapt',
                'Bend the idea to the medium, the audience, and the constraint—whether a 60fps reel, a 10-slide carousel, or a cinema intro.',
                '/stickers/planet-saturn-gold.png',
              ],
              [
                'D',
                'Discover',
                'Follow curiosity into new visual languages, experimental typography, and unexplored creative territories.',
                '/stickers/vintage-nebula-orb.png',
              ],
            ] as const
          ).map(([l, t, d, sticker], i) => (
            <Reveal key={l} delay={i * 70} className="relative overflow-hidden bg-ivory p-8 md:p-12">
              <img
                src={sticker}
                alt=""
                aria-hidden
                className="pointer-events-none absolute right-6 top-6 w-14 object-contain opacity-80 animate-subtleFloat md:w-16"
              />
              <p className="display text-[24vw] leading-none text-sun [-webkit-text-stroke:2px_#171717] md:text-[9.5vw]">
                {l}
              </p>
              <h3 className="mt-3 font-grotesk text-3xl font-bold text-ink">{t}.</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75 md:text-base">{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
