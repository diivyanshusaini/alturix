import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, uploadFiles } from '../api';
import { extractPdfSlides } from '../components/pdfCarousel';
import { Cover } from '../components/shared';
import {
  CONTRIB_LABEL,
  type Asset,
  type CaseStudy,
  type Contribution,
  type Folder,
  type Project,
  type Section,
} from '../types';

const FIELDS: [keyof CaseStudy, string, string][] = [
  ['brief', 'Brief', 'What was the problem or request? (Write only what you know.)'],
  ['objective', 'Objective', 'What was the work meant to achieve?'],
  ['direction', 'Creative direction', 'The overall visual / editorial approach.'],
  ['research', 'Research & references', 'Inspiration, moodboards, references.'],
  ['concept', 'Concept & thought process', 'Why were the creative decisions made?'],
  ['typography', 'Typography & colour', 'Fonts, palette and the reasoning.'],
  ['execution', 'Execution', 'How it was made, iterations, challenges.'],
  ['output', 'Final output (Text Only)', 'Written summary of final outcomes or deliverables (does not duplicate videos).'],
  ['contribution', 'Personal contribution', 'Exactly what you did on this project.'],
];

export default function ProjectEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState<Project | null>(null);
  const [lib, setLib] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [libFolder, setLibFolder] = useState<number | 'all'>('all');
  const [picker, setPicker] = useState(false);
  const [coverPicker, setCoverPicker] = useState(false);
  const [msg, setMsg] = useState('');
  const [dirty, setDirty] = useState(false);
  const [extracting, setExtracting] = useState('');
  const [uploadProg, setUploadProg] = useState<number | null>(null);

  const directMediaInput = useRef<HTMLInputElement>(null);
  const customCoverInput = useRef<HTMLInputElement>(null);

  const loadAll = async () => {
    const [proj, assets, flds] = await Promise.all([
      api<Project>('GET', `/api/admin/projects/${id}`),
      api<Asset[]>('GET', '/api/admin/assets'),
      api<Folder[]>('GET', '/api/admin/folders'),
    ]);
    setP(proj);
    setLib(assets);
    setFolders(flds);
  };

  useEffect(() => {
    loadAll();
    /* eslint-disable-next-line */
  }, [id]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!p) return null;

  const upd = (d: Partial<Project>) => {
    setP((prev) => (prev ? { ...prev, ...d } : prev));
    setDirty(true);
  };
  const updCS = (k: keyof CaseStudy, v: string) =>
    upd({ case_study: { ...p.case_study, [k]: v } });

  async function save(customProject?: Project) {
    const target = customProject || p!;
    const firstAsset = target.assets[0];
    const autoCoverId =
      target.cover_asset_id || firstAsset?.poster_asset_id || firstAsset?.id || null;
    const body = {
      ...target,
      cover_asset_id: autoCoverId,
      // All items in the collection use unified 'gallery' role so nothing is ever duplicated into a separate 'Final output' section
      assets: target.assets.map((a) => ({
        id: a.id,
        role: 'gallery',
        caption: a.caption || '',
      })),
    };
    const r = await api<Project>('PUT', `/api/admin/projects/${target.id}`, body);
    setP(r);
    setDirty(false);
    setMsg('✓ Project collection saved.');
    return r;
  }

  async function status(s: string) {
    try {
      await save();
      const r = await api<Project>('POST', `/api/admin/projects/${p!.id}/status`, {
        status: s,
      });
      setP(r);
      setMsg(
        s === 'published'
          ? '✓ Approved & Published live on the site!'
          : `Status changed to: ${s}`
      );
    } catch (e: any) {
      setMsg('Cannot change status: ' + e.message);
    }
  }

  /** Upload multiple videos/images directly into this project's collection */
  async function handleDirectUploadToProject(files: File[]) {
    if (!files.length) return;
    setUploadProg(0);
    setMsg(`Uploading ${files.length} file(s) to ${p!.title}…`);
    try {
      const uploaded = await uploadFiles(files, null, setUploadProg);
      const existingIds = new Set(p!.assets.map((x) => x.id));
      const newItems = uploaded
        .filter((u) => !existingIds.has(u.id))
        .map((u) => ({ ...u, role: 'gallery' as const, caption: '' }));
      const nextAssets = [...p!.assets, ...newItems];
      const nextCoverId =
        p!.cover_asset_id ||
        uploaded[0]?.poster_asset_id ||
        uploaded[0]?.id ||
        null;
      const nextProj: Project = {
        ...p!,
        assets: nextAssets,
        cover_asset_id: nextCoverId,
        cover: p!.cover || uploaded[0] || null,
      };
      setP(nextProj);
      await save(nextProj);
      setLib(await api<Asset[]>('GET', '/api/admin/assets'));
      setMsg(`✓ Uploaded & added ${newItems.length} file(s) to the project collection!`);
    } catch (e: any) {
      setMsg('Upload failed: ' + e.message);
    } finally {
      setUploadProg(null);
    }
  }

  /** Upload a dedicated custom cover image for this project */
  async function handleCustomCoverUpload(file?: File) {
    if (!file) return;
    setUploadProg(0);
    try {
      const [uploaded] = await uploadFiles([file], null, setUploadProg);
      if (uploaded) {
        const nextProj: Project = {
          ...p!,
          cover_asset_id: uploaded.id,
          cover: uploaded,
        };
        setP(nextProj);
        await save(nextProj);
        setLib(await api<Asset[]>('GET', '/api/admin/assets'));
        setMsg('✓ Custom project cover updated & saved!');
      }
    } catch (e: any) {
      setMsg('Cover upload failed: ' + e.message);
    } finally {
      setUploadProg(null);
    }
  }

  /** Extract all pages from an attached PDF asset and add them as carousel slides to this project. */
  async function expandPdfToSlides(pdfAsset: Asset) {
    try {
      setExtracting(`Extracting slides from ${pdfAsset.title || pdfAsset.original_name}…`);
      const base = (pdfAsset.title || pdfAsset.original_name).replace(/\.pdf$/i, '');
      const files = await extractPdfSlides(pdfAsset.url, base, setExtracting);
      setExtracting(`Uploading ${files.length} slides…`);
      const uploaded = await uploadFiles(files, pdfAsset.folder_id, () => {});
      const newAssets: Asset[] = [
        ...uploaded.map((u, idx) => ({
          ...u,
          role: 'gallery' as const,
          caption: `Slide ${String(idx + 1).padStart(2, '0')} of ${uploaded.length}`,
        })),
        ...p!.assets,
      ];
      upd({
        assets: newAssets,
        cover_asset_id: p!.cover_asset_id || uploaded[0]?.id || pdfAsset.id,
        cover: p!.cover || uploaded[0] || pdfAsset,
        category: p!.category || 'Carousel',
      });
      setLib(await api<Asset[]>('GET', '/api/admin/assets'));
      setExtracting('');
      setMsg(`Extracted ${uploaded.length} carousel slides from PDF! Click Save or Approve & Publish.`);
    } catch (e: any) {
      setExtracting('');
      setMsg('Could not extract PDF slides: ' + e.message);
    }
  }

  const addAsset = (a: Asset) => {
    if (p.assets.some((x) => x.id === a.id)) return;
    const nextAssets = [
      ...p.assets,
      { ...a, role: 'gallery' as const, caption: '' },
    ];
    upd({
      assets: nextAssets,
      cover_asset_id: p.cover_asset_id || a.poster_asset_id || a.id,
      cover: p.cover || a,
    });
  };

  const addMultipleAssets = (items: Asset[]) => {
    const existing = new Set(p.assets.map((x) => x.id));
    const toAdd = items
      .filter((a) => !existing.has(a.id))
      .map((a) => ({ ...a, role: 'gallery' as const, caption: '' }));
    if (!toAdd.length) return;
    const nextAssets = [...p.assets, ...toAdd];
    upd({
      assets: nextAssets,
      cover_asset_id: p.cover_asset_id || toAdd[0]?.poster_asset_id || toAdd[0]?.id || null,
      cover: p.cover || toAdd[0] || null,
    });
  };

  const setAsset = (i: number, d: Partial<Asset>) =>
    upd({ assets: p.assets.map((a, k) => (k === i ? { ...a, ...d } : a)) });

  const updateAssetTitleInDb = async (assetId: number, newTitle: string) => {
    try {
      await api('PATCH', `/api/admin/assets/${assetId}`, { title: newTitle });
    } catch {}
  };

  const moveAsset = (i: number, dir: number) => {
    const a = [...p.assets];
    const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    upd({ assets: a });
  };

  const filteredLib = lib.filter(
    (a) =>
      !a.original_name.startsWith('poster-') &&
      (libFolder === 'all' || a.folder_id === libFolder)
  );

  const currentCoverAsset =
    (p.cover_asset_id
      ? p.assets.find((a) => a.id === p.cover_asset_id) ||
        lib.find((a) => a.id === p.cover_asset_id) ||
        p.cover
      : p.cover || p.assets[0]) || null;

  return (
    <div className="space-y-10 pb-20">
      {/* Top Action Bar */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center gap-3 border-b border-ink/15 bg-ivory/95 py-3 backdrop-blur">
        <Link to="/admin/projects" className="label underline">
          ← Projects
        </Link>
        <span className="label rounded-full bg-paper px-3 py-1">{p.status}</span>
        <span className="label rounded-full bg-sun/60 px-3 py-1 text-ink">
          {p.assets.length} {p.assets.length === 1 ? 'file' : 'files'} in collection
        </span>
        <span className="ml-auto flex flex-wrap gap-2">
          <button className="btn" onClick={() => save()}>
            Save project
          </button>
          {p.status !== 'published' ? (
            <button className="btn btn-sun" onClick={() => status('published')}>
              ✓ Approve &amp; publish now
            </button>
          ) : (
            <>
              <Link to={`/work/${p.slug}`} target="_blank" className="btn btn-sun">
                View live page ↗
              </Link>
              <button className="btn" onClick={() => status('unpublished')}>
                Unpublish
              </button>
            </>
          )}
          <button
            className="btn"
            onClick={async () => {
              if (confirm('Delete project? Uploaded files are kept in the library.')) {
                await api('DELETE', `/api/admin/projects/${p.id}`);
                nav('/admin/projects');
              }
            }}
          >
            Delete
          </button>
        </span>
      </div>

      {msg && (
        <p role="status" className="rounded-lg border border-ink/20 bg-sun/45 px-4 py-2.5 text-sm font-medium">
          {msg}
          {dirty && ' (click Save project to persist changes)'}
        </p>
      )}
      {extracting && <p className="label rounded-lg bg-sun px-4 py-3 text-ink">{extracting}</p>}

      {/* =====================================================================
          1. CENTRAL PROJECT MEDIA COLLECTION (ONE LIST, NO DUPLICATION)
         ===================================================================== */}
      <section className="rounded-2xl border-2 border-ink bg-paper/55 p-6 shadow-[6px_6px_0_#171717]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-4">
          <div>
            <p className="label text-ink/60">CENTRAL PROJECT GALLERY // NO DUPLICATES</p>
            <h2 className="font-grotesk text-2xl font-bold">
              The Video / Media Collection ({p.assets.length} attached)
            </h2>
            <p className="mt-1 text-xs text-ink/65">
              Every uploaded video or slide here appears once in &ldquo;THE VIDEO COLLECTION&rdquo; on this project&apos;s page. Reorder with ↑/↓ and edit titles or captions directly below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => directMediaInput.current?.click()}
              className="btn btn-sun shadow-[3px_3px_0_#171717]"
            >
              + Upload Videos / Files Directly
            </button>
            <input
              ref={directMediaInput}
              type="file"
              multiple
              accept="video/*,image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                handleDirectUploadToProject([...(e.target.files || [])]);
                e.target.value = '';
              }}
            />
            <button type="button" className="btn bg-ivory" onClick={() => setPicker(true)}>
              + Add from Library
            </button>
          </div>
        </div>

        {uploadProg !== null && (
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/15">
              <div
                className="h-full bg-sun transition-all"
                style={{ width: `${Math.round(uploadProg * 100)}%` }}
              />
            </div>
            <p className="label mt-1 text-ink/70">Uploading… {Math.round(uploadProg * 100)}%</p>
          </div>
        )}

        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {p.assets.map((a, i) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 rounded-xl border border-ink/25 bg-ivory p-4 shadow-[3px_3px_0_#171717] sm:flex-row"
            >
              {/* Thumbnail Preview */}
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-ink bg-ink sm:w-44">
                <Cover asset={a} className="h-full w-full" />
                <span className="label absolute left-2 top-2 rounded bg-sun px-2 py-0.5 text-[10px] font-bold text-ink">
                  #{String(i + 1).padStart(2, '0')} · {a.kind}
                </span>
              </div>

              {/* Title, Caption & Reorder Controls */}
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <span className="label text-[9px] text-ink/55">VIDEO / ITEM TITLE</span>
                  <input
                    aria-label="Title"
                    placeholder="Video title (e.g. Edit 01 — Midnight Drive)"
                    className="field !py-1.5 font-grotesk font-bold"
                    value={a.title || ''}
                    onChange={(e) => setAsset(i, { title: e.target.value })}
                    onBlur={(e) => updateAssetTitleInDb(a.id, e.target.value)}
                  />
                </div>

                <div>
                  <span className="label text-[9px] text-ink/55">OPTIONAL CAPTION</span>
                  <input
                    aria-label="Caption"
                    placeholder="Optional caption or soundtrack credit…"
                    className="field !py-1.5 text-xs"
                    value={a.caption || ''}
                    onChange={(e) => setAsset(i, { caption: e.target.value })}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {a.kind === 'pdf' && (
                    <button
                      type="button"
                      disabled={!!extracting}
                      onClick={() => expandPdfToSlides(a)}
                      className="btn btn-sun !px-2.5 !py-1 !text-xs"
                    >
                      ▤ Extract PDF Pages
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn !px-2.5 !py-1 !text-xs"
                    onClick={() => moveAsset(i, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                  >
                    ↑ Earlier
                  </button>
                  <button
                    type="button"
                    className="btn !px-2.5 !py-1 !text-xs"
                    onClick={() => moveAsset(i, 1)}
                    disabled={i === p.assets.length - 1}
                    aria-label="Move later"
                  >
                    ↓ Later
                  </button>
                  <button
                    type="button"
                    className="btn !px-2.5 !py-1 !text-xs"
                    onClick={() =>
                      upd({
                        cover_asset_id: a.poster_asset_id || a.id,
                        cover: a,
                      })
                    }
                  >
                    ★ Use as Cover
                  </button>
                  <button
                    type="button"
                    className="btn !px-2.5 !py-1 !text-xs text-red-700 hover:bg-red-700 hover:text-ivory"
                    onClick={() =>
                      upd({
                        assets: p.assets.filter((_, k) => k !== i),
                        ...(p.cover_asset_id === a.id
                          ? { cover_asset_id: null, cover: null }
                          : {}),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {!p.assets.length && (
          <div className="mt-4 rounded-xl border border-dashed border-ink/30 p-8 text-center">
            <p className="font-grotesk text-lg font-bold">No videos or files in this project yet.</p>
            <p className="mt-1 text-sm text-ink/60">
              Click &ldquo;+ Upload Videos / Files Directly&rdquo; to upload all 10 videos at once, or &ldquo;+ Add from Library&rdquo;.
            </p>
          </div>
        )}
      </section>

      {/* =====================================================================
          2. PROJECT DETAILS, DEDICATED COVER SELECTION & CASE STUDY TEXT
         ===================================================================== */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <label className="block">
            <span className="label">Project Title</span>
            <input
              className="field mt-1 font-grotesk !text-2xl font-bold"
              value={p.title}
              onChange={(e) => upd({ title: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="label">Short Description / Summary (shown on project card &amp; top of page)</span>
            <textarea
              rows={3}
              className="field mt-1"
              value={p.summary}
              onChange={(e) => upd({ summary: e.target.value })}
            />
          </label>

          <h2 className="pt-4 font-grotesk text-2xl font-bold">Case Study &amp; Written Notes (Optional)</h2>
          <p className="text-sm text-ink/60">
            Leave any field empty if not needed — empty fields are hidden on the public page. Written fields never duplicate uploaded videos.
          </p>
          {FIELDS.map(([k, label, hint]) => (
            <label key={k} className="block">
              <span className="label">{label}</span>
              <textarea
                rows={3}
                placeholder={hint}
                className="field mt-1"
                value={p.case_study[k] || ''}
                onChange={(e) => updCS(k, e.target.value)}
              />
            </label>
          ))}
        </div>

        {/* Right Sidebar: Dedicated Cover Selection & Project Metadata */}
        <aside className="space-y-6">
          {/* Dedicated Project Cover Selection */}
          <div className="rounded-2xl border-2 border-ink bg-white/70 p-5 shadow-[4px_4px_0_#171717]">
            <span className="label text-ink">DEDICATED PROJECT COVER THUMBNAIL</span>
            <p className="mt-1 text-xs text-ink/60">
              Represents the entire collection on the portfolio card and top hero banner.
            </p>
            <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-ink bg-paper">
              <Cover asset={currentCoverAsset} className="h-full w-full" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => customCoverInput.current?.click()}
                className="btn btn-sun w-full justify-center !py-2 text-xs"
              >
                + Upload Custom Cover Image
              </button>
              <input
                ref={customCoverInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleCustomCoverUpload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => setCoverPicker(true)}
                className="btn w-full justify-center !py-1.5 text-xs"
              >
                Choose Cover from Library
              </button>
            </div>

            {p.assets.length > 0 && (
              <div className="mt-4 border-t border-ink/15 pt-3">
                <span className="label text-[10px] text-ink/55">OR PICK FROM ATTACHED ITEMS:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.assets.map((a, idx) => {
                    const targetCoverId = a.poster_asset_id || a.id;
                    const isSelected =
                      p.cover_asset_id === a.id || p.cover_asset_id === a.poster_asset_id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => upd({ cover_asset_id: targetCoverId, cover: a })}
                        aria-label={`Use item ${idx + 1} as cover`}
                        className={`relative h-12 w-16 overflow-hidden rounded border ${
                          isSelected
                            ? 'border-2 border-ink ring-2 ring-sun'
                            : 'border-ink/20 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <Cover asset={a} className="h-full w-full" />
                        <span className="label absolute bottom-0 right-0 bg-ink/80 px-1 text-[8px] text-ivory">
                          #{idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Metadata Fields */}
          <div className="space-y-3 rounded-2xl border border-ink/20 bg-white/50 p-5">
            <label className="block">
              <span className="label">Portfolio Section</span>
              <select
                className="field mt-1"
                value={p.section}
                onChange={(e) => upd({ section: e.target.value as Section })}
              >
                <option value="video">Video Editing</option>
                <option value="graphic">Graphic Design</option>
                <option value="experiment">Experiments</option>
              </select>
            </label>
            <label className="block">
              <span className="label">Contribution Label</span>
              <select
                className="field mt-1"
                value={p.contribution}
                onChange={(e) => upd({ contribution: e.target.value as Contribution })}
              >
                {(Object.keys(CONTRIB_LABEL) as Contribution[]).map((c) => (
                  <option key={c} value={c}>
                    {CONTRIB_LABEL[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Category</span>
              <input
                className="field mt-1"
                placeholder="Cinematic Video Editing, Carousel, Poster…"
                value={p.category}
                onChange={(e) => upd({ category: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">Project Type</span>
              <input
                className="field mt-1"
                placeholder="YouTube Video Collection, Promo…"
                value={p.project_type}
                onChange={(e) => upd({ project_type: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">Year</span>
              <input
                className="field mt-1"
                value={p.year}
                onChange={(e) => upd({ year: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">Tools (comma separated)</span>
              <input
                className="field mt-1"
                value={p.tools.join(', ')}
                onChange={(e) =>
                  upd({
                    tools: e.target.value
                      .split(',')
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <label className="block">
              <span className="label">Credits &amp; Channel</span>
              <textarea
                rows={2}
                className="field mt-1"
                value={p.credits}
                onChange={(e) => upd({ credits: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">URL Slug</span>
              <input
                className="field mt-1"
                value={p.slug}
                onChange={(e) => upd({ slug: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={p.featured}
                onChange={(e) => upd({ featured: e.target.checked })}
              />
              <span className="label">Feature (shown first on portfolio)</span>
            </label>
          </div>
        </aside>
      </div>

      {/* Modal: Add Videos / Media from Upload Library */}
      {picker && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-2xl border-2 border-ink bg-ivory p-6 shadow-[8px_8px_0_#171717]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-4">
              <h3 className="font-grotesk text-2xl font-bold">
                Add to Collection from Library
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter folder"
                  className="field !w-auto !py-1.5 text-xs"
                  value={String(libFolder)}
                  onChange={(e) =>
                    setLibFolder(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                >
                  <option value="all">All folders</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-sun !py-1.5 text-xs"
                  onClick={() => addMultipleAssets(filteredLib)}
                >
                  + Add All Shown ({filteredLib.length})
                </button>
                <button className="btn !py-1.5" onClick={() => setPicker(false)}>
                  Done
                </button>
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {filteredLib.map((a) => {
                const on = p.assets.some((x) => x.id === a.id);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      disabled={on}
                      onClick={() => addAsset(a)}
                      className="block w-full text-left disabled:opacity-40"
                    >
                      <div className="relative aspect-video overflow-hidden rounded-lg border border-ink/20 bg-paper">
                        <Cover asset={a} className="h-full w-full" />
                        <span className="label absolute left-1.5 top-1.5 rounded bg-ivory px-1.5 py-0.5 text-[9px]">
                          {a.kind}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-medium">
                        {on ? '✓ Added · ' : ''}
                        {a.title || a.original_name}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Modal: Choose Dedicated Cover Image from Library */}
      {coverPicker && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-2xl border-2 border-ink bg-ivory p-6 shadow-[8px_8px_0_#171717]">
            <div className="flex items-center justify-between border-b border-ink/15 pb-4">
              <h3 className="font-grotesk text-2xl font-bold">Select Project Cover Thumbnail</h3>
              <button className="btn !py-1.5" onClick={() => setCoverPicker(false)}>
                Close
              </button>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {lib
                .filter((a) => a.kind === 'image')
                .map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        upd({ cover_asset_id: a.id, cover: a });
                        setCoverPicker(false);
                      }}
                      className="block w-full text-left"
                    >
                      <div className="relative aspect-video overflow-hidden rounded-lg border border-ink/20 bg-paper">
                        <Cover asset={a} className="h-full w-full" />
                      </div>
                      <p className="mt-1 truncate text-xs font-medium">
                        {a.title || a.original_name}
                      </p>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
