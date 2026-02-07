'use client';

import { useState, useEffect } from 'react';

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
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-3xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl">
            Contact Us
          </h2>
          <p className="mt-2 text-lg leading-8 text-neutral-300">
            Have questions about product data synchronization or anything else?
            We're here to help.
          </p>
        </div>

        {/* Success Alert */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl animate-fade-in">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-green-400 font-medium">Message sent successfully!</p>
                <p className="text-green-400/70 text-sm mt-0.5">We'll get back to you as soon as possible.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-fade-in">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-red-400 font-medium">Failed to send message</p>
                <p className="text-red-400/70 text-sm mt-0.5">Please try again later or contact us directly.</p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Form */}
        <form
          onSubmit={handleSubmit}
          method="POST"
          className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 rounded-2xl p-6 sm:p-8 border border-neutral-700/50"
        >
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold leading-6 text-neutral-100"
                >
                  Name
                </label>
                <div className="mt-2.5">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    autoComplete="name"
                    required
                    disabled={status === 'sending'}
                    className="block w-full rounded-lg border-0 bg-white/5 px-3.5 py-2.5 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-[#01a0be] sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-semibold leading-6 text-neutral-100"
                >
                  Company
                </label>
                <div className="mt-2.5">
                  <input
                    type="text"
                    name="company"
                    id="company"
                    autoComplete="organization"
                    required
                    disabled={status === 'sending'}
                    className="block w-full rounded-lg border-0 bg-white/5 px-3.5 py-2.5 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-[#01a0be] sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold leading-6 text-neutral-100"
                >
                  Email
                </label>
                <div className="mt-2.5">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    required
                    disabled={status === 'sending'}
                    className="block w-full rounded-lg border-0 bg-white/5 px-3.5 py-2.5 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-[#01a0be] sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold leading-6 text-neutral-100"
                >
                  Message
                </label>
                <div className="mt-2.5">
                  <textarea
                    name="message"
                    id="message"
                    rows={5}
                    required
                    disabled={status === 'sending'}
                    className="block w-full rounded-lg border-0 bg-white/5 px-3.5 py-2.5 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-[#01a0be] sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
                    defaultValue={""}
                  />
                </div>
              </div>
            </div>
            <div className="mt-8">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-[#01a0be] px-3.5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#018a9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01a0be] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {status === 'sending' ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Let's talk</span>
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}