"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="error-screen">
      <h1>Something interrupted the view.</h1>
      <p>Your saved props are still in this browser.</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
