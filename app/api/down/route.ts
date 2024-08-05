import { fetchPageContent } from "@/lib/web-content";
import { kv } from "@vercel/kv";
import { htmlToText } from "html-to-text";

export const dynamic = "force-dynamic"; // static by default, unless reading the request
export const maxDuration = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (url) {
    try {
      const hit = await kv.get<string>(url);
      if (hit) {
        return Response.json({ content: hit });
      }
      const htmlContent = await fetchPageContent(url);
      const plainText = htmlToText(htmlContent, {
        wordwrap: 130,
      });
      await kv.set<string>(url, plainText);
      return Response.json({ content: plainText });
    } catch (e) {
      return Response.json({ content: "" });
    }
  }
  return Response.json({ message: "no url" }, { status: 400 });
}
