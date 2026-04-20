'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function ClaimListingPage() {
  const searchParams = useSearchParams();
  const initialBusiness = useMemo(() => searchParams.get('business') || '', [searchParams]);

  const [businessSlug, setBusinessSlug] = useState(initialBusiness);
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<SubmitState>('idle');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('submitting');
    setError('');

    try {
      const res = await fetch('/api/public/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug,
          businessName,
          fullName,
          email,
          phone,
          website,
          message,
          sourcePath: '/claim',
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to submit claim request.');
      setState('success');
    } catch (submitError) {
      setState('error');
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit claim request.');
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300">KalpTree Listing Claim</p>
          <h1 className="mt-2 text-3xl font-bold">Claim Your Business or Portfolio Listing</h1>
          <p className="mt-2 text-sm text-slate-300">
            Submit your claim. The team will verify ownership and connect the listing to your tenant workspace.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/discover" className="rounded-md border border-slate-700 px-2 py-1 hover:border-cyan-500/40">Back to Discover</Link>
            <Link href="/front-builder" className="rounded-md border border-slate-700 px-2 py-1 hover:border-cyan-500/40">Open Builder</Link>
          </div>
        </header>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/35 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Business Slug</span>
              <input
                value={businessSlug}
                onChange={(e) => setBusinessSlug(e.target.value)}
                placeholder="name-of-business"
                required
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Business Name</span>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Studio"
                required
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Your Name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                required
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@business.com"
                required
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91..."
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Website / Social Profile</span>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">Proof / Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Add claim proof details: official email, business registration, existing website ownership, etc."
              required
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={state === 'submitting'}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {state === 'submitting' ? 'Submitting...' : 'Submit Claim'}
            </button>
            {state === 'success' && <span className="text-sm text-emerald-300">Claim submitted. Team will contact you.</span>}
            {state === 'error' && <span className="text-sm text-rose-300">{error}</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
