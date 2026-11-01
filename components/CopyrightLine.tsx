'use client';

import { useEffect, useState } from 'react';

const FIRST_YEAR = 2026;

// The site only rebuilds on a push, so the visitor's browser supplies the year
export default function CopyrightLine({ name }: { name: string }) {
  const [year, setYear] = useState(FIRST_YEAR);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <p className="footer-copyright">
      &copy; {year} {name}. All rights reserved.
    </p>
  );
}
