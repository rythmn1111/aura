// pages/index.tsx
import Head from 'next/head';
import AdvancedFlowCanvas from '@/components/Canvas/AdvancedFlowCanvas';

export default function Home() {
  return (
    <>
      <Head>
        <title>Advanced Node Graph</title>
        <meta name="description" content="Interactive node graph with React Flow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <AdvancedFlowCanvas />
      </main>
    </>
  );
}