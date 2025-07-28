import { useEffect, useState } from 'react';
import './App.css';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for fonts to load
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blazersRed via-black to-blazersRed text-white font-sans">
        <h1 className="text-3xl font-bold">Loading Rip City Tickets…</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blazersRed via-black to-blazersRed text-white font-sans">
      <header className="p-6 text-center text-4xl font-extrabold">🏀 Rip City Tickets</header>
      <main className="px-6 text-center">
        <p className="mb-6">Join Stake.us with promo code <span className="font-mono bg-white text-black px-2 py-1 rounded">RIPCITYTICKETS</span></p>
        <a href="https://stake.us/?c=RIPCITYTICKETS" target="_blank" className="inline-block bg-white text-black px-6 py-3 rounded font-bold hover:bg-blazersSilver">Claim Bonus</a>
      </main>
    </div>
  );
}
