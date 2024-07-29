import axios from 'axios';
import * as cheerio from 'cheerio';

class YcStory {
    id: number;
    url: string;
    title: string;
    description: string;
    comments: string[];
    score: number;
    content: string;

    constructor(id: number, url: string, title: string, description: string, comments: string[], score: number, content: string) {
        this.id = id;
        this.url = url || "";
        this.title = title;
        this.description = description;
        this.comments = comments;
        this.score = score;
        this.content = content;
    }

    toString(): string {
        const commentsStr = this.comments.slice(0, 5).join("\n"); // Limiting to the first 5 comments for preview
        return (
            `ID: ${this.id}\n` +
            `Title: ${this.title}\n` +
            `URL: ${this.url}\n` +
            `Description: ${this.description}\n` +
            `Score: ${this.score}\n` +
            `Comments: ${this.comments.length}\n` +
            `Content: ${this.content.slice(0, 500)}...\n` +
            `Top Comments:\n${commentsStr}...`
        );
    }
}

async function getYcContentById(id: number): Promise<any> {
    const response = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`);
    return response.data;
}

async function extractContentFromUrl(url: string): Promise<string> {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const paragraphs = $('p').toArray();
        const content = paragraphs.map(paragraph => $(paragraph).text()).join("\n");
        return content;
    } catch (error) {
        console.error(`Failed to extract content from ${url}:`, error);
        return "";
    }
}

async function getComments(commentIds: number[]): Promise<string[]> {
    const comments: string[] = [];
    await Promise.all(commentIds.map(async (id) => {
        const comment = await getYcContentById(id);
        if (comment.text) {
            comments.push(comment.text);
        }
        if (comment.kids) {
            const nestedComments = await getComments(comment.kids);
            comments.push(...nestedComments);
        }
    }));
    return comments;
}

async function fetchStory(maxId: number, i: number): Promise<YcStory | null> {
    let item = await getYcContentById(maxId - i);

    while (item.type !== "story" && item.type === "comment") {
        item = await getYcContentById(item.parent);
    }

    if (item.dead) {
        return null;
    }

    let comments: string[] = [];
    if (item.kids) {
        comments = await getComments(item.kids);
    }

    let content = item.text || "";
    if (!content && item.url) {
        content = await extractContentFromUrl(item.url);
        if (!content) {
            content = comments.slice(0, 5).join(" "); // Use top 5 comments if content is not available
        }
    }

    return new YcStory(
        item.id,
        item.url,
        item.title,
        item.text || "",
        comments,
        item.score || 0,
        content
    );
}

async function getYcRecentStories(uniqueCount: number = 10, sortBy: string = 'comments'): Promise<YcStory[]> {
    const maxIdResp = await axios.get("https://hacker-news.firebaseio.com/v0/maxitem.json?print=pretty");
    const maxId = parseInt(maxIdResp.data);
    const stories: YcStory[] = [];

    const promises = [];
    for (let i = 1; i <= uniqueCount * 2; i++) {
        promises.push(fetchStory(maxId, i));
    }

    const results = await Promise.all(promises);
    for (const story of results) {
        if (story && !stories.some(s => s.id === story.id)) {
            stories.push(story);
        }
        if (stories.length >= uniqueCount) {
            break;
        }
    }

    if (sortBy === 'comments') {
        stories.sort((a, b) => b.comments.length - a.comments.length);
    } else if (sortBy === 'score') {
        stories.sort((a, b) => b.score - a.score);
    }

    return stories.slice(0, uniqueCount);
}

export {getYcRecentStories};
export {YcStory};