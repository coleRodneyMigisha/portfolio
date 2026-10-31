import Link from 'next/link';

export default function TestProjectPage() {
  return (
    <main>
      <h1>Work: Test Project (/work/test-project)</h1>
      <p>Plain text project route for static export.</p>
      <p>
        <Link href="/">Back to Home (/)</Link>
      </p>
    </main>
  );
}
