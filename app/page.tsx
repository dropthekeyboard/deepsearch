"use client";
import { DownloadView } from "@/components/download";
import ResearchView from "@/components/research";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkerProvider } from "@/context/WorkerContext";

export default function Home() {

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <WorkerProvider>
        <Tabs className="w-[70vw]" defaultValue="download">
          <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="download">Download</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
          </TabsList>
          <TabsContent value="research">
            <ResearchView />
          </TabsContent>
          <TabsContent value="download">
            <DownloadView />
          </TabsContent>
        </Tabs>
      </WorkerProvider>
    </div>
  );
}
