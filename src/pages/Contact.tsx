import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { Mark, useFetch } from '../components/shared';
import type { Settings } from '../types';

export default function Contact() {
  const { data: s } = useFetch<Settings>('/api/public/settings');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api('POST', '/api/public/contact', f);
      setState('done');
    } catch (x: any) {
      setErr(x.message);
      setState('error');
    }
  }

  const ig = s?.instagram
    ? s.instagram.startsWith('http')
      ? s.instagram
      : `https://instagram.com/${s.instagram.replace('@', '')}`
    : '';

  return (
    <section className="mx-auto max-w-[1500px] px-5 pb-24 pt-14 md:px-10 md:pt-24">
      <h1 className="display h-xl">
        <Mark>Say hello.</Mark>
      </h1>

      <div className="mt-16 grid items-start gap-12 md:grid-cols-12">
        <div className="space-y-5 md:col-span-4">
          <p className="body-lg text-ink/75">
            Have a story, brand, or video edit in mind? Share a few details using the form and let&apos;s
            build something worth watching.
          </p>
          {ig && (
            <p className="pt-2">
              <a
                className="btn"
                href={ig}
                target="_blank"
                rel="noreferrer"
              >
                Instagram ↗
              </a>
            </p>
          )}
        </div>

        {state === 'done' ? (
          <p className="lead md:col-span-7 md:col-start-6">Thank you — message received.</p>
        ) : (
          <form onSubmit={submit} className="space-y-6 md:col-span-7 md:col-start-6">
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <label className="block">
              <span className="label">Name</span>
              <input required name="name" maxLength={100} className="field mt-2" />
            </label>
            <label className="block">
              <span className="label">Email</span>
              <input required type="email" name="email" className="field mt-2" />
            </label>
            <label className="block">
              <span className="label">Message</span>
              <textarea required name="body" rows={6} minLength={5} maxLength={4000} className="field mt-2" />
            </label>
            {state === 'error' && (
              <p role="alert" className="text-red-700">
                {err}
              </p>
            )}
            <button disabled={state === 'sending'} className="btn btn-sun">
              {state === 'sending' ? 'Sending…' : 'Send message →'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
