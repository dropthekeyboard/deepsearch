import { fetchPageContent, fetchPageContentAlt } from "@/lib/web-content";
import { inngest } from "./client";
import { RetrievalResult } from "@/types";
import { htmlToText } from "html-to-text";
import { kv } from "@vercel/kv";

export const downloadContent = inngest.createFunction({ id: "download-url" }, { event: "download/url" }, async ({ event, step }) => {
  const { url, id } = event.data as RetrievalResult;
  try {
    const html = await fetchPageContent(url);
    const content = htmlToText(html, {wordwrap: 130});
    console.log("retrieved: ", content);
    await kv.set<RetrievalResult>(id, {...event.data, status:"success", content});
    return content
  } catch (e) {
    await kv.set(id, {id, url, status:'error'});
  }
});


export const downloadContentAlt = inngest.createFunction({ id: "download-url-alt" }, { event: "download/url.alt" }, async ({ event, step }) => {
  const { url, id } = event.data as RetrievalResult;
  try {
    const html = await fetchPageContentAlt(url);
    const content = htmlToText(html, {wordwrap: 130});
    console.log("retrieved: ", content);
    await kv.set<RetrievalResult>(id, {...event.data, status:"success", content});
    return content
  } catch (e) {
    await kv.set(id, {id, url, status:'error'});
  }
});


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "30s");
    return { event, body: "Hello, World!" };
  },
);