import { useState } from 'react';
import { Empty, Mark, ProjectCard, Reveal, Split, useFetch } from '../components/shared';
import type { Project, Section } from '../types';

const COPY: Record<Section, { kicker: string; title: string; sub: string; empty: string }> = {
  video: {
    kicker: 'VIDEO EDITING & MOTION',
    title: 'Motion & story.',
    sub: 'Reels, educational videos, storytelling, event edits, promotional videos and kinetic motion content.',
    empty: 'New video collections and motion edits will appear here soon.',
  },
  graphic: {
    kicker: 'GRAPHIC DESIGN & VISUAL SYSTEMS',
    title: 'Type & form.',
    sub: 'Posters, thumbnails, social media creatives, typography, branding and visual identity.',
    empty: 'New graphic design projects will appear here soon.',
  },
  experiment: {
    kicker: 'EXPERIMENTS & SELF-INITIATED CONCEPTS',
    title: 'Play, on purpose.',
    sub: 'Self-initiated concepts, visual manifestos and creative explorations — clearly labelled as such.',
    empty: 'New creative experiments will appear here soon.',
  },
};

export default function SectionPage({ section }: { section: Section }) {
  const c = COPY[section];
  const { data, loading } = useFetch<Project[]>(`/api/public/projects?section=${section}`);
  const cats = ['All', ...Array.from(new Set((data || []).map((p) => p.category).filter(Boolean)))];
  const [cat, setCat] = useState('All');
  const list = (data || []).filter((p) => cat === 'All' || p.category === cat);

  return (
    <section className="relative z-10 mx-auto max-w-[1500px] px-5 pt-14 md:px-10 md:pt-20">
      <div className="border-b border-ink/15 pb-4">
        <p className="label text-ink/60">{c.kicker}</p>
      </div>
      <h1 className="display h-xl mt-6">
        <Mark><Split text={c.title} delay={80} step={35} /></Mark>
      </h1>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <p className="max-w-xl body-lg text-ink/75">{c.sub}</p>
      </div>

      {section === 'video' && (
        <Reveal className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ['01 // SHORT-FORM & REELS', 'Hook-first pacing, rhythm cuts, dynamic captions and retention-engineered storytelling.'],
            ['02 // EDUCATIONAL & EXPLAINERS', 'Visual metaphors, motion graphics, clean typographic hierarchy and sound design.'],
            ['03 // EVENT & PROMO CUTS', 'High-energy beat sync, colour grading, speed ramping and narrative build-up.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-ink bg-white/55 p-6 shadow-[6px_6px_0_#171717] transition hover:-translate-y-1 hover:bg-sun/35">
              <p className="label text-ink/60">{t}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">{d}</p>
            </div>
          ))}
        </Reveal>
      )}

      {cats.length > 2 && (
        <div className="mt-12 flex flex-wrap gap-2" role="tablist">
          {cats.map((k) => (
            <button key={k} onClick={() => setCat(k)} aria-pressed={cat === k} className={`btn ${cat === k ? 'bg-ink text-ivory' : ''}`}>
              {k}
            </button>
          ))}
        </div>
      )}

      <div className="mt-16">
        {loading ? null : list.length === 0 ? (
          <Empty title="Ready for your next cut." note={c.empty} />
        ) : (
          <div className={`grid gap-x-8 gap-y-16 ${section === 'graphic' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
            {list.map((p, i) => (
              <ProjectCard key={p.id} p={p} index={i} tall={section === 'graphic'} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
