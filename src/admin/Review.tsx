import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Cover } from '../components/shared';
import { CONTRIB_LABEL, type Project } from '../types';

/** Every project must be read and explicitly approved here before it goes live. */
export default function Review() {
  const [list, setList] = useState<Project[]>([]); const [err, setErr] = useState<Record<number, string>>({});
  const load = useCallback(async () => setList(await api('GET', '/api/admin/projects')), []);
  useEffect(() => { load(); }, [load]);
  const act = async (p: Project, s: string) => { try { setErr({}); await api('POST', `/api/admin/projects/${p.id}/status`, { status: s }); load(); } catch (e: any) { setErr({ [p.id]: e.message }); } };
  const queue = list.filter((p) => p.status !== 'published');
  return (<div><h1 className="display text-5xl">Review & publish</h1>
    <p className="mt-2 max-w-2xl text-sm text-ink/60">Nothing is public until you press <b>Approve & publish</b> here. Read each description carefully — only claims you can stand behind.</p>
    <div className="mt-8 space-y-10">{queue.map((p) => (
      <article key={p.id} className="grid gap-6 border border-ink/15 bg-white/50 p-5 md:grid-cols-[260px_1fr]">
        <div className="aspect-[4/5] overflow-hidden bg-paper md:aspect-square"><Cover asset={p.cover} className="h-full w-full" /></div>
        <div><p className="label text-ink/50">{p.section} · {p.category || 'no category'} · {CONTRIB_LABEL[p.contribution]} · status: {p.status}</p>
          <h2 className="font-grotesk text-3xl font-bold">{p.title}</h2><p className="mt-2 font-serif text-xl italic">{p.summary || <span className="text-red-700">No summary yet</span>}</p>
          <dl className="mt-3 space-y-1 text-sm">{Object.entries(p.case_study).filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="label inline text-ink/50">{k}: </dt><dd className="inline">{v}</dd></div>)}</dl>
          <p className="mt-2 text-sm text-ink/60">Files: {p.assets.length} · Credits: {p.credits || '—'} · Tools: {p.tools.join(', ') || '—'}</p>
          {err[p.id] && <p role="alert" className="mt-2 text-sm text-red-700">{err[p.id]}</p>}
          <div className="mt-4 flex flex-wrap gap-2"><Link className="btn" to={`/admin/projects/${p.id}`}>Edit</Link><button className="btn btn-sun" onClick={() => act(p, 'published')}>Approve & publish</button>{p.status === 'review' && <button className="btn" onClick={() => act(p, 'draft')}>Back to draft</button>}</div></div>
      </article>))}
      {!queue.length && <p className="text-ink/50">Nothing waiting for review.</p>}</div>
    {list.some((p) => p.status === 'published') && <><h2 className="mt-14 font-grotesk text-2xl font-bold">Live now</h2>
      <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">{list.filter((p) => p.status === 'published').map((p) => <li key={p.id} className="flex items-center justify-between py-3"><span>{p.title}</span><span className="flex gap-2"><Link className="btn !py-1" to={`/work/${p.slug}`} target="_blank">View ↗</Link><button className="btn !py-1" onClick={() => act(p, 'unpublished')}>Unpublish</button></span></li>)}</ul></>}
  </div>);
}
