import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtSize, uploadFiles } from '../api';
import { extractPdfSlides, PdfInlineCarousel } from '../components/pdfCarousel';
import { Cover } from '../components/shared';
import type { Asset, Folder } from '../types';

/** Capture the current frame of a video as a JPEG and store it as a poster asset. */
async function captureFrame(video: HTMLVideoElement): Promise<File> {
  const c = document.createElement('canvas');
  const w = Math.min(1280, video.videoWidth);
  c.width = w;
  c.height = Math.round((video.videoHeight / video.videoWidth) * w);
  c.getContext('2d')!.drawImage(video, 0, 0, c.width, c.height);
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.88));
  return new File([blob], `poster-${Date.now()}.jpg`, { type: 'image/jpeg' });
}

export default function Library() {
  const nav = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folder, setFolder] = useState<number | 'all' | 'none'>('all');
  const [kind, setKind] = useState('all');
  const [sel, setSel] = useState<Asset | null>(null);
  const [prog, setProg] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [busyPdf, setBusyPdf] = useState('');
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setAssets(await api('GET', '/api/admin/assets'));
    setFolders(await api('GET', '/api/admin/folders'));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function upload(files: File[]) {
    if (!files.length) return;
    setProg(0);
    setMsg('');
    try {
      const out = await uploadFiles(files, typeof folder === 'number' ? folder : null, setProg);
      setMsg(`${out.length} file(s) uploaded.${out.length < files.length ? ' Unsupported types were skipped.' : ''}`);
      await load();
      if (out.length === 1) setSel(out[0]);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setProg(null);
    }
  }

  const shown = assets.filter(
    (a) =>
      (kind === 'all' || a.kind === kind) &&
      (folder === 'all' || (folder === 'none' ? !a.folder_id : a.folder_id === folder)) &&
      !a.original_name.startsWith('poster-')
  );

  const patch = async (a: Asset, d: Partial<Asset>) => {
    const u = await api<Asset>('PATCH', `/api/admin/assets/${a.id}`, d);
    setAssets((s) => s.map((x) => (x.id === a.id ? { ...x, ...u } : x)));
    setSel((s) => (s && s.id === a.id ? { ...s, ...u } : s));
  };

  /** Create a project from any asset (Image, Video, or PDF). */
  async function createProject(a: Asset) {
    const title = a.title || a.original_name.replace(/\.[^.]+$/, '') || 'New Project';
    const p = await api<any>('POST', '/api/admin/projects', {
      title,
      section: a.kind === 'video' ? 'video' : 'graphic',
    });
    const coverId = a.poster_asset_id || a.id;
    await api('PUT', `/api/admin/projects/${p.id}`, {
      category: a.category || (a.kind === 'pdf' ? 'Carousel' : a.kind === 'video' ? 'Video Edit' : 'Graphic Design'),
      summary: a.description || `${title} — curated ${a.kind === 'pdf' ? 'carousel' : a.kind} project.`,
      assets: [{ id: a.id, role: 'gallery', caption: '' }],
      cover_asset_id: coverId,
    });
    nav(`/admin/projects/${p.id}`);
  }

  /** Create a complete Video/Media Collection project from all shown files in the current folder! */
  async function createCollectionFromFolder() {
    if (!shown.length) return;
    const fObj = folders.find((f) => f.id === folder);
    const title = fObj ? fObj.name.toUpperCase() : 'NEW VIDEO COLLECTION';
    const hasVid = shown.some((a) => a.kind === 'video');
    const p = await api<any>('POST', '/api/admin/projects', {
      title,
      section: hasVid ? 'video' : 'graphic',
    });
    const first = shown[0];
    const coverId = first.poster_asset_id || first.id;
    await api('PUT', `/api/admin/projects/${p.id}`, {
      category: hasVid ? 'Cinematic Video Editing' : 'Visual Collection',
      project_type: hasVid ? 'Video Collection' : 'Gallery',
      summary: 'A collection of cinematic and music-driven edits created for my personal YouTube channel.',
      cover_asset_id: coverId,
      assets: shown.map((a) => ({
        id: a.id,
        role: 'gallery',
        caption: a.description || '',
      })),
    });
    nav(`/admin/projects/${p.id}`);
  }

  /** Extract all pages of a PDF into individual carousel slide images and create a ready-to-publish Carousel Project! */
  async function createCarouselFromPdf(a: Asset) {
    try {
      setBusyPdf('Starting PDF slide extraction…');
      const base = (a.title || a.original_name).replace(/\.pdf$/i, '');
      const slideFiles = await extractPdfSlides(a.url, base, setBusyPdf);
      setBusyPdf(`Uploading ${slideFiles.length} slides…`);
      const uploadedSlides = await uploadFiles(slideFiles, a.folder_id, () => {});
      if (uploadedSlides[0] && !a.poster_asset_id) {
        await patch(a, { poster_asset_id: uploadedSlides[0].id });
      }
      const p = await api<any>('POST', '/api/admin/projects', {
        title: base,
        section: 'graphic',
      });
      const projectAssets = [
        ...uploadedSlides.map((s, idx) => ({
          id: s.id,
          role: idx === 0 ? 'final' : 'gallery',
          caption: `Slide ${String(idx + 1).padStart(2, '0')} of ${uploadedSlides.length}`,
        })),
        { id: a.id, role: 'final', caption: 'Full Carousel PDF' },
      ];
      await api('PUT', `/api/admin/projects/${p.id}`, {
        category: a.category || 'Educational Carousel',
        project_type: `${uploadedSlides.length}-Slide Carousel`,
        summary: a.description || `${base} — ${uploadedSlides.length}-slide visual carousel.`,
        cover_asset_id: uploadedSlides[0]?.id || a.id,
        assets: projectAssets,
      });
      setBusyPdf('');
      nav(`/admin/projects/${p.id}`);
    } catch (e: any) {
      setBusyPdf('');
      alert('Could not extract slides: ' + e.message);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div>
        <h1 className="display text-5xl">Upload library</h1>
        <p className="mt-2 text-sm text-ink/60">
          Upload videos, images, or multi-page PDF carousels. You can create and approve projects directly from PDFs, images, or videos.
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            upload([...e.dataTransfer.files]);
          }}
          className={`mt-6 rounded-2xl border-2 border-dashed p-10 text-center transition ${
            drag ? 'border-ink bg-sun/40' : 'border-ink/30'
          }`}
        >
          <p className="font-grotesk text-xl">Drop videos, images or PDF carousels here</p>
          <button className="btn btn-sun mt-4" onClick={() => input.current?.click()}>
            Choose files
          </button>
          <input
            ref={input}
            type="file"
            multiple
            accept="video/*,image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              upload([...(e.target.files || [])]);
              e.target.value = '';
            }}
          />
          {prog !== null && (
            <div className="mx-auto mt-4 h-2 max-w-sm overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={Math.round(prog * 100)}>
              <div className="h-full bg-ink transition-all" style={{ width: `${prog * 100}%` }} />
            </div>
          )}
          {msg && (
            <p className="mt-3 text-sm" role="status">
              {msg}
            </p>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {(['all', 'video', 'image', 'pdf'] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`btn !py-1 ${kind === k ? 'bg-ink text-ivory' : ''}`}>
              {k}
            </button>
          ))}
          <span className="mx-2 h-5 w-px bg-ink/20" />
          <select
            aria-label="Folder"
            className="field !w-auto"
            value={String(folder)}
            onChange={(e) => setFolder(e.target.value === 'all' || e.target.value === 'none' ? e.target.value : Number(e.target.value))}
          >
            <option value="all">All folders</option>
            <option value="none">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            className="btn !py-1"
            onClick={async () => {
              const n = prompt('Folder name');
              if (n) {
                await api('POST', '/api/admin/folders', { name: n });
                load();
              }
            }}
          >
            + Folder
          </button>
          {typeof folder === 'number' && (
            <>
              <button
                className="btn btn-sun !py-1"
                onClick={createCollectionFromFolder}
              >
                + Create Collection Project from Folder ({shown.length})
              </button>
              <button
                className="btn !py-1"
                onClick={async () => {
                  if (confirm('Delete this folder? Files are kept.')) {
                    await api('DELETE', `/api/admin/folders/${folder}`);
                    setFolder('all');
                    load();
                  }
                }}
              >
                Delete folder
              </button>
            </>
          )}
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => setSel(a)}
                className={`block w-full text-left ${sel?.id === a.id ? 'outline outline-2 outline-offset-2 outline-ink' : ''}`}
              >
                <div className="relative aspect-square overflow-hidden bg-paper">
                  <Cover asset={a} className="h-full w-full" />
                  <span className="label absolute left-2 top-2 bg-ivory px-2 py-0.5">{a.kind}</span>
                  {a.used_in ? <span className="label absolute right-2 top-2 bg-sun px-2 py-0.5">in project</span> : null}
                </div>
                <p className="mt-1.5 truncate text-sm font-medium">{a.title || a.original_name}</p>
                <p className="label text-ink/50">{fmtSize(a.size)}</p>
              </button>
            </li>
          ))}
        </ul>
        {shown.length === 0 && <p className="mt-10 text-center text-ink/50">Nothing here yet.</p>}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Asset details">
        {sel ? (
          <div className="space-y-3 border border-ink/15 bg-white/50 p-4">
            {sel.kind === 'video' ? (
              <VideoPoster
                key={sel.id}
                a={sel}
                onPoster={async (f) => {
                  const [p] = await uploadFiles([f], null, () => {});
                  await patch(sel, { poster_asset_id: p.id });
                }}
              />
            ) : sel.kind === 'image' ? (
              <img src={sel.url} alt={sel.title} className="w-full" />
            ) : (
              <div className="space-y-2">
                <PdfInlineCarousel url={sel.url} title={sel.title} />
              </div>
            )}
            <label className="block">
              <span className="label">Title</span>
              <input className="field mt-1" defaultValue={sel.title} key={sel.id + 't'} onBlur={(e) => patch(sel, { title: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Description</span>
              <textarea
                rows={3}
                className="field mt-1"
                defaultValue={sel.description}
                key={sel.id + 'd'}
                onBlur={(e) => patch(sel, { description: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">Category</span>
              <input
                className="field mt-1"
                placeholder="Reel, Carousel, Poster, Thumbnail…"
                defaultValue={sel.category}
                key={sel.id + 'c'}
                onBlur={(e) => patch(sel, { category: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">Folder</span>
              <select
                className="field mt-1"
                value={sel.folder_id ?? ''}
                onChange={(e) => patch(sel, { folder_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">No folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="label text-ink/50">
              {sel.original_name} · {fmtSize(sel.size)}
            </p>
            {busyPdf && <p className="label rounded bg-sun px-3 py-2 text-ink">{busyPdf}</p>}
            <div className="flex flex-wrap gap-2">
              {sel.kind === 'pdf' && (
                <button disabled={!!busyPdf} className="btn btn-sun w-full justify-center" onClick={() => createCarouselFromPdf(sel)}>
                  ▤ Create Carousel Project (Extract All Slides)
                </button>
              )}
              <button disabled={!!busyPdf} className={`btn ${sel.kind === 'pdf' ? '' : 'btn-sun'}`} onClick={() => createProject(sel)}>
                {sel.kind === 'pdf' ? 'Create Project (PDF Direct)' : 'Create project from this'}
              </button>
              <button
                className="btn"
                onClick={async () => {
                  if (!confirm('Delete this file permanently?')) return;
                  try {
                    await api('DELETE', `/api/admin/assets/${sel.id}`);
                    setSel(null);
                    load();
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <p className="border border-dashed border-ink/25 p-6 text-sm text-ink/50">Select a file to preview and edit it.</p>
        )}
      </aside>
    </div>
  );
}

function VideoPoster({ a, onPoster }: { a: Asset; onPoster: (f: File) => Promise<void> }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div>
      <video ref={ref} src={a.url} poster={a.poster_url || undefined} controls preload="metadata" className="w-full bg-ink" />
      <p className="label mt-2 text-ink/50">Scrub to the best frame, then:</p>
      <button
        disabled={busy}
        className="btn mt-1 !py-1.5"
        onClick={async () => {
          try {
            setBusy(true);
            setErr('');
            await onPoster(await captureFrame(ref.current!));
          } catch {
            setErr('Could not capture this frame (format may not be decodable in the browser).');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Saving…' : 'Use this frame as thumbnail'}
      </button>
      {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
    </div>
  );
}
