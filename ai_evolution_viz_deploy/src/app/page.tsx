'use client';

import dynamic from 'next/dynamic';

// Dynamically import the AIEvolutionVisualizer component with no SSR
// This is necessary because vis-timeline and react-force-graph use browser-specific APIs
const AIEvolutionVisualizerWithNoSSR = dynamic(
  () => import('../components/AIEvolutionVisualizer'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <AIEvolutionVisualizerWithNoSSR />
    </main>
  );
}
