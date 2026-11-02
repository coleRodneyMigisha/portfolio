'use client';

import { useEffect, useState } from 'react';
import { getAge } from '@/lib/age';

// The site only rebuilds on a push, so the visitor's browser supplies the current age
export default function Age({ buildAge }: { buildAge: number }) {
  const [age, setAge] = useState(buildAge);

  useEffect(() => {
    setAge(getAge(new Date()));
  }, []);

  return <>{age}</>;
}
