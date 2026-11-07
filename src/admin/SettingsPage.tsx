import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import type {
  EcosystemTool,
  HeroStat,
  JourneyItem,
  ProcessStep,
  ReelTrack,
  Settings,
} from '../types';

type TabKey = 'hero' | 'work' | 'raw_reel' | 'behind' | 'journey' | 'about_contact';

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [tab, setTab] = useState<TabKey>('hero');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Settings>('GET', '/api/public/settings').then(setS);
  }, []);

  if (!s) return null;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setS((prev) => (prev ? { ...prev, [k]: v } : prev));
  };

  async function saveAll() {
    if (!s) return;
    setSaving(true);
    setMsg('');
    try {
      const updated = await api<Settings>('PUT', '/api/admin/settings', s);
      setS(updated);
      setMsg('✓ All section changes saved and live on the website!');
    } catch (e: any) {
      setMsg(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function pw(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api('POST', '/api/admin/password', {
        current: f.get('current'),
        next: f.get('next'),
      });
      setMsg('✓ Admin password changed.');
      e.currentTarget.reset();
    } catch (x: any) {
      setMsg(x.message);
    }
  }

  const heroStats: HeroStat[] = s.hero_stats || [];
  const ecosystemTools: EcosystemTool[] = s.ecosystem_tools || [];
  const reelTracks: ReelTrack[] = s.reel_tracks || [];
  const processSteps: ProcessStep[] = s.process_steps || [];
  const journeyItems: JourneyItem[] = s.journey_items || [];

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'hero', label: '01 · Hero & Ticker' },
    { key: 'work', label: '02 · Selected Work & Tools' },
    { key: 'raw_reel', label: '03 · Raw-to-Real & Timeline' },
    { key: 'behind', label: '04 · Behind The Frames' },
    { key: 'journey', label: '05 · Journey & Milestones' },
    { key: 'about_contact', label: '06 · Contact, About & Security' },
  ];

  return (
    <div className="max-w-5xl space-y-8 pb-20">
      {/* Header + Sticky Save Bar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink bg-ivory/95 py-4 backdrop-blur-sm">
        <div>
          <p className="label text-ink/60">FULL WEBSITE CMS // SECTION EDITOR</p>
          <h1 className="display text-4xl">Edit Website Sections</h1>
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <span role="status" className="rounded-full bg-sun px-3.5 py-1.5 text-xs font-bold text-ink">
              {msg}
            </span>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={saveAll}
            className="btn btn-sun shadow-[4px_4px_0_#171717]"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-ink/15 pb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`label rounded-full border px-4 py-2 transition ${
              tab === t.key
                ? 'border-ink bg-ink text-sun shadow-[3px_3px_0_#F2D34F]'
                : 'border-ink/20 bg-paper/60 text-ink/75 hover:border-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 1: HERO & TICKER
         ===================================================================== */}
      {tab === 'hero' && (
        <div className="space-y-6 rounded-2xl border-2 border-ink bg-paper/50 p-6 md:p-8">
          <h2 className="font-grotesk text-2xl font-bold">Hero Section &amp; Kinetic Marquee</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Giant Display Wordmark</span>
              <input
                className="field mt-1"
                value={s.hero_wordmark || ''}
                onChange={(e) => set('hero_wordmark', e.target.value)}
                placeholder="ALTURIX"
              />
            </label>
            <label className="block">
              <span className="label">Role Pill Badge (leave empty to hide)</span>
              <input
                className="field mt-1"
                value={s.hero_badge ?? ''}
                onChange={(e) => set('hero_badge', e.target.value)}
                placeholder="EDITOR & VISUAL DESIGNER"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Hero Headline</span>
              <input
                className="field mt-1"
                value={s.hero_title}
                onChange={(e) => set('hero_title', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label">Location / Availability Line</span>
              <input
                className="field mt-1"
                value={s.hero_location ?? ''}
                onChange={(e) => set('hero_location', e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="label">Hero Intro Paragraph</span>
            <textarea
              rows={3}
              className="field mt-1"
              value={s.hero_intro}
              onChange={(e) => set('hero_intro', e.target.value)}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Portrait Image URL</span>
              <input
                className="field mt-1"
                value={s.hero_portrait_url || '/divyanshu.jpg'}
                onChange={(e) => set('hero_portrait_url', e.target.value)}
                placeholder="/divyanshu.jpg or /media/..."
              />
            </label>
            <label className="block">
              <span className="label">Right Column Studio Ethos Quote</span>
              <input
                className="field mt-1"
                value={s.hero_ethos_quote || ''}
                onChange={(e) => set('hero_ethos_quote', e.target.value)}
              />
            </label>
          </div>

          {/* Right Column Stats Editor */}
          <div className="space-y-3 border-t border-ink/15 pt-5">
            <div className="flex items-center justify-between">
              <span className="label">Hero Right-Column Stats Counters</span>
              <button
                type="button"
                className="btn text-xs"
                onClick={() =>
                  set('hero_stats', [...heroStats, { value: '10+', label: 'NEW METRIC LABEL' }])
                }
              >
                + Add Stat
              </button>
            </div>
            {heroStats.map((st, idx) => (
              <div key={idx} className="grid gap-3 sm:grid-cols-12">
                <input
                  className="field sm:col-span-3"
                  value={st.value}
                  placeholder="04."
                  onChange={(e) => {
                    const next = [...heroStats];
                    next[idx] = { ...st, value: e.target.value };
                    set('hero_stats', next);
                  }}
                />
                <input
                  className="field sm:col-span-7"
                  value={st.label}
                  placeholder="CURATED MAD EDITIONS LIVE"
                  onChange={(e) => {
                    const next = [...heroStats];
                    next[idx] = { ...st, label: e.target.value };
                    set('hero_stats', next);
                  }}
                />
                <button
                  type="button"
                  className="btn sm:col-span-2 justify-center"
                  onClick={() => set('hero_stats', heroStats.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <label className="block border-t border-ink/15 pt-5">
            <span className="label">Kinetic Ticker Words (one per line)</span>
            <textarea
              rows={4}
              className="field mt-1"
              value={(s.marquee_words || []).join('\n')}
              onChange={(e) =>
                set(
                  'marquee_words',
                  e.target.value
                    .split('\n')
                    .map((x) => x.trim())
                    .filter(Boolean)
                )
              }
            />
          </label>
        </div>
      )}

      {/* =====================================================================
          TAB 2: SELECTED WORK & TOOLS ECOSYSTEM
         ===================================================================== */}
      {tab === 'work' && (
        <div className="space-y-6 rounded-2xl border-2 border-ink bg-paper/50 p-6 md:p-8">
          <h2 className="font-grotesk text-2xl font-bold">01 // Selected Work &amp; Tools Ecosystem</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Section Heading Part 1</span>
              <input
                className="field mt-1"
                value={s.work_heading_1 || ''}
                onChange={(e) => set('work_heading_1', e.target.value)}
                placeholder="WORKS THAT"
              />
            </label>
            <label className="block">
              <span className="label">Section Heading Part 2 (Yellow Highlight)</span>
              <input
                className="field mt-1"
                value={s.work_heading_2 || ''}
                onChange={(e) => set('work_heading_2', e.target.value)}
                placeholder="SPEAK."
              />
            </label>
          </div>

          <label className="block">
            <span className="label">Tools Ecosystem Banner Title</span>
            <input
              className="field mt-1"
              value={s.ecosystem_title || ''}
              onChange={(e) => set('ecosystem_title', e.target.value)}
            />
          </label>

          <div className="space-y-3 border-t border-ink/15 pt-5">
            <div className="flex items-center justify-between">
              <span className="label">Software &amp; Creative Ecosystem Cards</span>
              <button
                type="button"
                className="btn text-xs"
                onClick={() =>
                  set('ecosystem_tools', [
                    ...ecosystemTools,
                    { code: 'C4D', name: 'Cinema 4D', sub: '3D Motion & Render' },
                  ])
                }
              >
                + Add Tool
              </button>
            </div>

            {ecosystemTools.map((tool, idx) => (
              <div key={idx} className="grid gap-3 sm:grid-cols-12">
                <input
                  className="field sm:col-span-2"
                  value={tool.code}
                  placeholder="Pr"
                  onChange={(e) => {
                    const next = [...ecosystemTools];
                    next[idx] = { ...tool, code: e.target.value };
                    set('ecosystem_tools', next);
                  }}
                />
                <input
                  className="field sm:col-span-4"
                  value={tool.name}
                  placeholder="Premiere Pro"
                  onChange={(e) => {
                    const next = [...ecosystemTools];
                    next[idx] = { ...tool, name: e.target.value };
                    set('ecosystem_tools', next);
                  }}
                />
                <input
                  className="field sm:col-span-4"
                  value={tool.sub}
                  placeholder="Narrative & Rhythm Cutting"
                  onChange={(e) => {
                    const next = [...ecosystemTools];
                    next[idx] = { ...tool, sub: e.target.value };
                    set('ecosystem_tools', next);
                  }}
                />
                <button
                  type="button"
                  className="btn sm:col-span-2 justify-center"
                  onClick={() =>
                    set(
                      'ecosystem_tools',
                      ecosystemTools.filter((_, i) => i !== idx)
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: FROM RAW TO REAL & CUTTING ROOM TIMELINE
         ===================================================================== */}
      {tab === 'raw_reel' && (
        <div className="space-y-8 rounded-2xl border-2 border-ink bg-paper/50 p-6 md:p-8">
          <div className="space-y-4">
            <h2 className="font-grotesk text-2xl font-bold">02 // From Raw To Real (Split Comparison)</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="label">Heading Line 1</span>
                <input
                  className="field mt-1"
                  value={s.raw_heading_1 || ''}
                  onChange={(e) => set('raw_heading_1', e.target.value)}
                  placeholder="FROM RAW."
                />
              </label>
              <label className="block">
                <span className="label">Heading Line 2 (Yellow Highlight)</span>
                <input
                  className="field mt-1"
                  value={s.raw_heading_2 || ''}
                  onChange={(e) => set('raw_heading_2', e.target.value)}
                  placeholder="TO REAL."
                />
              </label>
            </div>
            <label className="block">
              <span className="label">Section Description</span>
              <textarea
                rows={3}
                className="field mt-1"
                value={s.raw_description || ''}
                onChange={(e) => set('raw_description', e.target.value)}
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="label">Custom &quot;Before / Raw&quot; Image URL (optional)</span>
                <input
                  className="field mt-1"
                  value={s.raw_before_image || ''}
                  onChange={(e) => set('raw_before_image', e.target.value)}
                  placeholder="Leave blank to auto-wireframe the After image"
                />
              </label>
              <label className="block">
                <span className="label">Custom &quot;After / Real&quot; Image URL (optional)</span>
                <input
                  className="field mt-1"
                  value={s.raw_after_image || ''}
                  onChange={(e) => set('raw_after_image', e.target.value)}
                  placeholder="Leave blank to use featured project cover"
                />
              </label>
            </div>
          </div>

          <hr className="border-ink/15" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-grotesk text-2xl font-bold">03 // The Cutting Room (Interactive Timeline)</h2>
              <button
                type="button"
                className="btn text-xs"
                onClick={() =>
                  set('reel_tracks', [
                    ...reelTracks,
                    {
                      code: `V${reelTracks.length + 1} // NEW TRACK`,
                      name: 'New Editing Sequence',
                      fps: '24 FPS',
                      dur: '01:00:00',
                      tag: 'Pacing · Story · Visuals',
                    },
                  ])
                }
              >
                + Add Timeline Track
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="label">Timeline Heading Part 1</span>
                <input
                  className="field mt-1"
                  value={s.reel_heading_1 || ''}
                  onChange={(e) => set('reel_heading_1', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Timeline Heading Part 2 (Yellow Accent)</span>
                <input
                  className="field mt-1"
                  value={s.reel_heading_2 || ''}
                  onChange={(e) => set('reel_heading_2', e.target.value)}
                />
              </label>
            </div>

            <div className="space-y-4">
              {reelTracks.map((tr, idx) => (
                <div key={idx} className="space-y-3 rounded-xl border border-ink/20 bg-ivory p-4">
                  <div className="grid gap-3 sm:grid-cols-12">
                    <input
                      className="field sm:col-span-3"
                      value={tr.code}
                      placeholder="V1 // RHYTHM CUT"
                      onChange={(e) => {
                        const next = [...reelTracks];
                        next[idx] = { ...tr, code: e.target.value };
                        set('reel_tracks', next);
                      }}
                    />
                    <input
                      className="field sm:col-span-5"
                      value={tr.name}
                      placeholder="Track Title"
                      onChange={(e) => {
                        const next = [...reelTracks];
                        next[idx] = { ...tr, name: e.target.value };
                        set('reel_tracks', next);
                      }}
                    />
                    <input
                      className="field sm:col-span-2"
                      value={tr.fps}
                      placeholder="60 FPS"
                      onChange={(e) => {
                        const next = [...reelTracks];
                        next[idx] = { ...tr, fps: e.target.value };
                        set('reel_tracks', next);
                      }}
                    />
                    <input
                      className="field sm:col-span-2"
                      value={tr.dur}
                      placeholder="00:45:12"
                      onChange={(e) => {
                        const next = [...reelTracks];
                        next[idx] = { ...tr, dur: e.target.value };
                        set('reel_tracks', next);
                      }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <input
                      className="field flex-1"
                      value={tr.tag}
                      placeholder="Pacing · Hook Architecture · Sound Sync"
                      onChange={(e) => {
                        const next = [...reelTracks];
                        next[idx] = { ...tr, tag: e.target.value };
                        set('reel_tracks', next);
                      }}
                    />
                    <button
                      type="button"
                      className="btn"
                      onClick={() => set('reel_tracks', reelTracks.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: BEHIND THE FRAMES (PROCESS, CAPABILITIES & QUOTE)
         ===================================================================== */}
      {tab === 'behind' && (
        <div className="space-y-6 rounded-2xl border-2 border-ink bg-paper/50 p-6 md:p-8">
          <h2 className="font-grotesk text-2xl font-bold">04 // Behind The Frames</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Heading Line 1</span>
              <input
                className="field mt-1"
                value={s.behind_heading_1 || ''}
                onChange={(e) => set('behind_heading_1', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label">Heading Line 2 (Yellow Highlight)</span>
              <input
                className="field mt-1"
                value={s.behind_heading_2 || ''}
                onChange={(e) => set('behind_heading_2', e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="label">Section Intro Text</span>
            <textarea
              rows={2}
              className="field mt-1"
              value={s.behind_intro || ''}
              onChange={(e) => set('behind_intro', e.target.value)}
            />
          </label>

          <label className="block">
            <span className="label">Capabilities / Creative Toolkit Pills (one per line)</span>
            <textarea
              rows={5}
              className="field mt-1"
              value={s.capabilities.join('\n')}
              onChange={(e) =>
                set(
                  'capabilities',
                  e.target.value
                    .split('\n')
                    .map((x) => x.trim())
                    .filter(Boolean)
                )
              }
            />
          </label>

          {/* 5-Step Process Editor */}
          <div className="space-y-3 border-t border-ink/15 pt-5">
            <div className="flex items-center justify-between">
              <span className="label">&quot;From Idea To Final Frame&quot; Process Steps</span>
              <button
                type="button"
                className="btn text-xs"
                onClick={() =>
                  set('process_steps', [
                    ...processSteps,
                    {
                      num: String(processSteps.length + 1).padStart(2, '0'),
                      title: 'NEW STEP',
                      desc: 'Describe this step in your creative workflow.',
                    },
                  ])
                }
              >
                + Add Step
              </button>
            </div>
            {processSteps.map((st, idx) => (
              <div key={idx} className="space-y-2 rounded-xl border border-ink/20 bg-ivory p-4">
                <div className="grid gap-3 sm:grid-cols-12">
                  <input
                    className="field sm:col-span-2"
                    value={st.num}
                    onChange={(e) => {
                      const next = [...processSteps];
                      next[idx] = { ...st, num: e.target.value };
                      set('process_steps', next);
                    }}
                  />
                  <input
                    className="field sm:col-span-8"
                    value={st.title}
                    onChange={(e) => {
                      const next = [...processSteps];
                      next[idx] = { ...st, title: e.target.value };
                      set('process_steps', next);
                    }}
                  />
                  <button
                    type="button"
                    className="btn sm:col-span-2 justify-center"
                    onClick={() =>
                      set(
                        'process_steps',
                        processSteps.filter((_, i) => i !== idx)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  rows={2}
                  className="field"
                  value={st.desc}
                  onChange={(e) => {
                    const next = [...processSteps];
                    next[idx] = { ...st, desc: e.target.value };
                    set('process_steps', next);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Director Quote Card */}
          <div className="space-y-4 border-t border-ink/15 pt-5">
            <span className="label">Director&apos;s Quote Card (Right Column)</span>
            <label className="block">
              <span className="label">Quote Text</span>
              <textarea
                rows={3}
                className="field mt-1"
                value={s.director_quote || ''}
                onChange={(e) => set('director_quote', e.target.value)}
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="label">Director Name</span>
                <input
                  className="field mt-1"
                  value={s.director_name || ''}
                  onChange={(e) => set('director_name', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Director Subtitle</span>
                <input
                  className="field mt-1"
                  value={s.director_sub || ''}
                  onChange={(e) => set('director_sub', e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: THE JOURNEY & MILESTONES
         ===================================================================== */}
      {tab === 'journey' && (
        <div className="space-y-6 rounded-2xl border-2 border-ink bg-paper/50 p-6 md:p-8">
          <h2 className="font-grotesk text-2xl font-bold">05 // The Journey &amp; Milestones</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Journey Heading Part 1</span>
              <input
                className="field mt-1"
                value={s.journey_heading_1 || ''}
                onChange={(e) => set('journey_heading_1', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label">Journey Heading Part 2 (Yellow Highlight)</span>
              <input
                className="field mt-1"
                value={s.journey_heading_2 || ''}
                onChange={(e) => set('journey_heading_2', e.target.value)}
              />
            </label>
          </div>

          <div className="space-y-3 border-t border-ink/15 pt-5">
            <div className="flex items-center justify-between">
              <span className="label">Career &amp; Creative Timeline Items</span>
              <button
                type="button"
                className="btn text-xs"
                onClick={() =>
                  set('journey_items', [
                    ...journeyItems,
                    {
                      period: '2026 — PRESENT',
                      role: 'New Role / Milestone',
                      org: 'ALTURIX Studio',
                      desc: 'Describe your work and impact during this period.',
                    },
                  ])
                }
              >
                + Add Timeline Item
              </button>
            </div>

            {journeyItems.map((item, idx) => (
              <div key={idx} className="space-y-3 rounded-xl border border-ink/20 bg-ivory p-4">
                <div className="grid gap-3 sm:grid-cols-12">
                  <input
                    className="field sm:col-span-3"
                    value={item.period}
                    placeholder="2025 — PRESENT"
                    onChange={(e) => {
                      const next = [...journeyItems];
                      next[idx] = { ...item, period: e.target.value };
                      set('journey_items', next);
                    }}
                  />
                  <input
                    className="field sm:col-span-4"
                    value={item.role}
                    placeholder="Role Title"
                    onChange={(e) => {
                      const next = [...journeyItems];
                      next[idx] = { ...item, role: e.target.value };
                      set('journey_items', next);
                    }}
                  />
                  <input
                    className="field sm:col-span-3"
                    value={item.org}
                    placeholder="Organization / Series"
                    onChange={(e) => {
                      const next = [...journeyItems];
                      next[idx] = { ...item, org: e.target.value };
                      set('journey_items', next);
                    }}
                  />
                  <button
                    type="button"
                    className="btn sm:col-span-2 justify-center"
                    onClick={() =>
                      set(
                        'journey_items',
                        journeyItems.filter((_, i) => i !== idx)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  rows={2}
                  className="field"
                  value={item.desc}
                  onChange={(e) => {
                    const next = [...journeyItems];
                    next[idx] = { ...item, desc: e.target.value };
                    set('journey_items', next);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-ink/15 pt-5">
            <span className="label">Right Column Milestones Card (&quot;Little Wins. Big Meaning.&quot;)</span>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="label">Milestones Heading Line 1</span>
                <input
                  className="field mt-1"
                  value={s.milestones_heading_1 || ''}
                  onChange={(e) => set('milestones_heading_1', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Milestones Heading Line 2 (Yellow)</span>
                <input
                  className="field mt-1"
                  value={s.milestones_heading_2 || ''}
                  onChange={(e) => set('milestones_heading_2', e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="label">Milestones Description</span>
              <textarea
                rows={2}
                className="field mt-1"
                value={s.milestones_desc || ''}
                onChange={(e) => set('milestones_desc', e.target.value)}
              />
            </label>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: CONTACT CTA, ABOUT PAGE & PASSWORD
         ===================================================================== */}
      {tab === 'about_contact' && (
        <div className="space-y-8 rounded-2xl border-2 border-ink bg-paper/50 p-6 md:p-8">
          <div className="space-y-4">
            <h2 className="font-grotesk text-2xl font-bold">07 // Closing Contact CTA &amp; About Page</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="label">Closing Heading Line 1</span>
                <input
                  className="field mt-1"
                  value={s.cta_heading_1 || ''}
                  onChange={(e) => set('cta_heading_1', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Closing Heading Line 2 (Yellow)</span>
                <input
                  className="field mt-1"
                  value={s.cta_heading_2 || ''}
                  onChange={(e) => set('cta_heading_2', e.target.value)}
                />
              </label>
            </div>

            <label className="block">
              <span className="label">Closing CTA Intro Paragraph</span>
              <textarea
                rows={2}
                className="field mt-1"
                value={s.cta_intro || ''}
                onChange={(e) => set('cta_intro', e.target.value)}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="label">Right Card Title 1</span>
                <input
                  className="field mt-1"
                  value={s.cta_card_title_1 || ''}
                  onChange={(e) => set('cta_card_title_1', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Right Card Title 2</span>
                <input
                  className="field mt-1"
                  value={s.cta_card_title_2 || ''}
                  onChange={(e) => set('cta_card_title_2', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Right Card Subtitle</span>
                <input
                  className="field mt-1"
                  value={s.cta_card_sub || ''}
                  onChange={(e) => set('cta_card_sub', e.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="label">Email Address</span>
                <input
                  type="email"
                  className="field mt-1"
                  value={s.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Instagram (Handle or URL)</span>
                <input
                  className="field mt-1"
                  value={s.instagram}
                  onChange={(e) => set('instagram', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Based In / Location</span>
                <input
                  className="field mt-1"
                  value={s.location_text || ''}
                  onChange={(e) => set('location_text', e.target.value)}
                />
              </label>
            </div>

            <label className="block">
              <span className="label">About Page Bio Text</span>
              <textarea
                rows={7}
                className="field mt-1"
                value={s.about}
                onChange={(e) => set('about', e.target.value)}
              />
            </label>
          </div>

          <hr className="border-ink/15" />

          <div className="max-w-md space-y-3">
            <h2 className="font-grotesk text-2xl font-bold">Change Admin Password</h2>
            <form onSubmit={pw} className="space-y-3">
              <input
                name="current"
                type="password"
                placeholder="Current password"
                required
                className="field"
              />
              <input
                name="next"
                type="password"
                minLength={10}
                placeholder="New password (10+ chars)"
                required
                className="field"
              />
              <button className="btn">Change password</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
