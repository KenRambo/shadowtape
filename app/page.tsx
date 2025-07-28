// app/page.tsx
"use client";

import dynamic from "next/dynamic";

const CandleChart = dynamic(() => import("@/components/CandleChart"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold mb-4">ShadowTape</h1>
      <p className="text-md mb-6 text-gray-400">Pattern Recognition | Discipline | Survival</p>
      <div className="w-full max-w-5xl">
        <CandleChart />
      </div>
    </main>
  );
}
