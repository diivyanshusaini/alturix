import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { api } from '../api';
import Library from './Library'; import Projects from './Projects'; import ProjectEditor from './ProjectEditor';
import Review from './Review'; import Messages from './Messages'; import SettingsPage from './SettingsPage';

export default function AdminApp() {
  const [admin, setAdmin] = useState<boolean | null>(null); const [err, setErr] = useState('');
  useEffect(() => { api<{ admin: boolean }>('GET', '/api/auth/me').then((r) => setAdmin(r.admin)); }, []);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr('');
    try { await api('POST', '/api/auth/login', { password: new FormData(e.currentTarget).get('password') }); setAdmin(true); } catch (x: any) { setErr(x.message); }
  }
  if (admin === null) return null;
  if (!admin) return (
    <div className="grid min-h-screen place-items-center px-5">
      <form onSubmit={login} className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-3">
          <img src="/alturix-logo.png" alt="ALTURIX" className="h-5 w-auto" />
          <span className="label text-ink/50">admin</span>
        </div>
        <label className="block"><span className="label">Password</span><input autoFocus type="password" name="password" required className="field mt-2" /></label>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button className="btn btn-sun w-full justify-center">Enter</button>
        <Link to="/" className="label block text-center text-ink/50 underline">← Back to site</Link>
      </form>
    </div>);
  const tab = ({ isActive }: { isActive: boolean }) => `label rounded-full px-4 py-2 ${isActive ? 'bg-ink text-ivory' : 'hover:bg-paper'}`;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-5 py-3">
          <Link to="/admin" className="mr-4 inline-flex items-center"><img src="/alturix-logo.png" alt="ALTURIX" className="h-5 w-auto" /></Link>
          <NavLink to="/admin" end className={tab}>Upload library</NavLink><NavLink to="/admin/projects" className={tab}>Projects</NavLink>
          <NavLink to="/admin/review" className={tab}>Review & publish</NavLink><NavLink to="/admin/messages" className={tab}>Messages</NavLink><NavLink to="/admin/settings" className={tab}>Edit Sections & Settings</NavLink>
          <span className="ml-auto flex gap-2"><a href="/?preview=1" target="_blank" rel="noreferrer" className="btn !py-1.5">Preview site (with drafts) ↗</a>
            <button className="btn !py-1.5" onClick={async () => { await api('POST', '/api/auth/logout'); setAdmin(false); }}>Log out</button></span>
        </div>
      </header>
      <div className="mx-auto max-w-[1400px] px-5 py-8">
        <Routes><Route index element={<Library />} /><Route path="projects" element={<Projects />} /><Route path="projects/:id" element={<ProjectEditor />} />
          <Route path="review" element={<Review />} /><Route path="messages" element={<Messages />} /><Route path="settings" element={<SettingsPage />} /></Routes>
      </div>
    </div>);
}
