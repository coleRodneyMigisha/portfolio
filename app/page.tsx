import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Home Page (/)</h1>
      <p>Plain text home route for static export.</p>
      <ul>
        <li>
          <Link href="/work/test-project">Go to /work/test-project</Link>
        </li>
        <li>
          <Link href="/non-existent-route">Test 404 Page</Link>
        </li>
      </ul>
    </main>
  );
}
