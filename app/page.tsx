"use client";
import ResearchView from "@/components/research";
import { WorkerProvider } from "@/context/WorkerContext";

export default function Home() {
  console.log(process.env);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <WorkerProvider>
        <ResearchView />
      </WorkerProvider>
    </main>
  );
}
