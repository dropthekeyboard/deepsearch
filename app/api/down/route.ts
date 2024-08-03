import { fetchPageContent } from "@/lib/web-content";
import { htmlToText } from "html-to-text";

export const dynamic = 'force-dynamic'; // static by default, unless reading the request
export const maxDuration = 30;

export async function GET(req: Request) {
    const {searchParams} = new URL(req.url);
    const url = searchParams.get('url');
    if(url) {
        const htmlContent = await fetchPageContent(url);
    const plainText = htmlToText(htmlContent, {
        wordwrap: 130
    });
    return Response.json({content: plainText});
    }
    return Response.json({message: 'no url'}, {status: 400});
}
