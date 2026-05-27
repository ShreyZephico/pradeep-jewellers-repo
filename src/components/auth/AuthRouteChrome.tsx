'use client';

import { useEffect } from 'react';

/** Full-screen auth routes: hide site chrome and restore on leave */
export default function AuthRouteChrome() {
  useEffect(() => {
    document.body.classList.add('auth-route');

    return () => {
      document.body.classList.remove('auth-route');
    };
  }, []);

  return null;
}
