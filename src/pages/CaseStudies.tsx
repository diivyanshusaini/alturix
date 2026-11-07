import { Link } from 'react-router-dom';
import { Cover, Empty, Mark, Reveal, useFetch } from '../components/shared';
import { CONTRIB_LABEL, type Project } from '../types';

export default function CaseStudies() {
  const { data, loading } = useFetch<Project[]>('/api/public/projects');
  const list = (data || []).filter((p) => Object.values(p.case_study).some(Boolean));
  return (
    <section className="mx-auto max-w-[1500px] px-5 pt-14 md:px-10 md:pt-24">
      <p className="label text-ink/60">Case studies</p>
      <h1 className="display h-xl mt-3"><Mark>The thinking.</Mark></h1>
      <p className="mt-8 max-w-xl body-lg text-ink/70">Brief, idea, execution and outcome — the journey behind selected projects.</p>
      <div className="mt-16 divide-y divide-ink/15 border-y border-ink/15">
        {loading ? null : list.length === 0 ? <div className="py-10"><Empty title="Case studies in progress." note="Each one is written only from verified project details." /></div> :
          list.map((p, i) => (
            <Reveal key={p.id}><Link to={`/work/${p.slug}`} className="group grid items-center gap-6 py-8 md:grid-cols-12">
              <span className="label md:col-span-1">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="display h-md md:col-span-6"><span className="mark">{p.title}</span></h2>
              <div className="label md:col-span-2 text-ink/60">{p.category}<br />{CONTRIB_LABEL[p.contribution]}</div>
              <div className="aspect-[16/10] overflow-hidden md:col-span-3"><Cover asset={p.cover} alt="" className="h-full w-full transition duration-700 group-hover:scale-105" /></div>
            </Link></Reveal>))}
      </div>
    </section>
  );
}
