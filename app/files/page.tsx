"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkerProvider } from "@/context/WorkerContext";
import { Search, Upload } from "lucide-react";

export default function FileChat() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <WorkerProvider>
        <Tabs className="w-[70vw]" defaultValue="research">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="research" className="flex items-center gap-2">
              <Search size={16} />
              RESEARCH
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Upload size={16} />
              ADD FILES
            </TabsTrigger>
          </TabsList>
          <TabsContent value="research">
          </TabsContent>
          <TabsContent value="add">
          </TabsContent>
        </Tabs>
      </WorkerProvider>
    </div>
  );
}