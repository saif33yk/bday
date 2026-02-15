'use client';

import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    // Redirect to birthday page
    window.location.href = '/birthday';
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Loading your birthday surprise...</p>
    </div>
  );
}
