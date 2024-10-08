"use client";
import { DownloadView } from "@/components/download";
import ResearchView from "@/components/research";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkerProvider } from "@/context/WorkerContext";
import { Search, Download } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <WorkerProvider>
        <Tabs className="w-[70vw]" defaultValue="research">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="research" className="flex items-center gap-2">
              <Search size={16} />
              RESEARCH
            </TabsTrigger>
            <TabsTrigger value="download" className="flex items-center gap-2">
              <Download size={16} />
              DOWNLOAD
            </TabsTrigger>
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