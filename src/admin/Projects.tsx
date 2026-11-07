import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Cover } from '../components/shared';
import { CONTRIB_LABEL, type Project } from '../types';

const SEC = { video: 'Video Editing', graphic: 'Graphic Design', experiment: 'Experiments' } as const;
const COLOR = { draft: 'bg-paper', review: 'bg-sun/60', published: 'bg-green-200', unpublished: 'bg-red-100' } as const;
export default function Projects() {
  const nav = useNavigate(); const [list, setList] = useState<Project[]>([]); const [filter, setFilter] = useState('all');
  const load = useCallback(async () => setList(await api('GET', '/api/admin/projects')), []);
  useEffect(() => { load(); }, [load]);
  async function create(section: string) { const p = await api<Project>('POST', '/api/admin/projects', { title: 'Untitled project', section }); nav(`/admin/projects/${p.id}`); }
  async function move(i: number, d: number) { const a = [...list]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setList(a); await api('POST', '/api/admin/projects/reorder', { ids: a.map((p) => p.id) }); }
  const shown = list.filter((p) => filter === 'all' || p.section === filter || p.status === filter);
  return (<div>
    <div className="flex flex-wrap items-end justify-between gap-4"><h1 className="display text-5xl">Curated projects</h1>
      <div className="flex gap-2"><button className="btn btn-sun" onClick={() => create('video')}>+ Video project</button><button className="btn" onClick={() => create('graphic')}>+ Design project</button><button className="btn" onClick={() => create('experiment')}>+ Experiment</button></div></div>
    <div className="mt-6 flex flex-wrap gap-2">{['all', 'video', 'graphic', 'experiment', 'draft', 'review', 'published', 'unpublished'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`btn !py-1 ${filter === f ? 'bg-ink text-ivory' : ''}`}>{f}</button>)}</div>
    <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
      {shown.map((p) => { const i = list.indexOf(p); return (
        <li key={p.id} className="flex items-center gap-4 py-3">
          <div className="h-16 w-24 shrink-0 overflow-hidden bg-paper"><Cover asset={p.cover} className="h-full w-full" /></div>
          <div className="min-w-0 flex-1"><Link to={`/admin/projects/${p.id}`} className="block truncate font-grotesk text-lg font-medium hover:underline">{p.featured && '★ '}{p.title}</Link>
            <p className="label text-ink/50">{SEC[p.section]} · {CONTRIB_LABEL[p.contribution]} · {p.assets.length} files</p></div>
          <span className={`label rounded-full px-3 py-1 ${COLOR[p.status]}`}>{p.status}</span>
          <div className="flex gap-1"><button aria-label="Move up" className="btn !px-3 !py-1" onClick={() => move(i, -1)}>↑</button><button aria-label="Move down" className="btn !px-3 !py-1" onClick={() => move(i, 1)}>↓</button></div>
        </li>); })}
    </ul>{shown.length === 0 && <p className="py-10 text-center text-ink/50">No projects yet. Upload work in the library, then create a project from it.</p>}
  </div>);
}
