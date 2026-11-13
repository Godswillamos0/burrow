'use client';

import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  return new Promise((resolve, reject) => {
    const s = existing || document.createElement('script');
    s.addEventListener('load', () => resolve());
    s.addEventListener('error', () => reject(new Error('Turnstile failed to load')));
    if (!existing) {
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
  });
}

export interface TurnstileHandle {
  reset: () => void;
}

/** Cloudflare Turnstile bot check. Renders nothing when no site key is configured. */
export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string | null) => void }>(
  function Turnstile({ onToken }, ref) {
    const boxRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    useImperativeHandle(ref, () => ({
      reset: () => {
        onTokenRef.current(null);
        if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
      },
    }));

    useEffect(() => {
      if (!TURNSTILE_SITE_KEY || !boxRef.current) return;
      let cancelled = false;
      loadScript()
        .then(() => {
          if (cancelled || !boxRef.current || !window.turnstile) return;
          widgetId.current = window.turnstile.render(boxRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            theme: 'dark',
            size: 'flexible',
            callback: (t: string) => onTokenRef.current(t),
            'expired-callback': () => onTokenRef.current(null),
            'error-callback': () => onTokenRef.current(null),
          });
        })
        .catch(() => onTokenRef.current(null));
      return () => {
        cancelled = true;
        if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      };
    }, []);

    if (!TURNSTILE_SITE_KEY) return null;
    return <div ref={boxRef} className="w-full min-h-[65px]" />;
  }
);
