"use server"
import { CustomSearchQueryParams, fetchSearchResults, search } from "@/lib/google";
import { RetrievalResult, WebSearchResult } from "@/types";
import puppeteer from 'puppeteer';
import { getYcRecentStories } from "@/lib/yc";
import { htmlToText } from 'html-to-text';
import { fetchPageContent, fetchPageContentAlt } from "@/lib/web-content";
import { extractDateFromSnippet, generateUniqueKey } from "@/lib/utils";
import { kv } from "@vercel/kv";


async function GetGoogleContent(query: string, count: number): Promise<WebSearchResult[]> {
    console.log(`${query} / ${count}`)
    const results = search({
        term: query,
        numResults: count,
        advanced: true,
    });
    let response: WebSearchResult[] = [];
    while (true) {
        const result = await results.next();
        const { value, done } = result;
        if (done) {
            break;
        }
        if (value) {
            console.log(value);
            response.push({ ...value as WebSearchResult });
        } else {
            break;
        }
    }
    return response as WebSearchResult[];
}


async function GetGoogleContent2(query: string, count: number): Promise<WebSearchResult[]> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://www.google.com`);

    await page.type('textarea[name="q"]', query);
    await page.keyboard.press('Enter');
    await page.waitForSelector('div#search');

    const results: WebSearchResult[] = await page.evaluate(() => {
        const data: WebSearchResult[] = [];
        const items = document.querySelectorAll('div.g, div.vdQmEd');

        items.forEach((item) => {
            let titleElement = item.querySelector('h3');
            let linkElement = item.querySelector('a');
            let snippetElement = item.querySelector('.VwiC3b span, .d8lRkd span');
            let dateElement = item.querySelector('.f');

            if (!titleElement) {
                titleElement = item.querySelector('.CCgQ5');
            }

            const title = titleElement?.innerText || '';
            const url = linkElement?.href || '';
            const description = snippetElement?.innerHTML || '';
            const dateText = dateElement?.innerHTML || '';
            const date = dateText ? new Date(dateText) : null;

            data.push({
                id: generateUniqueKey(`google.${url}.${description}`),
                query: query,
                source: 'Google',
                isIndexed: false,
                url,
                title,
                description,
                contentDate: date,
                searchDate: new Date(),
            });
        });

        return data;
    });

    await browser.close();
    return results.slice(0, count);
}


async function GetGoogleContent3(query: string, count: number, periodInDays: number = 7): Promise<WebSearchResult[] | Error> {
    let results: WebSearchResult[] = [];
    if (count > 100) {
        return new Error("count should be lower than or equal to 100");
    }
    let fetchedCount = 0;
    let searchParam: CustomSearchQueryParams = { q: query, num: 10, start: 0, dateRestrict: `d${periodInDays}` };
    while (fetchedCount < count) {
        const result = await fetchSearchResults(searchParam);
        const list = result.items.map(({ link, title, snippet }) => {
            // snippet contains the time information at the beginning somehting like "6 days ago ... 5 AI Startups include.." or "Jul 5, 2024 ... 60 Growing AI Companies"
            // so parse date from the text
            const date = extractDateFromSnippet(snippet);
            return {
                id: generateUniqueKey(`google.${link}.${snippet}`),
                query,
                title,
                url: link,
                description: snippet,
                contentDate: date,
                searchDate: new Date(),
                source: "google",
            } as WebSearchResult;
        });
        console.log(list);
        fetchedCount += list.length;
        const next = result.queries.nextPage;
        if (next) {
            searchParam = { ...searchParam, start: next[0].startIndex };
        } else {
            break;
        }
        results = [...results, ...list];
    }

    return results;
}

async function GetYcRecentStories(query: string, count: number, periodInDays: number = 7): Promise<WebSearchResult[] | Error> {
    const ycResults = await getYcRecentStories(count);
    if (ycResults) {
        const results: WebSearchResult[] = ycResults.map(({ title, url, description, content }) => ({
            id: generateUniqueKey(`yc.${url}.${description}`),
            query,
            title, url, isIndexed: false, description, content, contentDate: null, searchDate: new Date(), source: "hackernews"
        }));
        return results;
    } else {
        return [];
    }
}



async function getRetrievalStatus({ id }: { id: string }): Promise<RetrievalResult | null> {
    const result = await kv.get<RetrievalResult>(id);
    return result;
}

import { inngest } from "@/inngest/client";

const downloadContentDirect = async (pendingResult: RetrievalResult) => {
    const { id, url } = pendingResult;
    if (id) {
        try {
            console.log("download requested : ", url);
            const html = await fetchPageContent(url);
            const content = htmlToText(html, { wordwrap: 130 });
            console.log("retrieved: ", content);
            const successfulResult: RetrievalResult = { url, id, status: "success", content };
            await kv.set<RetrievalResult>(id, successfulResult);
            console.log(successfulResult);
            return successfulResult;
        } catch (e) {
            await kv.set<RetrievalResult>(id, { id, url, status: 'error' });
            throw e;
        }
    }
    throw new Error("invalid data format");
}


async function createRetrievalTask(url: string): Promise<RetrievalResult> {
    const key = generateUniqueKey(url);
    // const hit = await kv.get<RetrievalResult>(key);
    // if (hit) {
    //     console.log("", hit);
    //     return hit;
    // }
    // we need something to prevent overloading inngest
    const result: RetrievalResult = {
        url,
        id: key,
        status: "pending"
    };
    kv.set(key, result);
    inngest.send({ name: "download/url", data: result });
    return { url, id: key, status: 'pending' };
}


async function fetchPlainTextContentLegacy(url: string): Promise<string> {
    const htmlContent = await fetchPageContentAlt(url);
    const plainText = htmlToText(htmlContent, {
        wordwrap: 130
    });
    return plainText;
}


export { GetGoogleContent, GetGoogleContent2, GetGoogleContent3, GetYcRecentStories, createRetrievalTask, getRetrievalStatus, fetchPlainTextContentLegacy };