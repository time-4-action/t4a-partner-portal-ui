'use client';

import { useState, useEffect } from 'react';

/**
 * Contact — public "get in touch" surface. Visually aligned with the Integrations
 * pages (Shopify / Own Sources): header card with a glowing icon tile + badge pill,
 * a two-column layout (form card + info rail), and the border-based input style
 * (`bg-neutral-900/60` + `focus:border-[#01a0be]`) those pages use.
 */

const ACCENT = '#01a0be';

const inputCls =
  'w-full rounded-lg border border-neutral-700 bg-neutral-900/60 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 transition-colors focus:border-[#01a0be] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

function MailIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const HELP_TOPICS = [
  'Product data synchronization',
  'Shopify & Own Sources integrations',
  'Export configuration and presets',
  'Account access and roles',
];

const EXPECTATIONS = [
  'Your message reaches the Patrik team directly.',
  'We typically reply within one business day.',
  'Include your store domain or export name to speed things up.',
];

export default function ContactPage() {
  const [status, setStatus] = useState('');

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('sending');

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/nextapi/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatus('success');
        event.target.reset();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setStatus('error');
        console.error('Server error:', errorData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setStatus('error');
    }
  }

  return (
    <div className="relative bg-transparent py-8">
      {/* Match the navbar's container exactly so left/right edges align pixel-precise (see Navbar.js) */}
      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* ----------------------------- Header ----------------------------- */}
        {/* Compact header — small icon + title + badge on one line, matching the Export / Shopify / Own Sources pages. */}
        <header className="mb-6 flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#01a0be]/30 bg-[#01a0be]/10">
            <MailIcon className="h-5 w-5 text-[#01a0be]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Contact us</h1>
              <span className="inline-flex items-center rounded-full border border-[#01a0be]/25 bg-[#01a0be]/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-[#01a0be]">
                Support
              </span>
            </div>
            <p className="truncate text-xs text-neutral-500">
              Questions about product data synchronization, integrations or anything else? Send us a note and we&apos;ll get back to you.
            </p>
          </div>
        </header>

        {/* Notice banner */}
        {status === 'success' && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 animate-fade-in">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div>
              <p className="font-medium text-emerald-200">Message sent successfully</p>
              <p className="mt-0.5 text-emerald-300/70">We&apos;ll get back to you as soon as possible.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-fade-in">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-red-200">Failed to send message</p>
              <p className="mt-0.5 text-red-300/70">Please try again later or contact us directly.</p>
            </div>
          </div>
        )}

        {/* --------------------- Two-column: form + info rail --------------------- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Form card */}
          <section className="lg:col-span-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
            <h2 className="text-xl font-semibold text-white">Send a message</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-400">
              Tell us a little about what you need and the best way to reach you.
            </p>

            <form onSubmit={handleSubmit} method="POST" className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-neutral-300">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    autoComplete="name"
                    required
                    disabled={status === 'sending'}
                    placeholder="Jane Doe"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-neutral-300">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    id="company"
                    autoComplete="organization"
                    required
                    disabled={status === 'sending'}
                    placeholder="Acme Sports"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  required
                  disabled={status === 'sending'}
                  placeholder="you@company.com"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={5}
                  required
                  disabled={status === 'sending'}
                  placeholder="How can we help?"
                  defaultValue={''}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="flex justify-center pt-1">
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#01a0be] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#01a0be]/20 transition-all hover:bg-[#018a9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01a0be] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'sending' ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Sending…</span>
                    </>
                  ) : (
                    <span>Let&apos;s talk</span>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Info rail */}
          <aside className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white">What we can help with</h3>
              <ul className="mt-4 space-y-3">
                {HELP_TOPICS.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-neutral-400">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#01a0be]" />
                    {t}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <MailIcon className="h-4 w-4 text-[#01a0be]" />
                What to expect
              </h3>
              <ul className="mt-4 space-y-3">
                {EXPECTATIONS.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-neutral-400">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#01a0be]" />
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
