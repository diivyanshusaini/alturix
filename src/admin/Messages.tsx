import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { Message } from '../types';
export default function Messages() {
  const [list, setList] = useState<Message[]>([]); const load = useCallback(async () => setList(await api('GET', '/api/admin/messages')), []);
  useEffect(() => { load(); }, [load]);
  return (<div><h1 className="display text-5xl">Messages</h1>
    <ul className="mt-6 space-y-4">{list.map((m) => (<li key={m.id} className={`border p-5 ${m.is_read ? 'border-ink/10' : 'border-ink bg-sun/20'}`}>
      <div className="flex flex-wrap justify-between gap-2"><p className="font-grotesk text-lg font-medium">{m.name} · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a></p><p className="label text-ink/50">{m.created_at}</p></div>
      <p className="mt-3 whitespace-pre-wrap">{m.body}</p>
      <div className="mt-3 flex gap-2"><button className="btn !py-1" onClick={async () => { await api('PATCH', `/api/admin/messages/${m.id}`, { is_read: !m.is_read }); load(); }}>{m.is_read ? 'Mark unread' : 'Mark read'}</button>
        <button className="btn !py-1" onClick={async () => { if (confirm('Delete message?')) { await api('DELETE', `/api/admin/messages/${m.id}`); load(); } }}>Delete</button></div></li>))}</ul>
    {!list.length && <p className="mt-10 text-ink/50">No messages yet.</p>}</div>);
}
